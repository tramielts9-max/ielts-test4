/**
 * PRE-SPEAKING CONTROLLER (-ps)
 * Dùng chuẩn xác Auth Seeds từ speaking.js đang chạy tốt của bạn
 */

// 1. MÃ HÓA RUNTIME AUTH KEY (LẤY TỪ BẢN GỐC SPEAKING.JS ĐANG CHẠY MƯỢT CỦA BẠN)
const _AUTH_SEEDS = [
  65, 81, 46, 65, 98, 56, 82, 78, 54, 75, 116, 80, 107, 51, 45, 50,
  75, 103, 117, 114, 119, 117, 116, 65, 115, 55, 95, 118, 82, 66,
  121, 81, 110, 113, 67, 48, 77, 86, 55, 52, 66, 119, 107, 82, 107,
  80, 110, 74, 89, 70, 90, 49, 119
];

function getDecodedKey() {
  return _AUTH_SEEDS.map(c => String.fromCharCode(c)).join('');
}

// 2. CHUỖI MODEL AI FALLBACK
const AI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.0-flash-lite",
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
const MIN_REQUIRED_DURATION = 15; // 15 giây

window.addEventListener('DOMContentLoaded', async () => {
  await loadCatalogAndLessons();
  initYouTubeAPI();
});

// NẠP DỮ LIỆU BÀI HỌC
async function loadCatalogAndLessons() {
  try {
    const manifestRes = await fetch('data/manifest-ps.json');
    if (!manifestRes.ok) throw new Error("Chưa có manifest");
    const manifest = await manifestRes.json();
    const a1Config = manifest.catalogs.find(c => c.id === 'shadow_a1');

    const lessonsRes = await fetch(a1Config.dataFile);
    if (!lessonsRes.ok) throw new Error("Chưa có lessons");
    categoriesData = await lessonsRes.json();
  } catch (err) {
    // Fallback an toàn nếu chưa kịp up folder data
    categoriesData = [
      {
        "category": "1. Giao tiếp đời sống hàng ngày",
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

// YOUTUBE API
function initYouTubeAPI() {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = () => {
  const defaultId = currentLesson ? currentLesson.videoId : "UHMbJlKzNu8";
  ytPlayer = new YT.Player('youtube-player', {
    videoId: defaultId,
    playerVars: {
      playsinline: 1,
      rel: 0,
      modestbranding: 1
    }
  });
};

// WEB AUDIO PIPELINE
async function startAudio() {
  try {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
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
    alert("Vui lòng cấp quyền Micro trên trình duyệt để luyện nói!");
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

// GỬI CHẤM AI VỚI AUTH KEY CHUẨN
async function evaluateAudioWithGemini(audioBlob, durationSec) {
  showOverlay("Đang xử lý file ghi âm...");
  
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  reader.onloadend = async () => {
    const base64Audio = reader.result.split(',')[1];
    const apiKey = getDecodedKey(); // Gọi Key chuẩn từ seeds gốc

    const promptText = `
Bạn là giáo viên phát âm tiếng Anh chấm bài Shadowing của học sinh cho bài: "${currentLesson.title}".
Hãy nghe đoạn âm thanh và trả về DUY NHẤT một chuỗi JSON thuần (không dùng markdown, không dùng backtick \`\`\`json):
{
  "transcript": "chép lại chính xác những gì học sinh nói bằng tiếng Anh",
  "overall_score": 75,
  "fluency_score": 80,
  "pronunciation_score": 70,
  "missed_words": ["từ", "bị", "phát", "âm", "sai"],
  "feedback": "Nhận xét ngắn gọn bằng tiếng Việt động viên học sinh (1 khen, 1 sửa)"
}
`;

    let lastError = null;

    for (let i = 0; i < AI_MODELS.length; i++) {
      const model = AI_MODELS[i];
      try {
        showOverlay(`Đang chấm qua model: ${model}...`);

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [
                { inline_data: { mime_type: audioBlob.type || 'audio/webm', data: base64Audio } },
                { text: promptText }
              ]
            }],
            generationConfig: {
              temperature: 0.2
            }
          })
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error?.message || `HTTP ${res.status}`);
        }

        const json = await res.json();
        let rawText = json.candidates[0].content.parts[0].text.trim();
        
        // Làm sạch nếu AI vô tình bọc trong ```json
        if (rawText.startsWith("```json")) rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
        else if (rawText.startsWith("```")) rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();

        const parsed = JSON.parse(rawText);
        hideOverlay();
        renderGradingResult(parsed, durationSec);
        return;

      } catch (err) {
        console.warn(`Model ${model} bị lỗi:`, err.message);
        lastError = err;
      }
    }

    hideOverlay();
    alert("Lỗi chấm điểm: " + lastError.message);
  };
}

// HIỂN THỊ KẾT QUẢ VÀ DUYỆT BÀI
function renderGradingResult(data, durationSec) {
  document.getElementById('resOverall').innerText = data.overall_score || 0;
  document.getElementById('resFluency').innerText = data.fluency_score || 0;
  document.getElementById('resPronun').innerText = data.pronunciation_score || 0;
  document.getElementById('resTranscript').innerText = data.transcript || "(Không bắt được giọng nói rõ ràng)";
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
    missedBox.innerHTML = '<span class="text-emerald-400 text-xs">🎉 Phát âm rất tốt, không bị sót từ!</span>';
  }

  const isDurationPassed = durationSec >= MIN_REQUIRED_DURATION;
  const isScorePassed = (data.overall_score || 0) >= 60;

  document.getElementById('valPacingText').innerHTML = `<b class="${isDurationPassed ? 'text-emerald-400' : 'text-rose-400'}">${durationSec}s</b> / ${MIN_REQUIRED_DURATION}s`;
  document.getElementById('valScoreText').innerHTML = `<b class="${isScorePassed ? 'text-emerald-400' : 'text-rose-400'}">${data.overall_score}%</b> (≥60%)`;

  const badge = document.getElementById('validationBadge');
  const completeBtn = document.getElementById('btnComplete');

  if (isDurationPassed && isScorePassed) {
    badge.className = "text-xs font-bold px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700";
    badge.innerText = "✓ ĐẠT YÊU CẦU";
    completeBtn.disabled = false;
  } else {
    badge.className = "text-xs font-bold px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-700";
    badge.innerText = "✕ CHƯA ĐẠT";
    completeBtn.disabled = true;
  }

  audioChunks = [];
}

function resetUI() {
  document.getElementById('timerDisplay').innerText = "00:00";
  document.getElementById('resOverall').innerText = "--";
  document.getElementById('resFluency').innerText = "--";
  document.getElementById('resPronun').innerText = "--";
  document.getElementById('resTranscript').innerText = "(Chưa có bản ghi)";
  document.getElementById('resMissedWords').innerHTML = '<span class="text-slate-500 italic">Không có dữ liệu</span>';
  document.getElementById('resFeedback').innerText = "Bấm 'Bắt đầu Shadow' và nói đuổi theo video để AI chấm điểm nhé.";
  document.getElementById('validationBadge').className = "text-xs font-bold px-2.5 py-1 rounded bg-slate-700 text-slate-400";
  document.getElementById('validationBadge').innerText = "Chờ nộp bài";
  document.getElementById('btnComplete').disabled = true;
}

window.completeLessonSubmission = () => {
  alert("🎉 Chúc mừng em đã hoàn thành bài tập nói Shadowing A1!");
};

function showOverlay(txt) {
  document.getElementById('loadingText').innerText = txt;
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideOverlay() {
  document.getElementById('loadingOverlay').style.display = 'none';
}
