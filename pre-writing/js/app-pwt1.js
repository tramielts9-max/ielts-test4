import { streamGeminiPWT1 } from './api-pwt1.js';

let manifestData = [];
let currentExercise = null;

window.addEventListener('DOMContentLoaded', async () => {
  await initExerciseList();
  document.getElementById('exerciseSelect').addEventListener('change', onExerciseSelected);
  document.getElementById('bandTargetSelect').addEventListener('change', updateExerciseView);
  document.getElementById('studentEnglishInput').addEventListener('input', updateWordCount);
  document.getElementById('btnGrading').addEventListener('click', runEvaluation);
});

async function initExerciseList() {
  try {
    const res = await fetch('data/pwt1-manifest.json');
    manifestData = await res.json();
    const selectBox = document.getElementById('exerciseSelect');
    selectBox.innerHTML = '';
    manifestData.forEach((item, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.innerText = item.title;
      selectBox.appendChild(opt);
    });
    if (manifestData.length > 0) {
      await loadExerciseDetail(manifestData[0].file);
    }
  } catch (err) {
    console.error("Lỗi đọc danh mục đề thi:", err);
  }
}

async function onExerciseSelected(e) {
  const item = manifestData[e.target.value];
  if (item) {
    await loadExerciseDetail(item.file);
  }
}

async function loadExerciseDetail(filePath) {
  try {
    const res = await fetch(filePath);
    currentExercise = await res.json();
    updateExerciseView();
  } catch (err) {
    console.error("Lỗi tải chi tiết bài tập:", err);
  }
}

function updateExerciseView() {
  if (!currentExercise) return;
  const targetBand = document.getElementById('bandTargetSelect').value;

  // Hiển thị loại biểu đồ
  document.getElementById('chartTypeBadge').innerText = currentExercise.type || 'Task 1';

  // Hiển thị nội dung đề và bản mẫu tiếng Việt
  const promptText = `📌 ĐỀ BÀI (ENGLISH PROMPT):\n${currentExercise.prompt}\n\n--- BẢN MẪU TIẾNG VIỆT ĐỐI ỨNG (${targetBand.toUpperCase()}): ---\n\n${currentExercise[targetBand] || currentExercise.band8}`;
  document.getElementById('vietnameseSourceText').innerText = promptText;

  // Tự động gán và tải ảnh biểu đồ từ thư mục prewt12images
  const imgElement = document.getElementById('chartImage');
  const fallback = document.getElementById('imageFallback');
  const pathDisplay = document.getElementById('expectedImgName');

  // ==============================================================
  // ĐÂY LÀ CHỖ ĐÃ ĐƯỢC SỬA TỰ ĐỘNG LẤY ẢNH TỪ THƯ MỤC prewt12images:
  const fileName = currentExercise.image.split('/').pop();
  const relativeImagePath = `prewt12images/${fileName}`;
  // ==============================================================

  pathDisplay.innerText = relativeImagePath;

  imgElement.style.display = 'none';
  fallback.style.display = 'block';

  const tester = new Image();
  tester.src = relativeImagePath;
  tester.onload = () => {
    imgElement.src = relativeImagePath;
    imgElement.style.display = 'inline-block';
    fallback.style.display = 'none';
  };
  tester.onerror = () => {
    imgElement.style.display = 'none';
    fallback.style.display = 'block';
  };
}

function updateWordCount() {
  const text = document.getElementById('studentEnglishInput').value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  document.getElementById('wordCountDisplay').innerText = `${words} từ`;
}

async function runEvaluation() {
  const studentText = document.getElementById('studentEnglishInput').value.trim();
  const sourceVN = document.getElementById('vietnameseSourceText').innerText.trim();

  if (!studentText) {
    alert("⚠️ Em hãy viết hoặc gõ câu dịch của mình trước khi bấm chấm nhé!");
    return;
  }

  const btn = document.getElementById('btnGrading');
  const resultBox = document.getElementById('result-box');
  const resultContent = document.getElementById('result-content');
  const statusBar = document.getElementById('status-bar');

  btn.disabled = true;
  resultBox.style.display = 'block';
  resultContent.innerHTML = '';
  statusBar.innerHTML = "⏳ Thầy đang đối chiếu số liệu biểu đồ & dịch thuật 2 tầng cho em...";

  const systemInstruction = `
Bạn là Giám khảo IELTS Writing Task 1 cự phách và là Thầy dạy dịch thuật học thuật.
QUY TẮC BẮT BUỘC: Xưng "Anh" và gọi học sinh là "Em".
QUY TẮC ĐỊNH DẠNG: Dùng cú pháp Markdown chuẩn (#, ##, ###, ####). Dùng thẻ inline:
<del class="err">từ sai</del>
<ins class="fix">từ sửa đúng</ins>
<mark class="vocab">từ vựng C1-C2 Task 1</mark>
<span class="teacher-note">💬 (lời dặn của Anh)</span>

XUẤT THEO CẤU TRÚC 5 PHẦN:
# PHẦN 1: MỔ XẺ TỪNG CÂU DỊCH (SỬA BÀI 2 TẦNG TASK 1)
---
### 📌 Câu [Số]: "[Câu học sinh]"
*Đối chiếu tiếng Việt: "[Câu tiếng Việt]"*
#### 🛠️ TẦNG 1: SỬA LỖI NGỮ PHÁP, SỐ LIỆU & DIỄN ĐẠT (Band 6.5 - 7.0)
- **Anh sửa trực tiếp:** [Câu sửa]
- **🔄 Các điểm cần sửa ngay:** [Lỗi sai giới từ at/by/to, chia thì, chia số ít/nhiều]
- **👉 Bản sửa sạch lỗi:** "[Câu hoàn chỉnh]"

#### ✨ TẦNG 2: NÂNG TẦM ACADEMIC TASK 1 (Band 8.0 - 8.5)
- **Biến hóa với cấu trúc và Collocations học thuật:** [Câu Band 8+]
- **🚀 Từ vựng & cấu trúc ăn điểm:** [Cụm tầng 1 ➔ Cụm Band 8]
- **👉 Bản nâng cấp:** "[Câu đỉnh cao]"
---

# PHẦN 2: BẢNG ĐÁNH GIÁ 4 TIÊU CHÍ TASK 1
| Task Achievement | Coherence & Cohesion | Lexical Resource | Grammatical Range & Accuracy |
|---|---|---|---|
| Band [X] | Band [X] | Band [X] | Band [X] |

> ### 🎯 OVERALL BAND DỰ KIẾN: [X]/9.0

# PHẦN 3: LỜI DẶN DÒ CHIẾN LƯỢC CỦA ANH
[Nêu 2-3 lỗi cố hữu cần khắc phục]

# PHẦN 4: BẢN DỊCH HOÀN CHỈNH SẠCH LỖI (BAND 7.0)
> [Tổng hợp các câu sửa tầng 1]

# PHẦN 5: BẢN DỊCH ĐẲNG CẤP BẢN XỨ (BAND 8.5)
> [Tổng hợp các câu tầng 2]
`;

  const payload = [
    { text: systemInstruction + `\n\nĐề bài: ${currentExercise.prompt}\nDạng bài: ${currentExercise.type}\nTiếng Việt:\n${sourceVN}\n\nBài học sinh:\n${studentText}` }
  ];

  let fullText = "";
  try {
    const usedModel = await streamGeminiPWT1(payload, (chunk) => {
      fullText += chunk;
      resultContent.innerHTML = marked.parse(fullText);
    });
    statusBar.innerHTML = `✅ Thầy đã chấm xong bằng model [${usedModel}]. Em học kỹ các cấu trúc Tầng 2 nhé!`;
    btn.disabled = false;
  } catch (e) {
    statusBar.innerHTML = `❌ Lỗi: ${e.message}. Em bấm thử lại nhé!`;
    btn.disabled = false;
  }
}
