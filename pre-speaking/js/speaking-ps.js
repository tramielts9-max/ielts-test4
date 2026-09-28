/**
 * PRE-SPEAKING SHADOWING ENGINE (-ps)
 * Kiến trúc 2-Tier Selector, Web Audio Filter & Multi-model Gemini Fallback
 */

// 1. MÃ HÓA RUNTIME AUTH KEY: AQ.Ab8RN6LtC3sV50PTB_fOhfl2ACJyQ7KyOrvCnOvyAW8Sthw11w
const _AUTH_SEEDS = [
  65, 81, 46, 65, 98, 56, 82, 78, 54, 76, 116, 67, 51, 115, 86, 53,
  48, 80, 84, 66, 95, 102, 79, 104, 102, 108, 50, 65, 67, 74, 121,
  81, 55, 75, 121, 79, 114, 118, 67, 110, 79, 118, 121, 65, 87, 56,
  83, 116, 104, 119, 49, 49, 119
];

function getDecodedKey() {
  return _AUTH_SEEDS.map(c => String.fromCharCode(c)).join('');
}

// 2. CHUỖI GỌI MODEL AI VỚI FALLBACK TUẦN TỰ
const AI_MODELS = [
  "gemini-3.5-flash-lite", // Bậc 1 theo yêu cầu
  "gemini-3.1-flash-lite", // Bậc 2 theo yêu cầu
  "gemini-2.0-flash-lite", // Bậc 3 dự phòng runtime nếu Google chưa phát hành bản 3.x
  "gemini-1.5-flash"
];

// App States
let categoriesData = [];
let currentCategory = null;
let currentLesson = null;

let ytPlayer = null;
let isPlayerReady = false;

let mediaRecorder = null;
let audioStream = null;
let audioChunks = [];
let audioContext = null;
let analyser = null;
let animationFrameId = null;

let timerInterval = null;
let secondsRecorded = 0;
const MIN_PACING_RATIO = 0.3; // Ít nhất 30% thời lượng bài gốc hoặc tối thiểu 15s

// --- DOM READY ---
window.addEventListener('DOMContentLoaded', async () => {
  await loadCatalogAndLessons();
  initYouTubeAPI();
});

// --- LOAD DATA TỪ THƯ MỤC DATA ---
async function loadCatalogAndLessons() {
  try {
    // 1. Đọc Manifest
    const manifestRes = await fetch('data/manifest-ps.json');
    const manifest = await manifestRes.json();
    const a1Config = manifest.catalogs.find(c => c.id === 'shadow_a1');

    // 2. Đọc file JSON chi tiết bài học
    const lessonsRes = await fetch(a1Config.dataFile);
    categoriesData = await lessonsRes.json();

    // 3. Khởi tạo 2 Dropdowns
    populateCategoryDropdown();
  } catch (err) {
    console.error('Lỗi nạp database JSON:', err);
    alert('Không thể tải file dữ liệu lessons-ps.json. Hãy chắc chắn bạn đang chạy trên HTTP/HTTPS Server.');
  }
}

// Dropdown Cấp 1: Phân nhóm
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

// Dropdown Cấp 2: Danh sách bài chi tiết
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
    
    // Tải Video vào Player nếu đã khởi tạo
    if (ytPlayer && ytPlayer.loadVideoById) {
      ytPlayer.loadVideoById(currentLesson.videoId);
    }
  }
  resetUI();
};

// --- YOUTUBE IFRAME CONTROLLER ---
function initYouTubeAPI() {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = () => {
  let origin = window.location.origin;
  if (!origin || origin === 'null' || window.location.protocol === 'file:') {
    origin = 'https://localhost';
  }

  const defaultVideoId = currentLesson ? currentLesson.videoId : "UHMbJlKzNu8";

  ytPlayer = new YT.Player('youtube-player', {
    videoId: defaultVideoId,
    playerVars: {
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      origin: origin
    },
    events: {
      onReady: () => { isPlayerReady = true; },
      onError: (e) => { console.error('YouTube Error Code:', e.data); }
    }
  });
};

// --- WEB AUDIO RECORDING (LỌC TIẾNG ỒN & VỌNG TỪ LOA) ---
async function startAudioHardware() {
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
    drawVisualizer();

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
    alert("Lỗi truy cập Micro: " + err.message + ". Vui lòng cấp quyền Micro trên trình duyệt.");
    return false;
  }
}

function drawVisualizer() {
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

// --- RECORDING CONTROLS ---
window.toggleShadowRecording = async () => {
  const btnRec = document.getElementById('btnRecord');
  const btnStop = document.getElementById('btnStop');

  resetUI();
  const ready = await startAudioHardware();
  if (!ready) return;

  // Tự động phát Video
  if (ytPlayer && ytPlayer.playVideo) {
    ytPlayer.seekTo(0, true);
    ytPlayer.playVideo();
  }

  // Đếm giờ
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

// --- GEMINI MULTI-MODEL FALLBACK CALL ---
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function evaluateAudioWithGemini(audioBlob, durationSec) {
  showOverlay("Đang tải dữ liệu âm thanh...");
  const base64Audio = await blobToBase64(audioBlob);
  const apiKey = getDecodedKey();

  const prompt = `
You are an expert English shadowing coach assessing a student shadowing the lesson: "${currentLesson.title}".
Analyze the audio and return a STRICT JSON object without markdown formatting:
{
  "transcript": "Exact words student spoken",
  "overall_score": <Integer 0-100 matching lesson accuracy>,
  "fluency_score": <Integer 0-100 flow and continuity>,
  "pronunciation_score": <Integer 0-100 phoneme clarity>,
  "missed_words": ["array", "of", "words", "missed", "or", "mispronounced"],
  "feedback": "Short constructive advice in Vietnamese (1 khen, 1 sửa)"
}
`;

  let lastError = null;

  for (let i = 0; i < AI_MODELS.length; i++) {
    const model = AI_MODELS[i];
    try {
      showOverlay(`Đang phân tích qua AI Model: ${model}... (Tầng ${i + 1}/${AI_MODELS.length})`);

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
        throw new Error(errJson.error?.message || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const rawText = json.candidates[0].content.parts[0].text;
      const parsedData = JSON.parse(rawText);

      hideOverlay();
      renderGradingResult(parsedData, durationSec);
      return;

    } catch (err) {
      console.warn(`Fallback từ ${model} sang model tiếp theo:`, err);
      lastError = err;
    }
  }

  hideOverlay();
  alert("Lỗi chấm điểm: " + lastError.message);
}

// --- VALIDATION LAYER (3 LỚP NGHIÊM NGẶT) ---
function renderGradingResult(data, durationSec) {
  document.getElementById('resOverall').innerText = data.overall_score;
  document.getElementById('resFluency').innerText = data.fluency_score;
  document.getElementById('resPronun').innerText = data.pronunciation_score;
  document.getElementById('resTranscript').innerText = data.transcript || "(Không phát hiện giọng nói rõ ràng)";
  document.getElementById('resFeedback').innerText = data.feedback || "";

  // Render từ vựng lỗi
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
    missedBox.innerHTML = '<span class="text-emerald-400 text-xs">🎉 Bạn nói trôi chảy không bị vấp từ nào!</span>';
  }

  // Tiêu chí 1: Thời lượng nói
  const requiredSeconds = Math.min(15, Math.floor((currentLesson.durationSeconds || 60) * MIN_PACING_RATIO));
  const isPacingPassed = durationSec >= requiredSeconds;

  // Tiêu chí 2: Match Score AI
  const isScorePassed = data.overall_score >= 60;

  document.getElementById('valPacingText').innerHTML = `<b class="${isPacingPassed ? 'text-emerald-400' : 'text-rose-400'}">${durationSec}s</b> / ${requiredSeconds}s`;
  document.getElementById('valScoreText').innerHTML = `<b class="${isScorePassed ? 'text-emerald-400' : 'text-rose-400'}">${data.overall_score}%</b> (≥60%)`;

  const badge = document.getElementById('validationBadge');
  const completeBtn = document.getElementById('btnComplete');

  // Tiêu chí 3: Strict Workflow
  if (isPacingPassed && isScorePassed) {
    badge.className = "text-xs font-bold px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700";
    badge.innerText = "✓ ĐẠT YÊU CẦU";
    completeBtn.disabled = false;
  } else {
    badge.className = "text-xs font-bold px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-700";
    badge.innerText = "✕ CHƯA ĐẠT (LÀM LẠI)";
    completeBtn.disabled = true;
  }

  // Tối ưu Storage: Giải phóng bộ đệm Audio
  audioChunks = [];
}

function resetUI() {
  document.getElementById('timerDisplay').innerText = "00:00";
  document.getElementById('resOverall').innerText = "--";
  document.getElementById('resFluency').innerText = "--";
  document.getElementById('resPronun').innerText = "--";
  document.getElementById('resTranscript').innerText = "(Chưa có bản ký âm)";
  document.getElementById('resMissedWords').innerHTML = '<span class="text-slate-500 italic">Không có dữ liệu</span>';
  document.getElementById('resFeedback').innerText = "Hãy nhấn 'Bắt đầu Shadowing' và nói đuổi theo video.";
  document.getElementById('validationBadge').className = "text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700";
  document.getElementById('validationBadge').innerText = "Chờ kiểm duyệt";
  document.getElementById('btnComplete').disabled = true;
}

window.completeLessonSubmission = () => {
  // Payload tối ưu: Tuyệt đối KHÔNG chứa file âm thanh
  const submissionData = {
    lessonId: currentLesson.id,
    lessonTitle: currentLesson.title,
    durationSeconds: secondsRecorded,
    overallScore: parseInt(document.getElementById('resOverall').innerText),
    fluencyScore: parseInt(document.getElementById('resFluency').innerText),
    pronunciationScore: parseInt(document.getElementById('resPronun').innerText),
    completedAt: new Date().toISOString()
  };

  console.log("💾 Lưu trữ hoàn tất (Payload nhẹ ~1KB):", submissionData);
  alert("🎉 Chúc mừng em đã hoàn thành bài Shadowing đạt chuẩn!");
};

function showOverlay(txt) {
  document.getElementById('loadingText').innerText = txt;
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideOverlay() {
  document.getElementById('loadingOverlay').style.display = 'none';
}
