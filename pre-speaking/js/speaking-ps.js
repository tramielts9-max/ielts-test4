/**
 * PRE-SPEAKING CONTROLLER (-ps)
 * Hỗ trợ chọn đa cấp độ từ A1 đến C1 qua manifest-ps.json
 * Tích hợp Active Models + Retry 503/429 + Realtime STT
 */

// 1. MÃ HÓA RUNTIME AUTH KEY GỐC TỪ SPEAKING.JS
const _AUTH_SEEDS = [
  65, 81, 46, 65, 98, 56, 82, 78, 54, 75, 116, 80, 107, 51, 45, 50,
  75, 103, 117, 114, 119, 117, 116, 65, 115, 55, 95, 118, 82, 66,
  121, 81, 110, 113, 67, 48, 77, 86, 55, 52, 66, 119, 107, 82, 107,
  80, 110, 74, 89, 70, 90, 49, 119
];

function getDecodedKey() {
  return _AUTH_SEEDS.map(c => String.fromCharCode(c)).join('');
}

// 2. DANH SÁCH ACTIVE MODELS & CƠ CHẾ RETRY
const ACTIVE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash'
];

let manifestData = null;
let currentCatalog = null;
let categoriesData = [];
let currentCategory = null;
let currentLesson = null;
let ytPlayer = null;

// Speech & Recording States
let recognition = null;
let audioStream = null;
let audioContext = null;
let analyser = null;
let animationFrameId = null;

let timerInterval = null;
let secondsRecorded = 0;
const MIN_REQUIRED_DURATION = 15; // 15 giây tối thiểu

window.addEventListener('DOMContentLoaded', async () => {
  await loadManifestAndInit();
  initYouTubeAPI();
  initSpeechRecognition();
});

// ================== QUẢN LÝ DỮ LIỆU ĐA CẤP ĐỘ (A1 -> C1) ==================
async function loadManifestAndInit() {
  try {
    const res = await fetch('data/manifest-ps.json');
    if (!res.ok) throw new Error("Chưa tìm thấy file data/manifest-ps.json");
    manifestData = await res.json();

    populateLevelDropdown();
  } catch (err) {
    console.warn("⚠️ Không đọc được manifest-ps.json, dùng fallback dự phòng:", err.message);
    manifestData = {
      catalogs: [
        { id: "shadow_a1", name: "Level A1: Shadow Speaking Foundation", dataFile: "data/shadow_a1/lessons-ps.json" }
      ]
    };
    populateLevelDropdown();
  }
}

// 1. Đổ dữ liệu vào Dropdown Level
function populateLevelDropdown() {
  const levelSel = document.getElementById('levelSelect');
  if (!levelSel) return;
  levelSel.innerHTML = '';

  manifestData.catalogs.forEach((cat, index) => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.innerText = cat.name;
    levelSel.appendChild(opt);
  });

  handleLevelChange();
}

// 2. Khi đổi Cấp độ -> Tải file JSON tương ứng của cấp độ đó
window.handleLevelChange = async () => {
  const levelSel = document.getElementById('levelSelect');
  const selectedCatId = levelSel.value;
  currentCatalog = manifestData.catalogs.find(c => c.id === selectedCatId) || manifestData.catalogs[0];

  try {
    const res = await fetch(currentCatalog.dataFile);
    if (!res.ok) throw new Error(`Không tải được file ${currentCatalog.dataFile}`);
    categoriesData = await res.json();
  } catch (err) {
    console.error("Lỗi nạp bài học của cấp độ:", err);
    categoriesData = [];
  }

  populateCategoryDropdown();
};

// 3. Đổ dữ liệu vào Dropdown Nhóm chủ đề
function populateCategoryDropdown() {
  const catSel = document.getElementById('categorySelect');
  if (!catSel) return;
  catSel.innerHTML = '';

  if (categoriesData.length === 0) {
    const opt = document.createElement('option');
    opt.innerText = "(Chưa có dữ liệu bài học)";
    catSel.appendChild(opt);
    return;
  }

  categoriesData.forEach((group, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.innerText = group.category;
    catSel.appendChild(opt);
  });

  handleCategoryChange();
}

// 4. Khi đổi Chủ đề -> Đổ danh sách video tương ứng
window.handleCategoryChange = () => {
  const catSel = document.getElementById('categorySelect');
  const lessonSel = document.getElementById('lessonSelect');
  const catIndex = parseInt(catSel.value) || 0;
  currentCategory = categoriesData[catIndex];

  if (!lessonSel) return;
  lessonSel.innerHTML = '';

  if (!currentCategory || !currentCategory.lessons || currentCategory.lessons.length === 0) {
    const opt = document.createElement('option');
    opt.innerText = "(Chưa có video)";
    lessonSel.appendChild(opt);
    return;
  }

  currentCategory.lessons.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.innerText = `[${l.id}] ${l.title} (${l.duration})`;
    lessonSel.appendChild(opt);
  });

  handleLessonChange();
};

// 5. Khi đổi Bài học -> Nạp video YouTube vào khung phát
window.handleLessonChange = () => {
  const lessonSel = document.getElementById('lessonSelect');
  const lessonId = lessonSel.value;
  if (!currentCategory) return;

  currentLesson = currentCategory.lessons.find(l => l.id === lessonId) || currentCategory.lessons[0];

  if (currentLesson) {
    document.getElementById('displayLessonTitle').innerText = `[${currentLesson.id}] ${currentLesson.title}`;
    document.getElementById('displayLessonDuration').innerText = `Thời lượng: ${currentLesson.duration}`;
    
    if (ytPlayer && ytPlayer.loadVideoById) {
      ytPlayer.loadVideoById(currentLesson.videoId);
    }
  }
  resetUI();
};

// ================== YOUTUBE API ==================
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

// ================== WEB SPEECH API REALTIME (STT) ==================
function initSpeechRecognition() {
  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!window.SpeechRecognition) {
    console.warn("Trình duyệt không hỗ trợ Web Speech API.");
    return;
  }

  recognition = new window.SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = 0; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    const txtArea = document.getElementById('speechTranscript');
    if (txtArea) {
      txtArea.value = (final + interim).trim();
    }
  };

  recognition.onerror = (e) => {
    console.warn("Web Speech Error:", e.error);
  };
}

// VU METER ÂM THANH
async function startAudioMeter() {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(audioStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

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
    return true;
  } catch (err) {
    alert("Vui lòng cấp quyền Micro trên trình duyệt để luyện nói!");
    return false;
  }
}

// BẬT / DỪNG THU ÂM
window.toggleShadowRecording = async () => {
  const btnRec = document.getElementById('btnRecord');
  const btnStop = document.getElementById('btnStop');
  const badge = document.getElementById('sttStatusBadge');

  resetUI();
  const ok = await startAudioMeter();
  if (!ok) return;

  if (recognition) {
    const txtArea = document.getElementById('speechTranscript');
    if (txtArea) txtArea.value = '';
    try { recognition.start(); } catch (e) {}
    if (badge) {
      badge.innerText = "🔴 Đang nghe & ký âm...";
      badge.className = "text-[11px] font-semibold text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800 animate-pulse";
    }
  }

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

window.stopAndSubmitRecording = async () => {
  const btnRec = document.getElementById('btnRecord');
  const btnStop = document.getElementById('btnStop');
  const badge = document.getElementById('sttStatusBadge');

  if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
  clearInterval(timerInterval);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  if (recognition) {
    try { recognition.stop(); } catch (e) {}
    if (badge) {
      badge.innerText = "✅ Đã ký âm xong";
      badge.className = "text-[11px] font-semibold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800";
    }
  }
  if (audioStream) audioStream.getTracks().forEach(t => t.stop());
  if (audioContext && audioContext.state !== 'closed') audioContext.close();

  btnRec.disabled = false;
  btnRec.classList.remove('recording');
  btnStop.disabled = true;

  const transcript = document.getElementById('speechTranscript') ? document.getElementById('speechTranscript').value.trim() : "";
  if (!transcript) {
    alert("⚠️ Chưa ghi nhận được bài nói nào từ Micro. Em hãy nói to và rõ hơn nhé!");
    return;
  }

  await evaluateWithGeminiEngine(transcript, secondsRecorded);
};

// ================== CƠ CHẾ GỌI GEMINI FALLBACK & RETRY THÔNG MINH ==================
async function callGeminiWithFallback(promptText, apiKey) {
  for (const model of ACTIVE_MODELS) {
    let attempts = 0;
    const maxAttempts = (model.includes('lite')) ? 3 : 1; // Bản lite retry 3 lần, bản thường gọi 1 lần

    while (attempts < maxAttempts) {
      try {
        attempts++;
        showOverlay(`Đang kết nối ${model} (Lần thử ${attempts}/${maxAttempts})...`);
        console.log(`[AI Engine] Đang gọi model: ${model} (Lần thử ${attempts}/${maxAttempts})...`);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        });

        // Quá tải (503) hoặc rate limit (429) -> kích hoạt retry
        if (response.status === 503 || response.status === 429) {
          throw new Error(`Server busy: ${response.status}`);
        }

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`API Error ${response.status}: ${errData.error?.message || 'Unknown'}`);
        }

        const data = await response.json();
        console.log(`✅ Thành công với model: ${model}`);
        return data;

      } catch (error) {
        console.warn(`⚠️ Lỗi ở model ${model} (Lần ${attempts}):`, error.message);
        
        if (attempts < maxAttempts) {
          showOverlay(`Máy chủ ${model} đang bận, tự động thử lại sau 1.5s...`);
          await new Promise(res => setTimeout(res, 1500));
        }
      }
    }
    console.warn(`❌ Model ${model} thất bại hoàn toàn. Chuyển sang model tiếp theo trong danh sách...`);
  }

  throw new Error("Tất cả các model Gemini khả dụng đều đang bận. Vui lòng thử lại sau ít phút.");
}

// ĐIỀU HÀNH CHẤM BÀI
async function evaluateWithGeminiEngine(transcriptText, durationSec) {
  showOverlay("Đang chuẩn bị dữ liệu phân tích...");
  const apiKey = getDecodedKey();

  const promptText = `
Bạn là Giám khảo chấm Shadowing tiếng Anh trình độ ${currentCatalog ? currentCatalog.name : "A1-C1"}.
Chủ đề bài học học sinh nhại theo video: "${currentLesson.title}".
Bản ký âm Speech-to-Text từ giọng nói thực tế của học sinh:
"${transcriptText}"

HÃY ĐỐI CHIẾU VÀ ĐÁNH GIÁ:
- Các từ bị nuốt âm đuôi (-s, -ed, âm cuối), phát âm chưa chuẩn dẫn đến ký âm nhầm.
- Tính điểm overall_score, fluency_score, pronunciation_score.
- Trả về DUY NHẤT một chuỗi JSON thuần (không markdown, không backtick \`\`\`json):
{
  "overall_score": 75,
  "fluency_score": 80,
  "pronunciation_score": 70,
  "missed_words": ["danh", "sach", "tu", "sai"],
  "feedback": "Nhận xét ngắn gọn bằng tiếng Việt (1 lời khen và 1 lời khuyên sửa phát âm)"
}
`;

  try {
    const rawResponse = await callGeminiWithFallback(promptText, apiKey);
    
    let rawText = rawResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    if (rawText.startsWith("```json")) rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
    else if (rawText.startsWith("```")) rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();

    const parsed = JSON.parse(rawText);
    hideOverlay();
    renderGradingResult(parsed, durationSec);
  } catch (err) {
    hideOverlay();
    alert("Lỗi chấm điểm: " + err.message);
  }
}

// BẢNG KẾT QUẢ VÀ TIÊU CHUẨN HOÀN THÀNH
function renderGradingResult(data, durationSec) {
  document.getElementById('resOverall').innerText = data.overall_score || 0;
  document.getElementById('resFluency').innerText = data.fluency_score || 0;
  document.getElementById('resPronun').innerText = data.pronunciation_score || 0;
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
    missedBox.innerHTML = '<span class="text-emerald-400 text-xs">🎉 Phát âm rất chuẩn xác, không bị nuốt từ!</span>';
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
}

function resetUI() {
  document.getElementById('timerDisplay').innerText = "00:00";
  document.getElementById('resOverall').innerText = "--";
  document.getElementById('resFluency').innerText = "--";
  document.getElementById('resPronun').innerText = "--";
  document.getElementById('resMissedWords').innerHTML = '<span class="text-slate-500 italic">Không có dữ liệu</span>';
  document.getElementById('resFeedback').innerText = "Bấm 'Bắt đầu Shadow & Nói' để nhận đánh giá tức thì.";
  document.getElementById('validationBadge').className = "text-xs font-bold px-2.5 py-1 rounded bg-slate-700 text-slate-400";
  document.getElementById('validationBadge').innerText = "Chờ nộp bài";
  document.getElementById('btnComplete').disabled = true;
}

window.completeLessonSubmission = () => {
  alert("🎉 Chúc mừng em đã hoàn thành bài tập nói Shadowing!");
};

function showOverlay(txt) {
  document.getElementById('loadingText').innerText = txt;
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideOverlay() {
  document.getElementById('loadingOverlay').style.display = 'none';
}
