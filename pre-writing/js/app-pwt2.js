import { streamGeminiPWT2 } from './api-pwt2.js';

let manifest = [];
let currentExerciseData = null;

window.addEventListener('DOMContentLoaded', async () => {
  await loadManifest();
  document.getElementById('essaySelect').addEventListener('change', handleEssayChange);
  document.getElementById('bandTargetSelect').addEventListener('change', renderContent);
  document.getElementById('studentEssayInput').addEventListener('input', updateWordCount);
  document.getElementById('btnGrading').addEventListener('click', startEvaluation);
});

async function loadManifest() {
  try {
    const res = await fetch('data/pwt2-manifest.json');
    manifest = await res.json();
    const select = document.getElementById('essaySelect');
    select.innerHTML = '';
    manifest.forEach((item, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.innerText = item.title;
      select.appendChild(opt);
    });
    if (manifest.length > 0) {
      await loadEssayFile(manifest[0].file);
    }
  } catch (err) {
    console.error("Lỗi manifest Task 2:", err);
  }
}

async function handleEssayChange(e) {
  const item = manifest[e.target.value];
  if (item) {
    await loadEssayFile(item.file);
  }
}

async function loadEssayFile(file) {
  try {
    const res = await fetch(file);
    currentExerciseData = await res.json();
    renderContent();
  } catch (err) {
    console.error("Lỗi nạp bài luận:", err);
  }
}

function renderContent() {
  if (!currentExerciseData) return;
  const band = document.getElementById('bandTargetSelect').value;
  document.getElementById('essayTypeBadge').innerText = currentExerciseData.type || "Task 2";

  const text = `📌 TOPIC:\n${currentExerciseData.prompt}\n\n--- DÀN Ý & BẢN DỊCH GỢI Ý (${band.toUpperCase()}): ---\n\n${currentExerciseData[band] || currentExerciseData.band8}`;
  document.getElementById('vietnameseSourceText').innerText = text;
}

function updateWordCount() {
  const text = document.getElementById('studentEssayInput').value.trim();
  const count = text ? text.split(/\s+/).length : 0;
  document.getElementById('wordCountDisplay').innerText = `${count} từ`;
}

async function startEvaluation() {
  const studentText = document.getElementById('studentEssayInput').value.trim();
  const sourceVN = document.getElementById('vietnameseSourceText').innerText.trim();

  if (!studentText) {
    alert("⚠️ Em hãy viết hoặc dịch bài luận tiếng Anh của mình trước khi chấm nhé!");
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

  const systemPrompt = `
Bạn là Chuyên gia IELTS Writing Task 2 khắt khe nhưng tận tình.
QUY TẮC XƯNG HÔ: Bắt buộc xưng "Anh" và gọi học sinh là "Em".
QUY TẮC FORMAT: Dùng Markdown chuẩn, dùng inline tags: <del class="err">, <ins class="fix">, <mark class="vocab">, <span class="teacher-note">.

CẤU TRÚC PHẢN HỒI:
# PHẦN 1: SỬA TỪNG CÂU THEO NGUYÊN LÝ 2 TẦNG (TASK 2 ESSAY)
---
### 📌 Câu [Số]: "[Câu học sinh]"
*Đối chiếu ý tưởng: "[Ý tưởng tiếng Việt]"*
#### 🛠️ TẦNG 1: SỬA LỖI NGỮ PHÁP, VĂN PHONG VÀ CHINGLISH (Band 6.5 - 7.0)
- **Anh sửa trực tiếp:** [Câu sửa có <del class="err">, <ins class="fix">, <span class="teacher-note">]
- **🔄 Giải thích lỗi sai:** [Nguyên nhân dịch word-by-word, collocation gượng, sai mệnh đề quan hệ...]
- **👉 Bản sạch lỗi:** "[Câu chuẩn xác]"

#### ✨ TẦNG 2: NÂNG TẦM ACADEMIC BAND 8.0+
- **Biến hóa với lập luận đanh thép & Collocations C1-C2:** [Câu Band 8.0+ có <mark class="vocab">]
- **🚀 Từ vựng & Idiomatic Structures ăn điểm:**
  * [Cụm tầng 1] ➔ <mark class="vocab">[Cách dùng từ bản xứ đỉnh cao]</mark>
- **👉 Bản nâng cấp:** "[Câu hoàn chỉnh Band 8.5]"
---

# PHẦN 2: BẢNG ĐÁNH GIÁ 4 TIÊU CHÍ TASK 2
| Task Response (Trả lời đề & Lập luận) | Coherence & Cohesion (Mạch lạc & Liên kết) | Lexical Resource (Từ vựng học thuật) | Grammatical Range & Accuracy (Ngữ pháp) |
|---|---|---|---|
| Band [X] | Band [X] | Band [X] | Band [X] |

> ### 🎯 OVERALL BAND DỰ KIẾN: [X]/9.0

# PHẦN 3: NHẬN XÉT CHIẾN LƯỢC & TƯ DUY PHẢN BIỆN (CRITICAL THINKING)
[Chỉ ra cách em phát triển ý tưởng: dẫn chứng (examples), phân tích nguyên nhân - kết quả (cause-effect)]

# PHẦN 4: BÀI LUẬN HOÀN CHỈNH SẠCH LỖI (BAND 7.0)
> [Tổng hợp các câu sửa tầng 1]

# PHẦN 5: BÀI LUẬN BẢN XỨ ĐẲNG CẤP (BAND 8.5)
> [Tổng hợp các câu nâng cấp tầng 2]
`;

  const userPayload = `
Đề bài: ${currentExerciseData.prompt}
Dạng bài: ${currentExerciseData.type}
Bản tiếng Việt / Dàn ý:
${sourceVN}

Bản dịch / Bài viết của học sinh:
${studentText}
`;

  let fullResponse = "";
  try {
    const usedModel = await streamGeminiPWT2([
      { text: systemPrompt + "\n\n" + userPayload }
    ], (chunk) => {
      fullResponse += chunk;
      resultContent.innerHTML = marked.parse(fullResponse);
    });

    statusBar.innerHTML = `✅ Thầy đã chấm xong bằng model [${usedModel}]. Em hãy nghiền ngẫm các Collocations Tầng 2 nhé!`;
    btn.disabled = false;
    btn.innerHTML = "<span>⚡ Chấm lại / Đề khác</span>";
  } catch (err) {
    statusBar.innerHTML = `❌ Lỗi kết nối: ${err.message}. Em bấm thử lại nhé!`;
    btn.disabled = false;
  }
}
