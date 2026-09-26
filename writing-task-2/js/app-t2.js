import { streamGeminiTask2 } from './api-t2.js';

let manifestData = [];
let currentItemJson = null;

// Quản lý Timer đọc gợi ý mẫu
let guideTimerInterval = null;
let guideTotalOpenSeconds = 0;
let isGuideOpen = false;

// Quản lý Đồng hồ bấm giờ học sinh làm bài
let stopwatchInterval = null;
let stopwatchSeconds = 0;
let isStopwatchRunning = false;

marked.setOptions({ breaks: true, gfm: true });

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadManifest();
});

function setupEventListeners() {
  // Chuyển chế độ: Chọn kho đề vs Tự dán đề
  document.querySelectorAll('input[name="promptSource"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isCustom = e.target.value === 'custom';
      document.getElementById('catalogDropdowns').style.display = isCustom ? 'none' : 'flex';
      document.getElementById('customPromptBox').style.display = isCustom ? 'block' : 'none';
      if (!isCustom) {
        loadSelectedExercise();
      } else {
        clearForCustomPrompt();
      }
    });
  });

  const customPromptInput = document.getElementById('customPromptInput');
  if (customPromptInput) {
    customPromptInput.addEventListener('input', (e) => {
      const promptDisplay = document.getElementById('promptDisplayText');
      if (promptDisplay) {
        promptDisplay.innerText = e.target.value.trim() || "Vui lòng nhập đề bài vào ô bên trên...";
      }
    });
  }

  document.getElementById('categorySelect').addEventListener('change', populateExercisesForCategory);
  document.getElementById('exerciseSelect').addEventListener('change', loadSelectedExercise);

  // Đếm số từ tự động
  const essayInput = document.getElementById('studentEssayInput');
  essayInput.addEventListener('input', () => {
    const text = essayInput.value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    document.getElementById('wordCounter').innerText = `${count} từ`;
    
    // Tự động kích hoạt đồng hồ khi gõ chữ đầu tiên nếu chưa bật
    if (count > 0 && !isStopwatchRunning && stopwatchSeconds === 0) {
      startStopwatch();
    }
  });

  // Nút mở/đóng hướng dẫn
  document.getElementById('btnToggleGuide').addEventListener('click', toggleGuide);

  // Nút chấm bài
  document.getElementById('btnSubmitGrading').addEventListener('click', submitEssay);

  // Nút nhảy nhanh xuống kết quả
  document.getElementById('btnJumpToResult').addEventListener('click', () => {
    document.getElementById('resultBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Nút điều khiển Đồng hồ làm bài
  document.getElementById('btnStartStopwatch').addEventListener('click', startStopwatch);
  document.getElementById('btnPauseStopwatch').addEventListener('click', pauseStopwatch);
  document.getElementById('btnResetStopwatch').addEventListener('click', resetStopwatch);
}

// ==================== ĐỒNG HỒ BẤM GIỜ HỌC SINH ====================
function formatTime(totalSecs) {
  const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSecs % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function startStopwatch() {
  if (isStopwatchRunning) return;
  isStopwatchRunning = true;
  document.getElementById('btnStartStopwatch').style.display = 'none';
  document.getElementById('btnPauseStopwatch').style.display = 'inline-block';

  stopwatchInterval = setInterval(() => {
    stopwatchSeconds++;
    document.getElementById('stopwatchDisplay').innerText = formatTime(stopwatchSeconds);
  }, 1000);
}

function pauseStopwatch() {
  if (!isStopwatchRunning) return;
  isStopwatchRunning = false;
  clearInterval(stopwatchInterval);
  document.getElementById('btnStartStopwatch').style.display = 'inline-block';
  document.getElementById('btnPauseStopwatch').style.display = 'none';
}

function resetStopwatch() {
  pauseStopwatch();
  stopwatchSeconds = 0;
  document.getElementById('stopwatchDisplay').innerText = '00:00:00';
}

// ==================== NẠP DỮ LIỆU TỪ MANIFEST ====================
async function loadManifest() {
  try {
    const res = await fetch('data/manifest-t2.json');
    if (!res.ok) throw new Error("Không thể tải data/manifest-t2.json");
    manifestData = await res.json();
    populateExercisesForCategory();
  } catch (err) {
    console.error("Lỗi manifest Task 2:", err);
  }
}

function populateExercisesForCategory() {
  const currentCategory = document.getElementById('categorySelect').value;
  const exerciseSelect = document.getElementById('exerciseSelect');
  exerciseSelect.innerHTML = '';

  const filtered = manifestData.filter(item => item.type === currentCategory);

  if (filtered.length === 0) {
    const opt = document.createElement('option');
    opt.innerText = `Chưa có bài nào cho dạng ${currentCategory}`;
    exerciseSelect.appendChild(opt);
    return;
  }

  filtered.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.file;
    opt.innerText = item.title;
    exerciseSelect.appendChild(opt);
  });

  loadSelectedExercise();
}

// ==================== TẢI CHI TIẾT ĐỀ BÀI TASK 2 ====================
async function loadSelectedExercise() {
  const exerciseSelect = document.getElementById('exerciseSelect');
  const filePath = exerciseSelect.value;
  if (!filePath || filePath.startsWith('Chưa')) return;

  const currentCategory = document.getElementById('categorySelect').value;
  document.getElementById('essayTypeBadge').innerText = currentCategory;

  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`Chưa tạo file ${filePath}`);
    currentItemJson = await res.json();

    // 1. Hiển thị prompt
    document.getElementById('promptDisplayText').innerText = currentItemJson.prompt || "Writing Prompt...";

    // 2. Render hướng dẫn chi tiết
    renderGuideContent(currentItemJson.guide);

    // 3. Reset các bộ đếm
    resetGuideTimer();
    resetStopwatch();

  } catch (err) {
    console.warn("Thông báo:", err.message);
    document.getElementById('promptDisplayText').innerText = `⚠️ Bài này chưa có file JSON (${filePath}). Em có thể bấm "Tự dán đề riêng" để làm ngay nhé!`;
    renderGuideContent(null);
  }
}

function renderGuideContent(guideMarkdown) {
  const box = document.getElementById('guideContentBox');
  if (guideMarkdown) {
    box.innerHTML = marked.parse(guideMarkdown);
  } else {
    box.innerHTML = `<p>Đề bài này chưa có phần hướng dẫn chi tiết. Em hãy chủ động lập dàn ý và viết bài nhé!</p>`;
  }
}

function clearForCustomPrompt() {
  currentItemJson = null;
  document.getElementById('essayTypeBadge').innerText = "Đề tự nhập";
  const promptDisplay = document.getElementById('promptDisplayText');
  if (promptDisplay) {
    promptDisplay.innerText = document.getElementById('customPromptInput')?.value || "Vui lòng nhập đề bài vào ô bên trên...";
  }
  document.getElementById('guideContentBox').innerHTML = `<p>💡 Em đang làm đề tự nhập. Hãy đảm bảo bài viết có tối thiểu 250 từ và đầy đủ 4 đoạn văn.</p>`;
}

// ==================== QUẢN LÝ TIMER HƯỚNG DẪN 30S ====================
function toggleGuide() {
  const box = document.getElementById('guideCollapsibleBox');
  const toggleText = document.getElementById('guideToggleText');
  const icon = document.getElementById('guideIcon');
  isGuideOpen = !isGuideOpen;

  if (isGuideOpen) {
    box.style.display = 'block';
    toggleText.innerText = 'THU GỌN HƯỚNG DẪN VIẾT';
    icon.innerText = '🔼';
    startGuideTimer();
  } else {
    box.style.display = 'none';
    toggleText.innerText = 'MỞ HƯỚNG DẪN CHI TIẾT (TRẠM IELTS)';
    icon.innerText = '📖';
    stopGuideTimer();
  }
}

function startGuideTimer() {
  if (guideTimerInterval) clearInterval(guideTimerInterval);
  guideTimerInterval = setInterval(() => {
    guideTotalOpenSeconds++;
    updateGuideTimerBadge();
  }, 1000);
}

function stopGuideTimer() {
  if (guideTimerInterval) {
    clearInterval(guideTimerInterval);
    guideTimerInterval = null;
  }
}

function resetGuideTimer() {
  stopGuideTimer();
  guideTotalOpenSeconds = 0;
  isGuideOpen = false;
  document.getElementById('guideCollapsibleBox').style.display = 'none';
  document.getElementById('guideToggleText').innerText = 'MỞ HƯỚNG DẪN CHI TIẾT (TRẠM IELTS)';
  document.getElementById('guideIcon').innerText = '📖';
  updateGuideTimerBadge();
}

function updateGuideTimerBadge() {
  const badge = document.getElementById('guideTimerBadge');
  if (guideTotalOpenSeconds > 30) {
    badge.className = 'timer-tag assisted';
    badge.innerHTML = `⚠️ Có trợ giúp (${guideTotalOpenSeconds}s > 30s)`;
  } else {
    badge.className = 'timer-tag independent';
    badge.innerHTML = `🛡️ Tự lực (${guideTotalOpenSeconds}s / tối đa 30s)`;
  }
}

// ==================== CHẤM BÀI 2 TẦNG AI (TASK 2) ====================
async function submitEssay() {
  const essay = document.getElementById('studentEssayInput').value.trim();
  if (!essay) {
    alert("⚠️ Em vui lòng viết bài Task 2 trước khi nộp nhé!");
    return;
  }

  // Tạm dừng cả 2 đồng hồ
  stopGuideTimer();
  pauseStopwatch();

  const isAssisted = guideTotalOpenSeconds > 30;
  const modeStatus = isAssisted 
    ? `Có trợ giúp từ gợi ý mẫu (${guideTotalOpenSeconds}s xem tài liệu)`
    : `Tự lực làm bài (${guideTotalOpenSeconds}s)`;
  const timeSpentFormatted = formatTime(stopwatchSeconds);

  const isCustom = document.querySelector('input[name="promptSource"]:checked').value === 'custom';
  const prompt = isCustom 
    ? document.getElementById('customPromptInput').value.trim()
    : (currentItemJson?.prompt || document.getElementById('promptDisplayText').innerText);

  const submitBtn = document.getElementById('btnSubmitGrading');
  const resultBox = document.getElementById('resultBox');
  const resultMarkdown = document.getElementById('resultMarkdown');
  const statusBar = document.getElementById('statusBar');
  const signalBar = document.getElementById('scrollSignalBar');

  submitBtn.disabled = true;
  resultBox.style.display = 'block';
  signalBar.style.display = 'block';
  resultMarkdown.innerHTML = '';
  statusBar.innerHTML = `⏳ Thầy đang phân tích và sửa bài Task 2 cho em... (Thời gian làm bài: <b>${timeSpentFormatted}</b> | Chế độ: <b>${modeStatus}</b>)`;

  // Tự động cuộn êm xuống thanh kết quả
  resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const promptPayload = [
    {
      text: `
Bạn là Giám khảo IELTS & Chuyên gia luyện thi Writing Task 2 kỳ cựu.
QUY TẮC XƯNG HÔ: Bắt buộc xưng "Thầy" và gọi học sinh là "Em".
THÔNG TIN BÀI THI CỦA HỌC SINH:
- Thời gian viết bài: ${timeSpentFormatted}.
- Trạng thái tự lực: ${modeStatus}.

HÃY XUẤT TOÀN BỘ BÀI CHẤM THEO ĐÚNG CẤU TRÚC 6 PHẦN SAU (DÙNG 100% MARKDOWN, KHÔNG DÙNG THẺ DIV):

# PHẦN 1: MỔ XẺ 2 TẦNG CHI TIẾT TỪNG CÂU
---
### 📌 Câu [Số thứ tự] ([Vị trí câu, ví dụ: Intro - Paraphrase / Body 1 - Topic Sentence]) — Điểm gốc của em: Band [Điểm/9]
#### 🛠️ BƯỚC 1: SỬA LỖI HIỂN NHIÊN (Khắc phục xong đạt: Band 6.0 - 6.5)
- **Thầy sửa trực tiếp:** [Viết lại câu. Lỗi sai dùng <del class="err">từ sai</del>, sửa đúng dùng <ins class="fix">từ đúng</ins>, nhắc nhở dùng <span class="teacher-note">💬 (lời dặn)</span>]
- **🔄 Từ được sửa ở Bước 1:**
  * <del class="err">[Từ sai]</del> ➔ <ins class="fix">[Từ đúng]</ins> *(Lý do lỗi)*
- **🔍 Lý do bị trừ điểm:** [Giải thích ngắn gọn]
- **👉 Câu sạch lỗi cơ bản:** "[Viết lại câu hoàn chỉnh]"

#### ✨ BƯỚC 2: NÂNG CẤP HOÀN MỸ (Chuẩn Band 8.0 - 8.5)
- **Bơm từ vựng & cấu trúc đỉnh cao:** [Viết câu với <mark class="vocab">từ C1-C2 (dịch nghĩa)</mark>]
- **🚀 Từ vựng nâng cấp ở Bước 2:**
  * [Từ ở bước 1] ➔ <mark class="vocab">[Từ C1-C2 xịn (dịch nghĩa)]</mark>
- **👉 Chốt câu hoàn mỹ Band 8.0+:** "[Câu xuất sắc nhất]"
---

# PHẦN 2: BẢNG TỔNG HỢP ĐIỂM TỪNG CÂU
| Câu số | Vị trí | Điểm gốc (/9) | Điểm sau sửa lỗi (/9) | Điểm hoàn mỹ (/9) | Lỗi cốt lõi cần nhớ |
|---|---|---|---|---|---|

# PHẦN 3: ĐÁNH GIÁ 4 TIÊU CHÍ (IELTS TASK 2 RUBRIC)
| Task Response | Coherence & Cohesion | Lexical Resource | Grammatical Range & Accuracy |
|---|---|---|---|
| Band [Điểm] | Band [Điểm] | Band [Điểm] | Band [Điểm] |

> ### 🎯 OVERALL BAND SCORE: [Band điểm tổng]

# PHẦN 4: LỜI DẶN DÒ CHIẾN LƯỢC CỦA THẦY
[Đoạn văn thầy nhận xét thẳng thắn về tư duy lập luận, cấu trúc bài, độ sâu ý tưởng và lỗi ngữ pháp cốt lõi]

# PHẦN 5: BẢN SẠCH LỖI HIỂN NHIÊN (CLEAN VERSION)
> [Toàn bộ bài viết hoàn chỉnh sạch lỗi cơ bản theo Bước 1]

# PHẦN 6: BẢN NÂNG CẤP HOÀN MỸ (BAND 8.0+ MASTER ESSAY)
> [Toàn bộ bài viết hoàn chỉnh viết lại xuất sắc theo Bước 2]

Đề bài Task 2: ${prompt}
Bài làm của học sinh:
${essay}
      `
    }
  ];

  let fullOutput = "";
  try {
    const usedModel = await streamGeminiTask2(promptPayload, (chunk) => {
      fullOutput += chunk;
      resultMarkdown.innerHTML = marked.parse(fullOutput);
    });

    statusBar.innerHTML = `✅ Thầy đã chấm xong bằng model [<b>${usedModel}</b>]! (Thời gian viết: <b>${timeSpentFormatted}</b> | Chế độ: <b>${modeStatus}</b>)`;
    submitBtn.disabled = false;
  } catch (err) {
    console.error(err);
    statusBar.innerHTML = `❌ Lỗi kết nối AI: ${err.message}. Em bấm kiểm tra lại nhé!`;
    submitBtn.disabled = false;
  }
}
