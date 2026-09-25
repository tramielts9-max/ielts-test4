import { streamGeminiTask1 } from './api-t1.js';

let manifestData = [];
let currentItemJson = null;
let currentBase64Image = null;

// Quản lý Timer 30s khi mở hướng dẫn
let guideTimerInterval = null;
let guideTotalOpenSeconds = 0;
let isGuideOpen = false;

marked.setOptions({ breaks: true, gfm: true });

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadManifest();
});

function setupEventListeners() {
  // Toggle nguồn đề (Kho đề vs Tự dán)
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

  // Khi tự gõ đề riêng -> Tự động đồng bộ đề bài lên khung hiển thị trên ảnh
  const customPromptInput = document.getElementById('customPromptInput');
  if (customPromptInput) {
    customPromptInput.addEventListener('input', (e) => {
      const promptDisplay = document.getElementById('promptDisplayText');
      if (promptDisplay) {
        promptDisplay.innerText = e.target.value.trim() || "Vui lòng nhập đề bài vào ô bên trên...";
      }
    });
  }

  // Khi chọn Dạng bài -> Lọc danh sách Đề bài tương ứng
  document.getElementById('categorySelect').addEventListener('change', () => {
    populateExercisesForCategory();
  });

  // Khi chọn Đề bài cụ thể
  document.getElementById('exerciseSelect').addEventListener('change', () => {
    loadSelectedExercise();
  });

  // Bộ đếm từ
  const essayInput = document.getElementById('studentEssayInput');
  essayInput.addEventListener('input', () => {
    const text = essayInput.value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    document.getElementById('wordCounter').innerText = `${count} từ`;
  });

  // Nút mở / thu gọn hướng dẫn + Đếm thời gian 30s
  document.getElementById('btnToggleGuide').addEventListener('click', toggleGuide);

  // Kéo thả và chọn file ảnh
  const fileInput = document.getElementById('chartFileInput');
  fileInput.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));
  document.getElementById('btnRemoveImage').addEventListener('click', removeImage);

  // Paste ảnh từ clipboard (Ctrl + V)
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || window.clipboardData).items;
    for (let item of items) {
      if (item.type.includes('image')) {
        handleImageUpload(item.getAsFile());
        break;
      }
    }
  });

  // Nút nộp bài
  document.getElementById('btnSubmitGrading').addEventListener('click', submitEssay);
}

// ==================== TẢI MANIFEST & 2 DROPDOWN LIÊN HOÀN ====================
async function loadManifest() {
  try {
    const res = await fetch('data/manifest-t1.json');
    manifestData = await res.json();
    populateExercisesForCategory();
  } catch (err) {
    console.warn("Lỗi tải manifest-t1.json:", err);
  }
}

function populateExercisesForCategory() {
  const currentCategory = document.getElementById('categorySelect').value;
  const exerciseSelect = document.getElementById('exerciseSelect');
  exerciseSelect.innerHTML = '';

  // Lọc các bài thuộc dạng đã chọn
  const filtered = manifestData.filter(item => item.type === currentCategory);

  if (filtered.length === 0) {
    const opt = document.createElement('option');
    opt.innerText = `Chưa có bài cho dạng ${currentCategory}`;
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

// ==================== TẢI FILE JSON CỦA ĐỀ ĐƯỢC CHỌN ====================
async function loadSelectedExercise() {
  const filePath = document.getElementById('exerciseSelect').value;
  if (!filePath || filePath.startsWith('Chưa')) return;

  try {
    const res = await fetch(filePath);
    currentItemJson = await res.json();

    // 1. Cập nhật Badge loại biểu đồ
    document.getElementById('chartTypeBadge').innerText = currentItemJson.type || "Biểu đồ";

    // 2. HIỂN THỊ ĐỀ BÀI LÊN KHUNG PHÍA TRÊN ẢNH
    const promptDisplay = document.getElementById('promptDisplayText');
    if (promptDisplay) {
      promptDisplay.innerText = currentItemJson.prompt || "The graph below shows...";
    }

    // 3. Tải và hiển thị ảnh
    if (currentItemJson.image) {
      showImage(currentItemJson.image);
      loadRemoteImageToBase64(currentItemJson.image);
    } else {
      removeImage();
    }

    // 4. Đổ nội dung hướng dẫn chi tiết vào hộp bên dưới ảnh
    renderGuideContent(currentItemJson.guide);

    // 5. Reset bộ đếm thời gian xem hướng dẫn cho bài mới
    resetGuideTimer();

  } catch (err) {
    console.error("Lỗi tải file JSON của bài:", err);
  }
}

function renderGuideContent(guideMarkdown) {
  const box = document.getElementById('guideContentBox');
  if (guideMarkdown) {
    box.innerHTML = marked.parse(guideMarkdown);
  } else {
    box.innerHTML = `<p>Đề bài này chưa có phần hướng dẫn chi tiết. Em hãy chủ động viết bài nhé!</p>`;
  }
}

function clearForCustomPrompt() {
  currentItemJson = null;
  removeImage();
  document.getElementById('chartTypeBadge').innerText = "Đề tự nhập";
  
  const promptDisplay = document.getElementById('promptDisplayText');
  if (promptDisplay) {
    promptDisplay.innerText = document.getElementById('customPromptInput')?.value || "Vui lòng nhập đề bài vào ô bên trên...";
  }

  document.getElementById('guideContentBox').innerHTML = `
    <p>💡 <b>Lưu ý khi tự làm đề riêng:</b></p>
    <ul>
      <li><b>Intro (1 câu):</b> Paraphrase loại biểu đồ, nội dung chính, địa điểm, thời gian.</li>
      <li><b>Overview (2 câu):</b> 1 câu xu hướng chung + 1 câu đối tượng cao nhất/nổi bật nhất.</li>
      <li><b>Body 1 & 2:</b> Chia nhóm đối tượng logic, chọn điểm dữ liệu nổi bật (đầu, cuối, đỉnh, đáy, vượt mặt).</li>
    </ul>
  `;
}

// ==================== TIMER 30S & MỞ/THU GỌN HƯỚNG DẪN ====================
function toggleGuide() {
  const box = document.getElementById('guideCollapsibleBox');
  const toggleText = document.getElementById('guideToggleText');
  const icon = document.getElementById('guideIcon');
  isGuideOpen = !isGuideOpen;

  if (isGuideOpen) {
    box.style.display = 'block';
    toggleText.innerText = 'THU GỌN HƯỚNG DẪN VIẾT';
    icon.innerText = '🔼';
    startTimer();
  } else {
    box.style.display = 'none';
    toggleText.innerText = 'MỞ HƯỚNG DẪN CHI TIẾT (TRẠM IELTS)';
    icon.innerText = '📖';
    stopTimer();
  }
}

function startTimer() {
  if (guideTimerInterval) clearInterval(guideTimerInterval);
  guideTimerInterval = setInterval(() => {
    guideTotalOpenSeconds++;
    updateTimerBadge();
  }, 1000);
}

function stopTimer() {
  if (guideTimerInterval) {
    clearInterval(guideTimerInterval);
    guideTimerInterval = null;
  }
}

function resetGuideTimer() {
  stopTimer();
  guideTotalOpenSeconds = 0;
  isGuideOpen = false;
  document.getElementById('guideCollapsibleBox').style.display = 'none';
  document.getElementById('guideToggleText').innerText = 'MỞ HƯỚNG DẪN CHI TIẾT (TRẠM IELTS)';
  document.getElementById('guideIcon').innerText = '📖';
  updateTimerBadge();
}

function updateTimerBadge() {
  const badge = document.getElementById('guideTimerBadge');
  if (guideTotalOpenSeconds > 30) {
    badge.className = 'timer-tag assisted';
    badge.innerHTML = `⚠️ Có trợ giúp (${guideTotalOpenSeconds}s > 30s)`;
  } else {
    badge.className = 'timer-tag independent';
    badge.innerHTML = `🛡️ Tự lực (${guideTotalOpenSeconds}s / tối đa 30s)`;
  }
}

// ==================== HIỂN THỊ ẢNH (TỰ ĐỘNG THỬ ĐUÔI .JPEG VÀ .JPG) ====================
function showImage(src) {
  const img = document.getElementById('chartImage');
  const fallback = document.getElementById('imageFallback');
  const removeBtn = document.getElementById('btnRemoveImage');

  img.onerror = () => {
    if (src.endsWith('.jpg')) {
      img.src = src.replace('.jpg', '.jpeg');
    } else if (src.endsWith('.jpeg')) {
      img.src = src.replace('.jpeg', '.jpg');
    } else {
      img.style.display = 'none';
      fallback.style.display = 'block';
    }
  };

  img.onload = () => {
    img.style.display = 'block';
    fallback.style.display = 'none';
    removeBtn.style.display = 'inline-block';
  };

  img.src = src;
}

function removeImage() {
  currentBase64Image = null;
  const img = document.getElementById('chartImage');
  img.src = '';
  img.style.display = 'none';
  document.getElementById('imageFallback').style.display = 'block';
  document.getElementById('btnRemoveImage').style.display = 'none';
  document.getElementById('chartFileInput').value = '';
}

function handleImageUpload(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    currentBase64Image = {
      mimeType: file.type,
      data: e.target.result.split(',')[1]
    };
    showImage(e.target.result);
  };
  reader.readAsDataURL(file);
}

async function loadRemoteImageToBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const reader = new FileReader();
    reader.onloadend = () => {
      currentBase64Image = {
        mimeType: blob.type || 'image/jpeg',
        data: reader.result.split(',')[1]
      };
    };
    reader.readAsDataURL(blob);
  } catch(e) {}
}

window.openImageModal = (src) => {
  window.open(src, '_blank');
};

// ==================== CHẤM BÀI 2 TẦNG VỚI AI ====================
async function submitEssay() {
  const essay = document.getElementById('studentEssayInput').value.trim();
  if (!essay) {
    alert("⚠️ Em vui lòng viết bài trước khi nộp nhé!");
    return;
  }

  stopTimer();

  const isAssisted = guideTotalOpenSeconds > 30;
  const modeStatus = isAssisted 
    ? `Có trợ giúp từ gợi ý mẫu (${guideTotalOpenSeconds} giây xem hướng dẫn)`
    : `Tự lực làm bài hoàn toàn (${guideTotalOpenSeconds} giây)`;

  const isCustom = document.querySelector('input[name="promptSource"]:checked').value === 'custom';
  const prompt = isCustom 
    ? document.getElementById('customPromptInput').value.trim()
    : (currentItemJson?.prompt || "Task 1 Prompt");

  const submitBtn = document.getElementById('btnSubmitGrading');
  const resultBox = document.getElementById('resultBox');
  const resultMarkdown = document.getElementById('resultMarkdown');
  const statusBar = document.getElementById('statusBar');

  submitBtn.disabled = true;
  resultBox.style.display = 'block';
  resultMarkdown.innerHTML = '';
  statusBar.innerHTML = `⏳ Thầy đang phân tích và sửa bài 2 tầng cho em... (Chế độ: <b>${modeStatus}</b>)`;

  const promptPayload = [
    {
      text: `
Bạn là Giám khảo IELTS & Giáo viên dạy viết cự phách.
QUY TẮC XƯNG HÔ: Bắt buộc xưng "Thầy" và gọi học sinh là "Em".
THÔNG TIN LÀM BÀI CỦA HỌC SINH:
- Trạng thái: ${modeStatus}. (Nếu em tự lực, hãy khen ngợi; nếu em mở xem quá 30s, hãy động viên em luyện tập để tự lực dần).

HÃY XUẤT BÀI CHẤM THEO ĐÚNG CẤU TRÚC 6 PHẦN SAU (DÙNG 100% MARKDOWN, KHÔNG DÙNG THẺ DIV):

# PHẦN 1: MỔ XẺ 2 TẦNG CHI TIẾT TỪNG CÂU
---
### 📌 Câu [Số thứ tự] ([Vị trí câu]) — Điểm gốc của em: Band [Điểm/9]
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
*(Lặp lại cho tất cả các câu trong bài viết của em)*

# PHẦN 2: BẢNG TỔNG HỢP ĐIỂM TỪNG CÂU
| Câu số | Vị trí | Điểm gốc (/9) | Điểm sau sửa lỗi (/9) | Điểm hoàn mỹ (/9) | Lỗi cốt lõi cần nhớ |
|---|---|---|---|---|---|

# PHẦN 3: ĐÁNH GIÁ 4 TIÊU CHÍ (IELTS TASK 1 RUBRIC)
| Task Achievement | Coherence & Cohesion | Lexical Resource | Grammatical Range & Accuracy |
|---|---|---|---|
| Band [Điểm] | Band [Điểm] | Band [Điểm] | Band [Điểm] |

> ### 🎯 OVERALL BAND SCORE: [Band điểm tổng]

# PHẦN 4: LỜI DẶN DÒ CHIẾN LƯỢC CỦA THẦY
[Đoạn văn thầy tâm sự 2-3 điểm mấu chốt em cần cải thiện]

# PHẦN 5: BẢN SẠCH LỖI HIỂN NHIÊN (CLEAN VERSION)
> [Toàn bộ bài viết hoàn chỉnh sạch lỗi cơ bản theo Bước 1]

# PHẦN 6: BẢN NÂNG CẤP HOÀN MỸ (BAND 8.0+ MASTER VERSION)
> [Toàn bộ bài viết hoàn chỉnh viết lại xuất sắc theo Bước 2]

Đề bài: ${prompt}
Bài làm của học sinh:
${essay}
      `
    }
  ];

  if (currentBase64Image) {
    promptPayload.push({
      inlineData: {
        mimeType: currentBase64Image.mimeType,
        data: currentBase64Image.data
      }
    });
  }

  let fullOutput = "";
  try {
    await streamGeminiTask1(promptPayload, (chunk) => {
      fullOutput += chunk;
      resultMarkdown.innerHTML = marked.parse(fullOutput);
    });

    statusBar.innerHTML = `✅ Thầy đã chấm xong! (Trạng thái: <b>${modeStatus}</b>)`;
    submitBtn.disabled = false;
  } catch (err) {
    console.error(err);
    statusBar.innerHTML = `❌ Lỗi: ${err.message}. Em bấm thử lại nhé!`;
    submitBtn.disabled = false;
  }
}
