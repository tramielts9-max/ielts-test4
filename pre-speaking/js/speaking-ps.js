/**
 * PRE-SPEAKING CONTROLLER (-ps)
 * Tích hợp Màn hình Portal Danh sách Card + Chuyển phòng Luyện Nói
 * Lưu trữ tiến độ bài học & đổi màu Card theo ngày hoàn thành
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

const STORAGE_KEY_PS_HISTORY = 'ps_completed_lessons_history';

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
const MIN_REQUIRED_DURATION = 15; // 15s

// Quản lý Portal
let activePortalLevelId = 'shadow_a1';
let portalAllLessonsFlat = [];

window.addEventListener('DOMContentLoaded', async () => {
  await loadManifestAndInit();
  initYouTubeAPI();
  initSpeechRecognition();
});

// ================== QUẢN LÝ TIẾN ĐỘ LÀM BÀI (LOCALSTORAGE) ==================
function getCompletedHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_PS_HISTORY) || '{}');
  } catch (e) {
    return {};
  }
}

function saveCompletedLesson(lessonId) {
  const history = getCompletedHistory();
  const todayStr = new Intl.DateTimeFormat('vi-VN').format(new Date());

  if (!history[lessonId]) {
    history[lessonId] = { count: 1, lastDate: todayStr };
  } else {
    history[lessonId].count += 1;
    history[lessonId].lastDate = todayStr;
  }

  localStorage.setItem(STORAGE_KEY_PS_HISTORY, JSON.stringify(history));
}

// ================== KHỞI TẠO HỆ THỐNG TỪ MANIFEST ==================
async function loadManifestAndInit() {
  try {
    const res = await fetch('data/manifest-ps.json');
    if (!res.ok) throw new Error("Chưa có manifest");
    manifestData = await res.json();
  } catch (err) {
    console.warn("⚠️ Dùng fallback danh mục manifest:", err.message);
    manifestData = {
      catalogs: [
        { id: "shadow_a1", name: "Level A1: Shadow Speaking Foundation", dataFile: "data/shadow_a1/lessons-ps.json" },
        { id: "shadow_a2", name: "Level A2: Pre-Intermediate Shadowing", dataFile: "data/shadow_a2/lessons-ps.json" },
        { id: "shadow_b1", name: "Level B1: Intermediate Fluency Shadowing", dataFile: "data/shadow_b1/lessons-ps.json" },
        { id: "shadow_b2", name: "Level B2.1: Upper-Intermediate Mastery", dataFile: "data/shadow_b2/lessons-ps.json" },
        { id: "shadow_b2_2", name: "Level B2.2: Deep Thinking & Complex Concepts", dataFile: "data/shadow_b2_2/lessons-ps.json" },
        { id: "shadow_c1", name: "Level C1: Native Accents, Celebrities & Cinema", dataFile: "data/shadow_c1/lessons-ps.json" }
      ]
    };
  }

  renderLevelPills();
  populateLevelDropdown();
  await switchPortalLevel(activePortalLevelId);
}

// ================== MÀN HÌNH 1: PORTAL DASHBOARD LOGIC ==================
function renderLevelPills() {
  const container = document.getElementById('levelPillsContainer');
  if (!container) return;
  container.innerHTML = '';

  manifestData.catalogs.forEach((cat) => {
    const btn = document.createElement('button');
    const isActive = cat.id === activePortalLevelId;
    btn.className = `px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
      isActive 
        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' 
        : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
    }`;
    
    // Rút gọn tên hiển thị trên nút: "Level A1", "Level A2"...
    const shortLabel = cat.name.split(':')[0] || cat.id;
    btn.innerText = shortLabel;

    btn.onclick = () => switchPortalLevel(cat.id);
    container.appendChild(btn);
  });
}

async function switchPortalLevel(levelId) {
  activePortalLevelId = levelId;
  renderLevelPills();

  const catalog = manifestData.catalogs.find(c => c.id === levelId);
  if (!catalog) return;

  try {
    const res = await fetch(catalog.dataFile);
    if (!res.ok) throw new Error("Chưa tải được dữ liệu");
    const levelCategories = await res.json();

    // Làm phẳng danh sách bài học để hiển thị dạng lưới Card
    portalAllLessonsFlat = [];
    levelCategories.forEach(cat => {
      (cat.lessons || []).forEach(lesson => {
        portalAllLessonsFlat.push({
          ...lesson,
          categoryName: cat.category,
          levelId: catalog.id,
          levelName: catalog.name.split(':')[0] || 'Level'
        });
      });
    });

    renderPortalCards(portalAllLessonsFlat);
  } catch (err) {
    console.error("Lỗi tải bài học cho Portal:", err);
    document.getElementById('portalCardsGrid').innerHTML = `
      <div class="col-span-full text-center py-10 text-rose-400">
        Không thể tải bài học của cấp độ này (${catalog.dataFile}).
      </div>
    `;
  }
}

function renderPortalCards(lessonsList) {
  const grid = document.getElementById('portalCardsGrid');
  const progressBadge = document.getElementById('levelProgressBadge');
  const history = getCompletedHistory();

  let completedCount = 0;
  lessonsList.forEach(l => {
    if (history[l.id]) completedCount++;
  });

  if (progressBadge) {
    progressBadge.innerText = `${completedCount}/${lessonsList.length} Đã xong`;
  }

  if (lessonsList.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">Không tìm thấy bài học nào phù hợp.</div>`;
    return;
  }

  grid.innerHTML = lessonsList.map(l => {
    const record = history[l.id];
    const isDone = !!record;

    // Trạng thái đổi màu: Nếu đã làm một lần rồi thì viền xanh lá, nền ánh ngọc lục bảo
    const cardBorderClass = isDone 
      ? 'border-emerald-500/60 bg-emerald-950/20 hover:border-emerald-400' 
      : 'border-slate-700 bg-slate-800 hover:border-violet-500/60';

    const statusBadge = isDone
      ? `<span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700">
           <i class="fa-solid fa-check"></i> Đã làm ${record.count} lần (${record.lastDate})
         </span>`
      : `<span class="text-[11px] font-semibold text-slate-400">
           <i class="fa-regular fa-circle"></i> Chưa làm
         </span>`;

    return `
      <div class="rounded-xl border p-4 transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col justify-between gap-3 ${cardBorderClass}">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[11px] font-extrabold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800 uppercase">
              ${l.id} • ${l.levelName}
            </span>
            ${statusBadge}
          </div>
          <h3 class="text-sm font-bold text-slate-100 line-clamp-2 mt-1 leading-snug" title="${l.title}">
            ${l.title}
          </h3>
          <div class="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span class="truncate max-w-[180px] text-slate-400" title="${l.categoryName}">📁 ${l.categoryName}</span>
            <span class="text-sky-300 font-semibold whitespace-nowrap">⏱️ ${l.duration}</span>
          </div>
        </div>

        <button 
          onclick="window.startLessonFromPortal('${l.levelId}', '${l.id}')"
          class="w-full py-2.5 mt-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
            isDone 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/20' 
              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-700/20'
          }"
        >
          <i class="fa-solid fa-play text-[10px]"></i> Vào làm bài &rarr;
        </button>
      </div>
    `;
  }).join('');
}

window.filterPortalLessons = () => {
  const query = (document.getElementById('portalSearchInput')?.value || '').toLowerCase().trim();
  const filtered = portalAllLessonsFlat.filter(l => 
    l.title.toLowerCase().includes(query) || 
    l.id.toLowerCase().includes(query) ||
    l.categoryName.toLowerCase().includes(query)
  );
  renderPortalCards(filtered);
};

// ================== CHUYỂN ĐỔI MÀN HÌNH (PORTAL <-> WORKSPACE) ==================
window.startLessonFromPortal = async (levelId, lessonId) => {
  document.getElementById('portalScreen').classList.add('hidden');
  document.getElementById('workspaceScreen').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Đồng bộ chọn đúng bài trên 3 thanh dropdown của Workspace
  const levelSel = document.getElementById('levelSelect');
  if (levelSel) {
    levelSel.value = levelId;
    await handleLevelChange(lessonId);
  }
};

window.backToPortal = () => {
  // Dừng phát YouTube
  if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
  clearInterval(timerInterval);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  // Tắt micro
  if (recognition) { try { recognition.stop(); } catch (e) {} }
  if (audioStream) audioStream.getTracks().forEach(t => t.stop());
  if (audioContext && audioContext.state !== 'closed') audioContext.close();

  // Trở về Portal & làm mới lại danh sách bài
  document.getElementById('workspaceScreen').classList.add('hidden');
  document.getElementById('portalScreen').classList.remove('hidden');

  switchPortalLevel(activePortalLevelId);
};

// ================== LOGIC 3 THANH CHỌN TRONG WORKSPACE ==================
function populateLevelDropdown() {
  const levelSel = document.getElementById('levelSelect');
  if (!levelSel) return;
  levelSel.innerHTML = '';

  manifestData.catalogs.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.innerText = cat.name;
    levelSel.appendChild(opt);
  });
}

window.handleLevelChange = async (targetLessonId = null) => {
  const levelSel = document.getElementById('levelSelect');
  const selectedCatId = levelSel.value;
  currentCatalog = manifestData.catalogs.find(c => c.id === selectedCatId) || manifestData.catalogs[0];

  try {
    const res = await fetch(currentCatalog.dataFile);
    categoriesData = await res.json();
  } catch (err) {
    categoriesData = [];
  }

  populateCategoryDropdown(targetLessonId);
};

function populateCategoryDropdown(targetLessonId = null) {
  const catSel = document.getElementById('categorySelect');
  if (!catSel) return;
  catSel.innerHTML = '';

  if (categoriesData.length === 0) {
    const opt = document.createElement('option');
    opt.innerText = "(Chưa có dữ liệu bài học)";
    catSel.appendChild(opt);
    return;
  }

  let selectedCatIndex = 0;

  // Nếu chuyển từ Portal sang, tìm nhóm chứa đúng bài đó
  if (targetLessonId) {
    categoriesData.forEach((group, idx) => {
      if ((group.lessons || []).some(l => l.id === targetLessonId)) {
        selectedCatIndex = idx;
      }
    });
  }

  categoriesData.forEach((group, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.innerText = group.category;
    if (index === selectedCatIndex) opt.selected = true;
    catSel.appendChild(opt);
  });

  handleCategoryChange(targetLessonId);
}

window.handleCategoryChange = (targetLessonId = null) => {
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
    if (targetLessonId && l.id === targetLessonId) opt.selected = true;
    lessonSel.appendChild(opt);
  });

  handleLessonChange();
};

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

// ================== GỌI AI VỚI FALLBACK & RETRY ==================
async function callGeminiWithFallback(promptText, apiKey) {
  for (const model of ACTIVE_MODELS) {
    let attempts = 0;
    const maxAttempts = (model.includes('lite')) ? 3 : 1;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        showOverlay(`Đang kết nối ${model} (Lần thử ${attempts}/${maxAttempts})...`);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        });

        if (response.status === 503 || response.status === 429) {
          throw new Error(`Server busy: ${response.status}`);
        }

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`API Error ${response.status}: ${errData.error?.message || 'Unknown'}`);
        }

        const data = await response.json();
        return data;

      } catch (error) {
        if (attempts < maxAttempts) {
          showOverlay(`Máy chủ ${model} đang bận, tự động thử lại sau 1.5s...`);
          await new Promise(res => setTimeout(res, 1500));
        }
      }
    }
  }

  throw new Error("Tất cả các model Gemini khả dụng đều đang bận. Vui lòng thử lại sau ít phút.");
}

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

// XÁC NHẬN HOÀN THÀNH -> LƯU TIẾN ĐỘ & ĐỔI MÀU CARD TRONG PORTAL
window.completeLessonSubmission = () => {
  if (currentLesson) {
    saveCompletedLesson(currentLesson.id);
  }
  alert(`🎉 Chúc mừng em đã hoàn thành bài tập [${currentLesson.id}]! Hệ thống đã ghi nhận tiến độ.`);
  window.backToPortal(); // Tự động quay về Portal và Card đã làm sẽ đổi sang màu xanh lá
};

function showOverlay(txt) {
  document.getElementById('loadingText').innerText = txt;
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideOverlay() {
  document.getElementById('loadingOverlay').style.display = 'none';
}
