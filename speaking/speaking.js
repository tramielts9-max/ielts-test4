// HE THONG MA HOA DANG SO NGUYEN - TU DONG DECODE RUNTIME
const _AUTH_SEEDS = [
  65, 81, 46, 65, 98, 56, 82, 78, 54, 75, 116, 80, 107, 51, 45, 50,
  75, 103, 117, 114, 119, 117, 116, 65, 115, 55, 95, 118, 82, 66,
  121, 81, 110, 113, 67, 48, 77, 86, 55, 52, 66, 119, 107, 82, 107,
  80, 110, 74, 89, 70, 90, 49, 119
];

function getDecodedKey() {
  return _AUTH_SEEDS.map(c => String.fromCharCode(c)).join('');
}

let currentPart = 1;
let promptsBank = { part1: [], part2: [], part3: [] };
let recognition = null;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let base64Audio = null;

if (window.marked) {
  marked.setOptions({ breaks: true, gfm: true });
}

window.addEventListener('DOMContentLoaded', () => {
  loadPromptsData();
  initSpeechRecognition();
});

async function loadPromptsData() {
  try {
    const res = await fetch('prompts-s.json');
    promptsBank = await res.json();
    populatePromptDropdown();
  } catch (e) {
    console.warn("Chưa tải được prompts-s.json:", e);
  }
}

window.switchPart = (partNum) => {
  currentPart = partNum;
  document.getElementById('tabPart1Btn').classList.toggle('active', partNum === 1);
  document.getElementById('tabPart2Btn').classList.toggle('active', partNum === 2);
  document.getElementById('tabPart3Btn').classList.toggle('active', partNum === 3);
  populatePromptDropdown();
};

function populatePromptDropdown() {
  const sel = document.getElementById('presetPromptSelect');
  if (!sel) return;
  const list = promptsBank[`part${currentPart}`] || [];
  sel.innerHTML = '';

  if (list.length === 0) {
    const opt = document.createElement('option');
    opt.innerText = "Tự gõ câu hỏi Speaking của em...";
    sel.appendChild(opt);
    return;
  }

  list.forEach((item, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.innerText = `[${item.topic}] ${item.prompt}`;
    sel.appendChild(opt);
  });

  handleSelectPresetPrompt();
}

window.handleSelectPresetPrompt = () => {
  const list = promptsBank[`part${currentPart}`] || [];
  const idx = document.getElementById('presetPromptSelect').value;
  if (list[idx]) {
    document.getElementById('taskPromptInput').value = list[idx].prompt;
  }
};

/* ================== THU ÂM & SPEECH-TO-TEXT ================== */
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
    document.getElementById('speechTranscript').value = final + interim;
  };

  recognition.onerror = (e) => console.error("Speech Error:", e.error);
}

window.toggleRecording = async () => {
  const recBtn = document.getElementById('recBtn');
  const recText = document.getElementById('recText');
  const recIcon = document.getElementById('recIcon');

  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        document.getElementById('audioPreview').src = URL.createObjectURL(audioBlob);
        document.getElementById('audioContainer').style.display = 'block';

        const reader = new FileReader();
        reader.onloadend = () => {
          base64Audio = reader.result.split(',')[1];
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      if (recognition) {
        document.getElementById('speechTranscript').value = '';
        recognition.start();
      }

      isRecording = true;
      recBtn.classList.add('recording');
      recText.innerText = "Dừng ghi âm & Hoàn thành bài nói";
      recIcon.innerText = "⏹️";
    } catch (err) {
      alert("Không thể mở Micro: " + err.message + ". Em hãy cấp quyền micro trên trình duyệt nhé!");
    }
  } else {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    if (recognition) recognition.stop();

    isRecording = false;
    recBtn.classList.remove('recording');
    recText.innerText = "Nói lại lần nữa (Ghi âm mới)";
    recIcon.innerText = "🎙️";
  }
};

/* ================== STREAMING ENGINE & SỬA BÀI ================== */
async function streamGeminiDirect(apiKey, parts, onChunk) {
  const modelsQueue = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  let lastError = null;

  for (let model of modelsQueue) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: parts }] })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "").trim();
            try {
              const parsed = JSON.parse(jsonStr);
              const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              onChunk(textChunk);
            } catch (e) {}
          }
        }
      }
      return model;
    } catch (err) {
      console.warn(`Model ${model} đang bận: ${err.message}. Tự động đổi dự phòng...`);
      lastError = err;
    }
  }
  throw lastError;
}

window.startGrading = async () => {
  const apiKey = getDecodedKey();
  const taskPrompt = document.getElementById('taskPromptInput').value.trim();
  const transcript = document.getElementById('speechTranscript').value.trim();

  if (!transcript) {
    alert("⚠️ Vui lòng ghi âm hoặc nhập bản transcript câu trả lời của em!");
    return;
  }

  const submitBtn = document.getElementById('btnStartGrading');
  const printBtn = document.getElementById('btnPrintReport');
  const resultBox = document.getElementById('result-box');
  const resultContent = document.getElementById('result-content');
  const statusBar = document.getElementById('status-bar');

  submitBtn.disabled = true;
  printBtn.style.display = "none";
  resultBox.style.display = "block";
  resultContent.innerHTML = "";

  statusBar.innerHTML = "⏳ Thầy đang lắng nghe, phân tích ngữ điệu & sửa bài 2 tầng cho em, em đợi một chút nhé...";

  const systemInstruction = `
Bạn là Giám khảo chấm thi IELTS Speaking cự phách và là người Thầy tận tâm.
QUY TẮC XƯNG HÔ: Bắt buộc xưng "Anh" và gọi thí sinh là "Em".
QUY TẮC ĐỊNH DẠNG TUYỆT ĐỐI:
1. KHÔNG DÙNG THẺ <div>, </div>, <p>, <ul>, <li>.
2. DÙNG 100% CÚ PHÁP MARKDOWN THUẦN (dùng ###, ####, và các dấu gạch đầu dòng - để phân tách).
3. MỖI Ý PHẢI XUỐNG DÒNG RIÊNG BIỆT.

HÃY XUẤT BÀI CHẤM THEO ĐÚNG CẤU TRÚC SAU:

# PHẦN 1: MỔ XẺ TỪNG CÂU NÓI (2 TẦNG SPEAKING)
---
### 📌 Câu nói [Số thứ tự]: "[Câu nói gốc của em]" — Đánh giá: Band [Điểm/9]
#### 🛠️ BƯỚC 1: SỬA LỖI DIỄN ĐẠT & NGỮ PHÁP (Khắc phục xong đạt: Band [Điểm/9])
- **Anh chỉnh lại tự nhiên:** [Viết lại câu em nói. Chỗ lỗi dùng <del class="err">từ sai</del>, sửa đúng bằng <ins class="fix">từ chuẩn xác</ins>, lưu ý ngữ điệu dùng <span class="teacher-note">💬 (lời dặn)</span>]
- **🔄 Điểm cần sửa tức thì:**
  * <del class="err">[Từ/cụm từ sai hoặc gượng]</del> ➔ <ins class="fix">[Từ chuẩn ngữ pháp & tự nhiên]</ins> *(Lý do: sai thì / word choice không tự nhiên / phát âm dễ nhầm)*
- **🔍 Điểm trừ ở phát ngôn này:** [Giải thích ngắn gọn]
- **👉 Câu sửa sạch lỗi cơ bản:** "[Câu hoàn chỉnh sau khi sửa sạch]"

#### ✨ BƯỚC 2: NÂNG TẦM BẢN XỨ (Chuẩn Band 8.0 - 8.5)
- **Biến hóa với Collocations & Idioms:** [Viết câu chuẩn bản xứ với <mark class="vocab">Idiomatic expressions / Collocations C1-C2 (dịch nghĩa tiếng Việt)]</mark>]
- **🚀 Từ vựng & cụm từ nâng cấp:**
  * [Từ đơn giản ở Bước 1] ➔ <mark class="vocab">[Cách nói chuẩn người bản xứ (kèm nghĩa)]</mark>
- **👉 Phiên bản nói đẳng cấp Band 8.0+:** "[Câu nói xuất sắc nhất]"
---
*(Lặp lại cho tất cả các câu nói trong transcript)*

# PHẦN 2: BẢNG ĐÁNH GIÁ 4 TIÊU CHÍ SPEAKING
| Fluency and Coherence | Lexical Resource | Grammatical Range & Accuracy | Pronunciation |
|---|---|---|---|
| Band [Điểm] | Band [Điểm] | Band [Điểm] | Band [Điểm] |

<div class="score-box">
  <h2>🎯 OVERALL SPEAKING BAND HIỆN TẠI: [Band điểm]</h2>
</div>

# PHẦN 3: LỜI DẶN DÒ CHIẾN LƯỢC CỦA ANH
[Đoạn văn tâm tình chỉ ra 2 tật xấu khi nói em cần khắc phục ngay: ngắt nghỉ không đúng chỗ, thiếu liên từ tự nhiên, phản xạ dịch từ tiếng Việt]

# PHẦN 4: BẢN NÓI HOÀN THIỆN TỰ NHIÊN (CLEAN VERSION)
> [Viết toàn bộ câu trả lời hoàn chỉnh theo Bước 1]

# PHẦN 5: BẢN NÓI XUẤT THẦN CHUẨN BẢN XỨ (MASTER 8.5 VERSION)
> [Viết toàn bộ câu trả lời hoàn chỉnh theo Bước 2]
`;

  const partsPayload = [
    { text: systemInstruction + `\n\nPhần thi: IELTS Speaking Part ${currentPart}\nCâu hỏi: ${taskPrompt}\n\nTranscript học sinh nói:\n${transcript}` }
  ];

  if (base64Audio) {
    partsPayload.push({
      inlineData: { mimeType: "audio/mp3", data: base64Audio }
    });
  }

  let fullMarkdown = "";

  try {
    await streamGeminiDirect(apiKey, partsPayload, (chunk) => {
      fullMarkdown += chunk;
      resultContent.innerHTML = marked.parse(fullMarkdown);
    });

    statusBar.innerHTML = "✅ Thầy đã chấm xong bài nói cho em rồi nhé! Em xem kỹ từng câu bên dưới nha.";
    submitBtn.disabled = false;
    submitBtn.innerText = "CHẤM LẠI BÀI KHÁC";
    printBtn.style.display = "inline-block";
  } catch (err) {
    console.error(err);
    statusBar.innerHTML = "❌ Có lỗi xảy ra: " + err.message;
    submitBtn.disabled = false;
    submitBtn.innerText = "THỬ LẠI";
  }
};
