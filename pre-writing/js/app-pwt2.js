import { streamGeminiPWT2 } from './api-pwt2.js';

let manifestData = [];
let currentEssay = null;

window.addEventListener('DOMContentLoaded', async () => {
  await initEssayList();
  document.getElementById('essaySelect').addEventListener('change', onEssaySelected);
  document.getElementById('bandTargetSelect').addEventListener('change', updateEssayView);
  document.getElementById('studentEssayInput').addEventListener('input', updateWordCount);
  document.getElementById('btnGrading').addEventListener('click', runEvaluation);
});

async function initEssayList() {
  try {
    const res = await fetch('data/pwt2-manifest.json');
    manifestData = await res.json();
    const selectBox = document.getElementById('essaySelect');
    selectBox.innerHTML = '';
    manifestData.forEach((item, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.innerText = item.title;
      selectBox.appendChild(opt);
    });
    if (manifestData.length > 0) {
      await loadEssayDetail(manifestData[0].file);
    }
  } catch (err) {
    console.error("Lỗi đọc danh mục Task 2:", err);
  }
}

async function onEssaySelected(e) {
  const item = manifestData[e.target.value];
  if (item) {
    await loadEssayDetail(item.file);
  }
}

async function loadEssayDetail(filePath) {
  try {
    const res = await fetch(filePath);
    currentEssay = await res.json();
    updateEssayView();
  } catch (err) {
    console.error("Lỗi tải chi tiết bài Task 2:", err);
  }
}

function updateEssayView() {
  if (!currentEssay) return;
  const targetBand = document.getElementById('bandTargetSelect').value;

  document.getElementById('essayTypeBadge').innerText = currentEssay.type || 'Task 2 Essay';

  const promptText = `📌 TOPIC:\n${currentEssay.prompt}\n\n--- BẢN MẪU DỊCH Ý TƯỞNG (${targetBand.toUpperCase()}): ---\n\n${currentEssay[targetBand] || currentEssay.band8}`;
  document.getElementById('vietnameseSourceText').innerText = promptText;
}

function updateWordCount() {
  const text = document.getElementById('studentEssayInput').value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  document.getElementById('wordCountDisplay').innerText = `${words} từ`;
}

async function runEvaluation() {
  const studentText = document.getElementById('studentEssayInput').value.trim();
  const sourceVN = document.getElementById('vietnameseSourceText').innerText.trim();

  if (!studentText) {
    alert("⚠️ Em hãy viết câu hoặc bài luận trước khi bấm chấm nhé!");
    return;
  }

  const btn = document.getElementById('btnGrading');
  const resultBox = document.getElementById('result-box');
  const resultContent = document.getElementById('result-content');
  const statusBar = document.getElementById('status-bar');

  btn.disabled = true;
  resultBox.style.display = 'block';
  resultContent.innerHTML = '';
  statusBar.innerHTML = "⏳ Thầy đang phân tích lập luận & nâng cấp từ vựng C1-C2 cho bài luận Task 2 của em...";

  const systemInstruction = `
Bạn là Chuyên gia IELTS Writing Task 2 khắt khe nhưng tận tình.
QUY TẮC BẮT BUỘC: Xưng "Anh" và gọi học sinh là "Em".
QUY TẮC ĐỊNH DẠNG: Dùng cú pháp Markdown chuẩn (#, ##, ###, ####). Dùng thẻ inline:
<del class="err">từ sai/gượng</del>
<ins class="fix">từ sửa chuẩn</ins>
<mark class="vocab">Collocation C1-C2 Task 2</mark>
<span class="teacher-note">💬 (lời dặn của Anh)</span>

XUẤT THEO CẤU TRÚC:
# PHẦN 1: SỬA TỪNG CÂU THEO NGUYÊN LÝ 2 TẦNG (TASK 2 ESSAY)
---
### 📌 Câu [Số]: "[Câu học sinh]"
*Đối chiếu ý tưởng: "[Ý tưởng tiếng Việt]"*
#### 🛠️ TẦNG 1: SỬA LỖI NGỮ PHÁP, VĂN PHONG VÀ CHINGLISH (Band 6.5 - 7.0)
- **Anh sửa trực tiếp:** [Câu sửa]
- **🔄 Giải thích lỗi sai:** [Word-by-word, collocation chưa tự nhiên, sai mệnh đề quan hệ...]
- **👉 Bản sạch lỗi:** "[Câu chuẩn xác]"

#### ✨ TẦNG 2: NÂNG TẦM ACADEMIC BAND 8.0+
- **Biến hóa với lập luận đanh thép & Collocations C1-C2:** [Câu Band 8.0+]
- **🚀 Từ vựng & Cấu trúc ăn điểm:** [Cụm tầng 1 ➔ Cụm Band 8]
- **👉 Bản nâng cấp:** "[Câu đỉnh cao]"
---

# PHẦN 2: BẢNG ĐÁNH GIÁ 4 TIÊU CHÍ TASK 2
| Task Response | Coherence & Cohesion | Lexical Resource | Grammatical Range & Accuracy |
|---|---|---|---|
| Band [X] | Band [X] | Band [X] | Band [X] |

> ### 🎯 OVERALL BAND DỰ KIẾN: [X]/9.0

# PHẦN 3: NHẬN XÉT TƯ DUY PHẢN BIỆN (CRITICAL THINKING)
[Chỉ rõ cách triển khai luận điểm, dẫn chứng, phân tích nguyên nhân - kết quả]

# PHẦN 4: BÀI LUẬN HOÀN CHỈNH SẠCH LỖI (BAND 7.0)
> [Tổng hợp các câu sửa tầng 1]

# PHẦN 5: BÀI LUẬN BẢN XỨ ĐẲNG CẤP (BAND 8.5)
> [Tổng hợp các câu nâng cấp tầng 2]
`;

  const payload = [
    { text: systemInstruction + `\n\nĐề bài: ${currentEssay.prompt}\nThể loại: ${currentEssay.type}\nDàn ý tiếng Việt:\n${sourceVN}\n\nBài học sinh:\n${studentText}` }
  ];

  let fullText = "";
  try {
    const usedModel = await streamGeminiPWT2(payload, (chunk) => {
      fullText += chunk;
      resultContent.innerHTML = marked.parse(fullText);
    });
    statusBar.innerHTML = `✅ Thầy đã chấm xong bằng model [${usedModel}]. Em nghiền ngẫm các Collocations Tầng 2 nhé!`;
    btn.disabled = false;
  } catch (e) {
    statusBar.innerHTML = `❌ Lỗi: ${e.message}. Em bấm thử lại nhé!`;
    btn.disabled = false;
  }
}
