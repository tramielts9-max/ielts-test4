import { streamGeminiTask1 } from './api-t1.js';

// Quản lý trạng thái Timer 30s mở hướng dẫn
let guideTimerInterval = null;
let guideTotalOpenSeconds = 0;
let isGuideCurrentlyOpen = false;

// Dữ liệu ứng dụng
let catalogData = [];
let currentLoadedExercise = null;
let currentBase64Image = null;

// Cấu hình markdown
marked.setOptions({ breaks: true, gfm: true });

document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadCatalogManifest();
});

function initEventListeners() {
  // Toggle nguồn đề (Catalog vs Custom)
  document.querySelectorAll('input[name="promptSource"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isCustom = e.target.value === 'custom';
      document.getElementById('groupCatalogSelect').style.display = isCustom ? 'none' : 'block';
      document.getElementById('groupCustomPrompt').style.display = isCustom ? 'block' : 'none';
      if (!isCustom) {
        loadSelectedExercise();
      } else {
        resetGuideDisplayForCustom();
      }
    });
  });

  // Chọn đề bài từ catalog
  document.getElementById('exerciseSelect').addEventListener('change', loadSelectedExercise);

  // Bộ đếm từ
  const essayInput = document.getElementById('studentEssayInput');
  essayInput.addEventListener('input', () => {
    const text = essayInput.value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    document.getElementById('wordCounter').innerText = `${count} từ`;
  });

  // Toggle mở/thu gọn hướng dẫn + Kích hoạt Timer
  document.getElementById('btnToggleGuide').addEventListener('click', toggleGuideBox);

  // Xử lý nạp ảnh: File Picker
  const fileInput = document.getElementById('chartFileInput');
  document.getElementById('dropzoneBox').addEventListener('click', (e) => {
    if (e.target.id !== 'btnRemoveImage') fileInput.click();
  });
  fileInput.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));

  // Xử lý xóa ảnh
  document.getElementById('btnRemoveImage').addEventListener('click', (e) => {
    e.stopPropagation();
    removeUploadedImage();
  });

  // Xử lý paste ảnh từ Clipboard (Ctrl + V)
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || window.clipboardData).items;
    for (let item of items) {
      if (item.type.includes('image')) {
        handleImageUpload(item.getAsFile());
        break;
      }
    }
  });

  // Nút Nộp bài & Chấm 2 tầng
  document.getElementById('btnSubmitGrading').addEventListener('click', submitForGrading);
}

// ==================== LOGIC ĐO THỜI GIAN MỞ HƯỚNG DẪN (30 GIÂY) ====================
function toggleGuideBox() {
  const guideBox = document.getElementById('guideBox');
  const toggleText = document.getElementById('toggleText');
  isGuideCurrentlyOpen = !isGuideCurrentlyOpen;

  if (isGuideCurrentlyOpen) {
    guideBox.style.display = 'block';
    toggleText.innerText = 'THU GỌN HƯỚNG DẪN VIẾT';
    startGuideTimer();
  } else {
    guideBox.style.display = 'none';
    toggleText.innerText = 'MỞ HƯỚNG DẪN VIẾT CHI TIẾT';
    stopGuideTimer();
  }
}

function startGuideTimer() {
  if (guideTimerInterval) clearInterval(guideTimerInterval);
  guideTimerInterval = setInterval(() => {
    guideTotalOpenSeconds++;
    updateGuideStatusBadge();
  }, 1000);
}

function stopGuideTimer() {
  if (guideTimerInterval) {
    clearInterval(guideTimerInterval);
    guideTimerInterval = null;
  }
}

function updateGuideStatusBadge() {
  const statusTag = document.getElementById('guideStatusTag');
  if (guideTotalOpenSeconds > 30) {
    statusTag.className = 'tag-status assisted';
    statusTag.innerHTML = `⚠️ Chế độ: Đã nhận trợ giúp mẫu (${guideTotalOpenSeconds}s > 30s)`;
  } else {
    statusTag.className = 'tag-status independent';
    statusTag.innerHTML = `🛡️ Chế độ: Tự lực hoàn toàn (${guideTotalOpenSeconds}s / tối đa 30s)`;
  }
}

// ==================== TẢI CATALOG & HIỂN THỊ ĐỀ ====================
async function loadCatalogManifest() {
  try {
    const res = await fetch('data/manifest-t1.json');
    catalogData = await res.json();
    const select = document.getElementById('exerciseSelect');
    select.innerHTML = '';
    
    catalogData.forEach((item, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.innerText = item.title;
      select.appendChild(opt);
    });

    loadSelectedExercise();
  } catch (err) {
    console.warn("Chưa tải được manifest-t1.json:", err);
  }
}

async function loadSelectedExercise() {
  const select = document.getElementById('exerciseSelect');
  if (!catalogData.length || !select.value) return;

  const itemInfo = catalogData[select.value];
  document.getElementById('chartTypeBadge').innerText = itemInfo.type || "Biểu đồ";

  try {
    const res = await fetch(itemInfo.file);
    currentLoadedExercise = await res.json();

    // Hiển thị ảnh nếu có sẵn
    if (currentLoadedExercise.image) {
      showPreviewImage(currentLoadedExercise.image);
      loadRemoteImageAsBase64(currentLoadedExercise.image);
    } else {
      removeUploadedImage();
    }

    // Hiển thị nội dung hướng dẫn (Trạm IELTS format)
    renderDetailedGuide(currentLoadedExercise.guide);
  } catch (err) {
    console.warn("Lỗi tải chi tiết bài tập:", err);
  }
}

function renderDetailedGuide(guideMarkdown) {
  const box = document.getElementById('guideContentDisplay');
  if (guideMarkdown) {
    box.innerHTML = marked.parse(guideMarkdown);
  } else {
    box.innerHTML = `<p>Chưa có hướng dẫn mẫu cho đề này. Em hãy tự tin viết bài nhé!</p>`;
  }
}

function resetGuideDisplayForCustom() {
  currentLoadedExercise = null;
  document.getElementById('chartTypeBadge').innerText = "Đề tự nhập";
  document.getElementById('guideContentDisplay').innerHTML = `
    <p>💡 Em đang làm đề thi tự nhập. Hãy chủ động phác thảo dàn ý:</p>
    <ul>
      <li><b>Intro (1 câu):</b> Paraphrase loại biểu đồ, đối tượng, địa điểm, thời gian.</li>
      <li><b>Overview (2 câu):</b> 1 câu xu hướng chung + 1 câu đối tượng nổi bật nhất.</li>
      <li><b>Body 1 & 2:</b> Chia nhóm dữ liệu logic và chọn số liệu đắt giá (điểm đầu, cuối, đỉnh, vượt mặt).</li>
    </ul>
  `;
}

// ==================== XỬ LÝ ẢNH ====================
function handleImageUpload(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    currentBase64Image = {
      mimeType: file.type,
      data: e.target.result.split(',')[1]
    };
    showPreviewImage(e.target.result);
  };
  reader.readAsDataURL(file);
}

function showPreviewImage(src) {
  const img = document.getElementById('chartImagePreview');
  img.src = src;
  img.style.display = 'block';
  document.getElementById('dropzoneNotice').style.display = 'none';
  document.getElementById('btnRemoveImage').style.display = 'inline-block';
}

function removeUploadedImage() {
  currentBase64Image = null;
  const img = document.getElementById('chartImagePreview');
  img.src = '';
  img.style.display = 'none';
  document.getElementById('dropzoneNotice').style.display = 'inline';
  document.getElementById('btnRemoveImage').style.display = 'none';
  document.getElementById('chartFileInput').value = '';
}

async function loadRemoteImageAsBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const reader = new FileReader();
    reader.onloadend = () => {
      currentBase64Image = {
        mimeType: blob.type || 'image/png',
        data: reader.result.split(',')[1]
      };
    };
    reader.readAsDataURL(blob);
  } catch (e) {}
}

// ==================== GỬI BÀI CHO AI CHẤM 2 TẦNG ====================
async function submitForGrading() {
  const essay = document.getElementById('studentEssayInput').value.trim();
  if (!essay) {
    alert("⚠️ Em vui lòng viết bài trước khi bấm nộp nhé!");
    return;
  }

  // Tạm dừng timer nếu đang mở
  stopGuideTimer();

  // Xác định chế độ làm bài (Tự lực hay có trợ giúp)
  const isAssisted = guideTotalOpenSeconds > 30;
  const learningModeReport = isAssisted 
    ? `Có trợ giúp từ Hướng dẫn mẫu (Đã mở xem: ${guideTotalOpenSeconds} giây)`
    : `Tự lực hoàn toàn (Chỉ mở xem: ${guideTotalOpenSeconds} giây - Không vượt quá 30 giây)`;

  // Lấy đề bài
  const isCustom = document.querySelector('input[name="promptSource"]:checked').value === 'custom';
  const promptText = isCustom 
    ? document.getElementById('customPromptInput').value.trim() 
    : (currentLoadedExercise?.prompt || "Task 1 Report");

  const submitBtn = document.getElementById('btnSubmitGrading');
  const resultBox = document.getElementById('result-box-t1');
  const resultContent = document.getElementById('result-content-t1');
  const statusBar = document.getElementById('status-bar-t1');

  submitBtn.disabled = true;
  resultBox.style.display = 'block';
  resultContent.innerHTML = '';
  statusBar.innerHTML = `⏳ Thầy đang đọc bài và chấm 2 tầng cho em... (Chế độ: <b>${learningModeReport}</b>)`;

  const systemInstruction = `
Bạn là Giám khảo IELTS & Giáo viên dạy viết cự phách.
QUY TẮC XƯNG HÔ: Bắt buộc xưng "Thầy" và gọi học sinh là "Em".
THÔNG TIN QUÁ TRÌNH LÀM BÀI CỦA HỌC SINH:
- Trạng thái tự lực: ${learningModeReport}. (Nếu học sinh làm tự lực, hãy khen ngợi tinh thần tự giác; nếu có trợ giúp, nhắc nhở em hãy cố gắng giảm dần sự phụ thuộc vào gợi ý).

HÃY XUẤT BÀI CHẤM THEO ĐÚNG CẤU TRÚC 6 PHẦN SAU (DÙNG 100% MARKDOWN, KHÔNG DÙNG THẺ DIV):

# PHẦN 1: MỔ XẺ 2 TẦNG CHI TIẾT TỪNG CÂU
---
### 📌 Câu [Số thứ tự] ([Vị trí câu]) — Điểm gốc của em: Band [Điểm/9]
#### 🛠️ BƯỚC 1: SỬA LỖI HIỂN NHIÊN (Khắc phục xong đạt: Band 6.0 - 6.5)
- **Thầy sửa trực tiếp:** [Viết lại câu. Lỗi sai dùng <del class="err">từ sai</del>, sửa đúng dùng <ins class="fix">từ đúng</ins>, nhắc nhở dùng <span class="teacher-note">💬 (lời dặn)</span>]
- **🔄 Từ được sửa ở Bước 1:**
  * <del class="err">[Từ sai]</del> ➔ <ins class="fix">[Từ đúng]</ins> *(Lý do: thì/từ loại/số liệu/giới từ)*
- **🔍 Lý do bị trừ điểm:** [Giải thích ngắn gọn lỗi]
- **👉 Câu sạch lỗi cơ bản:** "[Viết lại câu hoàn chỉnh]"

#### ✨ BƯỚC 2: NÂNG CẤP HOÀN MỸ (Chuẩn Band 8.0 - 8.5)
- **Bơm từ vựng & cấu trúc đỉnh cao:** [Viết câu với <mark class="vocab">từ C1-C2 (dịch nghĩa)</mark>]
- **🚀 Từ vựng nâng cấp ở Bước 2:**
  * [Từ ở bước 1] ➔ <mark class="vocab">[Từ C1-C2 xịn (dịch nghĩa)]</mark>
- **👉 Chốt câu hoàn mỹ Band 8.0+:** "[Câu xuất sắc nhất]"
---
*(Lặp lại cho tất cả các câu trong bài viết của học sinh)*

# PHẦN 2: BẢNG TỔNG HỢP ĐIỂM TỪNG CÂU
| Câu số | Vị trí | Điểm gốc (/9) | Điểm sau sửa lỗi (/9) | Điểm hoàn mỹ (/9) | Lỗi cốt lõi cần nhớ |
|---|---|---|---|---|---|

# PHẦN 3: ĐÁNH GIÁ 4 TIÊU CHÍ (IELTS TASK 1 RUBRIC)
| Task Achievement | Coherence & Cohesion | Lexical Resource | Grammatical Range & Accuracy |
|---|---|---|---|
| Band [Điểm] | Band [Điểm] | Band [Điểm] | Band [Điểm] |

> ### 🎯 OVERALL BAND SCORE: [Band điểm tổng]

# PHẦN 4: LỜI DẶN DÒ CHIẾN LƯỢC CỦA THẦY
[Đoạn văn thầy tâm sự 2-3 điểm mấu chốt học sinh cần cải thiện, kèm lời khuyên về trạng thái làm bài "${learningModeReport}"]

# PHẦN 5: BẢN SẠCH LỖI HIỂN NHIÊN (CLEAN VERSION)
> [Toàn bộ bài viết hoàn chỉnh sạch lỗi cơ bản theo Bước 1]

# PHẦN 6: BẢN NÂNG CẤP HOÀN MỸ (BAND 8.0+ MASTER VERSION)
> [Toàn bộ bài viết hoàn chỉnh viết lại xuất sắc theo Bước 2]
  `;

  const payload = [
    { text: systemInstruction + `\n\nĐề bài Task 1: ${promptText}\n\nBài làm của học sinh:\n${essay}` }
  ];

  if (currentBase64Image) {
    payload.push({
      inlineData: {
        mimeType: currentBase64Image.mimeType,
        data: currentBase64Image.data
      }
    });
  }

  let fullResponse = "";
  try {
    await streamGeminiTask1(payload, (chunk) => {
      fullResponse += chunk;
      resultContent.innerHTML = marked.parse(fullResponse);
    });

    statusBar.innerHTML = `✅ Thầy đã hoàn thành nhận xét 2 tầng! (Trạng thái: <b>${learningModeReport}</b>)`;
    submitBtn.disabled = false;
    submitBtn.innerText = "CHẤM LẠI / BÀI TIẾP THEO";
  } catch (err) {
    console.error(err);
    statusBar.innerHTML = `❌ Gặp lỗi kết nối AI: ${err.message}. Em bấm thử lại nhé!`;
    submitBtn.disabled = false;
    submitBtn.innerText = "THỬ LẠI";
  }
}
