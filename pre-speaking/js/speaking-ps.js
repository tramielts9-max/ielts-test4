/**
 * PRE-SPEAKING CONTROLLER (-ps)
 */

// 1. MÃ HÓA RUNTIME KEY: AQ.Ab8RN6LtC3sV50PTB_fOhfl2ACJyQ7KyOrvCnOvyAW8Sthw11w
const _AUTH_SEEDS = [
  65, 81, 46, 65, 98, 56, 82, 78, 54, 76, 116, 67, 51, 115, 86, 53,
  48, 80, 84, 66, 95, 102, 79, 104, 102, 108, 50, 65, 67, 74, 121,
  81, 55, 75, 121, 79, 114, 118, 67, 110, 79, 118, 121, 65, 87, 56,
  83, 116, 104, 119, 49, 49, 119
];

function getDecodedKey() {
  return _AUTH_SEEDS.map(c => String.fromCharCode(c)).join('');
}

// 2. DANH SÁCH MODEL AI DỰ PHÒNG THEO YÊU CẦU
const AI_MODELS = [
  "gemini-3.5-flash-lite", // Gọi trước tiên
  "gemini-3.1-flash-lite", // Hết lượt thì gọi tới
  "gemini-2.0-flash-lite", // Dự phòng nếu Google chưa phát hành bản 3.x
  "gemini-1.5-flash"
];

let categoriesData = [];
let currentCategory = null;
let currentLesson = null;
let ytPlayer = null;

let mediaRecorder = null;
let audioStream = null;
let audioChunks = [];
let audioContext = null;
let analyser = null;
let animationFrameId = null;

let timerInterval = null;
let secondsRecorded = 0;
const MIN_REQUIRED_DURATION = 15; // 15 giây nói tối thiểu

window.addEventListener('DOMContentLoaded', async () => {
  await loadCatalogAndLessons();
  initYouTubeAPI();
});

// TỰ ĐỘNG TẢI DỮ LIỆU TỪ FOLDER DATA (CÓ DỰ PHÒNG CHỐNG LỖI 404)
async function loadCatalogAndLessons() {
  try {
    const manifestRes = await fetch('data/manifest-ps.json');
    if (!manifestRes.ok) throw new Error("Chưa nạp được manifest-ps.json");
    const manifest = await manifestRes.json();
    const a1Config = manifest.catalogs.find(c => c.id === 'shadow_a1');

    const lessonsRes = await fetch(a1Config.dataFile);
    if (!lessonsRes.ok) throw new Error("Chưa nạp được lessons-ps.json");
    categoriesData = await lessonsRes.json();
  } catch (err) {
    console.warn("⚠️ Đang dùng kho bài nạp sẵn chống lỗi đường dẫn:", err.message);
    categoriesData = [
      {
        "category": "1. Giao tiếp cơ bản hàng ngày",
        "lessons": [
          { "id": "A1.01", "title": "Family and Relationships", "duration": "2:51", "durationSeconds": 171, "videoId": "UHMbJlKzNu8" },
          { "id": "A1.02", "title": "Travel and Holidays", "duration": "2:26", "durationSeconds": 146, "videoId": "gFkNhGDd8Ws" },
          { "id": "A1.03", "title": "Education and Learning", "duration": "3:22", "durationSeconds": 202, "videoId": "rnnb508zEHI" },
          { "id": "A1.04", "title": "Health and Fitness", "duration": "2:17", "durationSeconds": 137, "videoId": "IBx-k6iAOm4" },
          { "id": "A1.05", "title": "Work and Careers", "duration": "2:32", "durationSeconds": 152, "videoId": "DY3TDYBt9qU" }
        ]
      }
    ];
  }

  populateCategoryDropdown();
}

function populateCategoryDropdown() {
  const catSel = document.getElementById('categorySelect');
  catSel.innerHTML = '';
  categoriesData.forEach((group, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.innerText = group.category;
    catSel.appendChild(opt);
  });
  handleCategoryChange();
}

window.handleCategoryChange = () => {
  const catSel = document.getElementById('categorySelect');
  const lessonSel = document.getElementById('lessonSelect');
  const catIndex = parseInt(catSel.value);
  currentCategory = categoriesData[catIndex];

  lessonSel.innerHTML = '';
  currentCategory.lessons.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.innerText = `[${l.id}] ${l.title} (${l.duration})`;
    lessonSel.appendChild(opt);
  });

  handleLessonChange();
};

window.handleLessonChange = () => {
  const lessonId = document.getElementById('lessonSelect').value;
  currentLesson = currentCategory.lessons.find(l => l.id === lessonId);

  if (currentLesson) {
    document.getElementById('displayLessonTitle').innerText = `[${currentLesson.id}] ${currentLesson.title}`;
    document.getElementById('displayLessonDuration').innerText = `Thời lượng: ${currentLesson.duration}`;
    
    if (ytPlayer && ytPlayer.loadVideoById) {
      ytPlayer.loadVideoById(currentLesson.videoId);
    }
  }
  resetUI();
};

// YOUTUBE PLAYER CẤU HÌNH TƯƠNG THÍCH CAO
function initYouTubeAPI() {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = () => {
  let origin = window.location.origin;
  if (!origin || origin === 'null' || window.location.protocol === 'file:') {
    origin = 'https://localhost';
  }

  const defaultId = currentLesson ? currentLesson.videoId : "UHMbJlKzNu8";

  ytPlayer = new YT.Player('youtube-player', {
    videoId: defaultId,
    playerVars: {
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      origin: origin
    }
  });
};

// WEB AUDIO - TRIỆT TIÊU TIẾNG VỌNG LOA
async function startAudio() {
  try {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 16000
      }
    };

    audioStream = await navigator.mediaDevices.getUserMedia(constraints);
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(audioStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    drawMeter();

    audioChunks = [];
    let mimeType = 'audio/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/mp4';

    mediaRecorder = new MediaRecorder(audioStream, { mimeType });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.start(250);
    return true;
  } catch (err) {
    alert("Vui lòng cắm Micro và nhấn 'Cho phép' khi trình duyệt hỏi quyền Micro nhé!");
    return false;
  }
}

function drawMeter() {
  const canvas = document.getElementById('audioMeter');
  const ctx = canvas.getContext('2d');
  const data = new Uint8Array(analyser.frequencyBinCount);

  function render() {
    animationFrameId = requestAnimationFrame(render);
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    let avg = sum / data.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = avg > 80 ? '#22c55e' : (avg > 30 ? '#7c3aed' : '#475569');
    ctx.fillRect(0, 0, (avg / 255) * canvas.width, canvas.height);
  }
  render();
}

// BẬT / DỪNG THU ÂM
window.toggleShadowRecording = async () => {
  const btnRec = document.getElementById('btnRecord');
  const btnStop = document.getElementById('btnStop');

  resetUI();
  const ok = await startAudio();
  if (!ok) return;

  if (ytPlayer && ytPlayer.playVideo) {
    ytPlayer.seekTo(0, true);
    ytPlayer.playVideo();
  }

  secondsRecorded = 0;
  timerInterval = setInterval(() => {
    secondsRecorded++;
    const m = String(Math.floor(secondsRecorded / 60)).padStart(2, '0');
    const s = String(secondsRecorded % 60).padStart(2, '0');
    document.getElementById('timerDisplay').innerText = `${m}:${s}`;
  }, 1000);

  btnRec.disabled = true;
  btnRec.classList.add('recording');
  btnStop.disabled = false;
};

window.stopAndSubmitRecording = () => {
  const btnRec = document.getElementById('btnRecord');
  const btnStop = document.getElementById('btnStop');

  if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
  clearInterval(timerInterval);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.onstop = async () => {
      if (audioStream) audioStream.getTracks().forEach(t => t.stop());
      if (audioContext && audioContext.state !== 'closed') audioContext.close();

      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
      await evaluateAudioWithGemini(blob, secondsRecorded);
    };
    mediaRecorder.stop();
  }

  btnRec.disabled = false;
  btnRec.classList.remove('recording');
  btnStop.disabled = true;
};

// GỬI CHẤM AI VỚI FALLBACK TUẦN TỰ
async function evaluateAudioWithGemini(audioBlob, durationSec) {
  showOverlay("Đang nén file ghi âm...");
  
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  reader.onloadend = async () => {
    const base64Audio = reader.result.split(',')[1];
    const apiKey = getDecodedKey();

    const prompt = `
You are an English shadowing coach evaluating a student on lesson: "${currentLesson.title}".
Analyze audio and return pure JSON only (no markdown, no backticks):
{
  "transcript": "Exact transcription of spoken English",
  "overall_score": <Integer 0-100 matching lesson accuracy>,
  "fluency_score": <Integer 0-100 flow and continuity>,
  "pronunciation_score": <Integer 0-100 phoneme clarity>,
  "missed_words": ["words", "missed", "or", "unclear"],
  "feedback": "Short advice in Vietnamese (1 khen, 1 sua)"
}
`;

    let lastError = null;

    for (let i = 0; i < AI_MODELS.length; i++) {
      const model = AI_MODELS[i];
      try {
        showOverlay(`Đang chấm điểm qua: ${model}... (Tầng ${i + 1}/${AI_MODELS.length})`);

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: audioBlob.type || 'audio/webm', data: base64Audio } },
                { text: prompt }
              ]
            }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
          })
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error?.message || `Lỗi HTTP ${res.status}`);
        }

        const json = await res.json();
        const rawText = json.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(rawText);

        hideOverlay();
        renderGradingResult(parsed, durationSec);
        return;

      } catch (err) {
        console.warn(`Fallback từ ${model}:`, err.message);
        lastError = err;
      }
    }

    hideOverlay();
    alert("Lỗi chấm điểm: " + lastError.message);
  };
}

// BẢNG KẾT QUẢ VÀ DUYỆT BÀI
function renderGradingResult(data, durationSec) {
  document.getElementById('resOverall').innerText = data.overall_score;
  document.getElementById('resFluency').innerText = data.fluency_score;
  document.getElementById('resPronun').innerText = data.pronunciation_score;
  document.getElementById('resTranscript').innerText = data.transcript || "(Không nhận diện được giọng nói)";
  document.getElementById('resFeedback').innerText = data.feedback || "";

  const missedBox = document.getElementById('resMissedWords');
  missedBox.innerHTML = '';
  if (data.missed_words && data.missed_words.length > 0) {
    data.missed_words.forEach(w => {
      const sp = document.createElement('span');
      sp.className = "px-2 py-0.5 bg-red-950 text-red-300 border border-red-800 rounded font-mono text-xs";
      sp.innerText = w;
      missedBox.appendChild(sp);
    });
  } else {
    missedBox.innerHTML = '<span class="text-emerald-400 text-xs">🎉 Bạn phát âm rất rõ và không bị sót từ!</span>';
  }

  const isDurationPassed = durationSec >= MIN_REQUIRED_DURATION;
  const isScorePassed = data.overall_score >= 60;

  document.getElementById('valPacingText').innerHTML = `<b class="${isDurationPassed ? 'text-emerald-400' : 'text-rose-400'}">${durationSec}s</b> / ${MIN_REQUIRED_DURATION}s`;
  document.getElementById('valScoreText').innerHTML = `<b class="${isScorePassed ? 'text-emerald-400' : 'text-rose-400'}">${data.overall_score}%</b> (≥60%)`;

  const badge = document.getElementById('validationBadge');
  const completeBtn = document.getElementById('btnComplete');

  if (isDurationPassed && isScorePassed) {
    badge.className = "text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700";
    badge.innerText = "✓ ĐẠT YÊU CẦU";
    completeBtn.disabled = false;
  } else {
    badge.className = "text-xs font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700";
    badge.innerText = "✕ CHƯA ĐẠT";
    completeBtn.disabled = true;
  }

  audioChunks = []; // Dọn rác bộ nhớ
}

function resetUI() {
  document.getElementById('timerDisplay').innerText = "00:00";
  document.getElementById('resOverall').innerText = "--";
  document.getElementById('resFluency').innerText = "--";
  document.getElementById('resPronun').innerText = "--";
  document.getElementById('resTranscript').innerText = "(Chưa có bản ghi)";
  document.getElementById('resMissedWords').innerHTML = '<span class="text-slate-500 italic">Không có dữ liệu</span>';
  document.getElementById('resFeedback').innerText = "Bấm 'Bắt đầu Shadow' và nói đuổi theo video để AI chấm điểm nhé.";
  document.getElementById('validationBadge').className = "text-xs font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-400";
  document.getElementById('validationBadge').innerText = "Chờ nộp bài";
  document.getElementById('btnComplete').disabled = true;
}

window.completeLessonSubmission = () => {
  alert("🎉 Chúc mừng em đã hoàn thành bài tập nói Shadowing A1 đạt tiêu chuẩn!");
};

function showOverlay(txt) {
  document.getElementById('loadingText').innerText = txt;
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideOverlay() {
  document.getElementById('loadingOverlay').style.display = 'none';
}
