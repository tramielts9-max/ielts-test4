/**
 * PRE-SPEAKING CONTROLLER (-ps)
 * Tích hợp Web Speech API (Realtime STT) + Chấm điểm Text qua Gemini
 * Thứ tự Model: gemini-3.5-flash-lite -> gemini-3.1-flash-lite -> fallback
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

// 2. CHUỖI GỌI MODEL AI THEO YÊU CẦU
const AI_MODELS = [
  "gemini-3.5-flash-lite", // Ưu tiên 1
  "gemini-3.1-flash-lite", // Ưu tiên 2
  "gemini-2.0-flash-lite", // Dự phòng
  "gemini-1.5-flash"
];

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
  await loadCatalogAndLessons();
  initYouTubeAPI();
  initSpeechRecognition();
});

// TỰ ĐỘNG TẢI DỮ LIỆU BÀI HỌC
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
    txtArea.value = (final + interim).trim();
  };

  recognition.onerror = (e) => {
    console.warn("Web Speech Warning/Error:", e.error);
  };
}

// AUDIO METER
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
    alert("Vui lòng cắm Micro và cấp quyền Micro trên trình duyệt để luyện nói!");
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

  // Bật ký âm Web Speech API
  if (recognition) {
    document.getElementById('speechTranscript').value = '';
    try { recognition.start(); } catch (e) {}
    badge.innerText = "🔴 Đang nghe & ký âm...";
    badge.className = "text-[11px] font-semibold text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800 animate-pulse";
  }

  // Tự động phát YouTube
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

  // Dừng Web Speech API & Micro
  if (recognition) {
    try { recognition.stop(); } catch (e) {}
    badge.innerText = "✅ Đã ký âm xong";
    badge.className = "text-[11px] font-semibold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800";
  }
  if (audioStream) audioStream.getTracks().forEach(t => t.stop());
  if (audioContext && audioContext.state !== 'closed') audioContext.close();

  btnRec.disabled = false;
  btnRec.classList.remove('recording');
  btnStop.disabled = true;

  // Lấy bản ký âm để gửi AI chấm
  const transcript = document.getElementById('speechTranscript').value.trim();
  if (!transcript) {
    alert("⚠️ Chưa ghi nhận được giọng nói nào. Em hãy nói to rõ hơn vào micro nhé!");
    return;
  }

  await evaluateTranscriptWithGemini(transcript, secondsRecorded);
};

// ================== GỬI CHẤM TEXT SIÊU TỐC VỚI GEMINI ==================
async function evaluateTranscriptWithGemini(transcriptText, durationSec) {
  showOverlay("Đang gửi bản ký âm cho AI phân tích...");
  const apiKey = getDecodedKey();

  const promptText = `
Bạn là Giám khảo chấm Shadowing tiếng Anh trình độ A1.
Chủ đề bài học học sinh đã nhại theo video: "${currentLesson.title}".
Đây là bản ký âm thực tế giọng nói của học sinh (được thu bằng công nghệ Speech-to-Text):
"${transcriptText}"

HÃY ĐỐI CHIẾU VÀ ĐÁNH GIÁ NGỮ ÂM THEO NGUYÊN TẮC:
- Những từ bị Web Speech API nhận diện nhầm, sai âm, hoặc bị nuốt âm đuôi (-s, -ed, âm cuối).
- Đánh giá phát âm (pronunciation_score) và độ trôi chảy (fluency_score).
- Trả về DUY NHẤT một chuỗi JSON thuần (không dùng markdown, không dùng backtick \`\`\`json):
{
  "overall_score": <Số nguyên 0-100>,
  "fluency_score": <Số nguyên 0-100>,
  "pronunciation_score": <Số nguyên 0-100>,
  "missed_words": ["danh", "sach", "cac", "tu", "phat", "am", "chua", "chuan"],
  "feedback": "Nhận xét ngắn gọn bằng tiếng Việt (1 lời khen và 1 lời khuyên sửa phát âm)"
}
`;

  let lastError = null;

  for (let i = 0; i < AI_MODELS.length; i++) {
    const model = AI_MODELS[i];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // Tự ngắt sau 6 giây

    try {
      showOverlay(`Đang chấm qua model: ${model}... (Bậc ${i + 1}/${AI_MODELS.length})`);

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: promptText }]
          }],
          generationConfig: { temperature: 0.1 }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || `HTTP ${res.status}`);
      }

      const json = await res.json();
      let rawText = json.candidates[0].content.parts[0].text.trim();

      if (rawText.startsWith("```json")) rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
      else if (rawText.startsWith("```")) rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();

      const parsed = JSON.parse(rawText);
      hideOverlay();
      renderGradingResult(parsed, durationSec);
      return; // Chấm thành công thì kết thúc luôn

    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`Model ${model} chuyển tiếp:`, err.message);
      lastError = err;
    }
  }

  hideOverlay();
  alert("Lỗi chấm điểm: " + lastError.message);
}

// BẢNG KẾT QUẢ VÀ TIÊU CHUẨN ĐẠT
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
  alert("🎉 Chúc mừng em đã hoàn thành bài tập nói Shadowing A1!");
};

function showOverlay(txt) {
  document.getElementById('loadingText').innerText = txt;
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideOverlay() {
  document.getElementById('loadingOverlay').style.display = 'none';
}
