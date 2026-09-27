/**
 * IELTS SPEAKING CONTROLLER & 2-TIER GRADING ENGINE
 */

// MÃ HÓA RUNTIME AUTH KEY
const _AUTH_SEEDS = [
  65, 81, 46, 65, 98, 56, 82, 78, 54, 75, 116, 80, 107, 51, 45, 50,
  75, 103, 117, 114, 119, 117, 116, 65, 115, 55, 95, 118, 82, 66,
  121, 81, 110, 113, 67, 48, 77, 86, 55, 52, 66, 119, 107, 82, 107,
  80, 110, 74, 89, 70, 90, 49, 119
];

function getDecodedKey() {
  return _AUTH_SEEDS.map(c => String.fromCharCode(c)).join('');
}

// Global States
let currentPart = 1;
let currentPromptsData = [];
let selectedPromptItem = null;

// Speech & Recording States
let recognition = null;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let base64Audio = null;

// Self-Reliance Timer (20 Seconds Rule)
let guideTimer = null;
let guideSecondsCount = 0;
let isGuideOpen = false;
let hasUsedAssistance = false; // Đổi thành true khi xem > 20 giây

if (window.marked) {
  marked.setOptions({ breaks: true, gfm: true });
}

window.addEventListener('DOMContentLoaded', () => {
  loadPartData(1);
  initSpeechRecognition();
});

/* ================== QUẢN LÝ DỮ LIỆU TỪ DATA FOLDER ================== */
async function loadPartData(partNum) {
  try {
    const res = await fetch(`data/speaking-part${partNum}.json`);
    if (!res.ok) throw new Error("Chưa tìm thấy file json");
    currentPromptsData = await res.json();
  } catch (e) {
    console.warn(`Lỗi nạp data part ${partNum}, dùng dự phòng:`, e);
    currentPromptsData = getFallbackData(partNum);
  }
  populateDropdowns();
}

function getFallbackData(partNum) {
  if (partNum === 1) {
    return [{
      id: "p1_boredom",
      topic: "Feeling bored",
      title: "[Part 1] Feeling bored - Full Question Set",
      fullPromptText: "1. Do you often feel bored?\n2. When would you feel bored?\n3. What do you do when you feel bored?\n4. Do you think childhood is boring or adulthood is boring?",
      guide: {
        suggestedIdeas: "Part 1 nói một mạch 4 câu, trả theo cấu trúc A-R-E-A.",
        keyVocab: ["Monotonous routine", "Kill time", "Preoccupied with"],
        sampleOutline: "- Q1: Seldom\n- Q2: Commutes\n- Q3: Podcasts\n- Q4: Adulthood"
      }
    }];
  }
  return [];
}

window.switchPart = (partNum) => {
  currentPart = partNum;
  document.getElementById('tabPart1Btn').classList.toggle('active', partNum === 1);
  document.getElementById('tabPart2Btn').classList.toggle('active', partNum === 2);
  document.getElementById('tabPart3Btn').classList.toggle('active', partNum === 3);
  document.getElementById('currentPartTag').innerText = `Part ${partNum}`;

  resetGuideTimer();
  loadPartData(partNum);
};

/* ================== DROPDOWN 2 CẤP (TOPIC -> PROMPTS) ================== */
function populateDropdowns() {
  const topicSel = document.getElementById('topicSelect');
  topicSel.innerHTML = '';

  // Lọc lấy danh sách Topic duy nhất
  const uniqueTopics = [...new Set(currentPromptsData.map(item => item.topic))];

  uniqueTopics.forEach((topic) => {
    const opt = document.createElement('option');
    opt.value = topic;
    opt.innerText = topic;
    topicSel.appendChild(opt);
  });

  handleTopicChange();
}

window.handleTopicChange = () => {
  const topicSel = document.getElementById('topicSelect');
  const promptSel = document.getElementById('promptSelect');
  const selectedTopic = topicSel.value;

  promptSel.innerHTML = '';
  const filteredPrompts = currentPromptsData.filter(item => item.topic === selectedTopic);

  filteredPrompts.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.innerText = item.title || item.topic;
    promptSel.appendChild(opt);
  });

  handlePromptChange();
};

window.handlePromptChange = () => {
  const promptId = document.getElementById('promptSelect').value;
  selectedPromptItem = currentPromptsData.find(item => item.id === promptId);

  if (selectedPromptItem) {
    document.getElementById('promptDisplayArea').innerText = selectedPromptItem.fullPromptText;
    updateGuideView(selectedPromptItem.guide);
  }
  resetGuideTimer();
};

function updateGuideView(guide) {
  const ideasText = document.getElementById('guideIdeasText');
  const vocabList = document.getElementById('guideVocabList');
  const outlineText = document.getElementById('guideOutlineText');

  vocabList.innerHTML = '';

  if (guide) {
    ideasText.innerText = guide.suggestedIdeas || "Chưa có gợi ý thêm.";
    outlineText.innerText = guide.sampleOutline || "Chưa có dàn ý.";
    if (guide.keyVocab && Array.isArray(guide.keyVocab)) {
      guide.keyVocab.forEach(v => {
        const li = document.createElement('li');
        li.innerText = v;
        vocabList.appendChild(li);
      });
    }
  } else {
    ideasText.innerText = "Chưa có gợi ý cho đề này.";
    outlineText.innerText = "";
  }
}

/* ================== CHUYỂN CHẾ ĐỘ: KHO ĐỀ / TỰ DÁN ĐỀ ================== */
window.togglePromptMode = () => {
  const isCustom = document.getElementById('modeCustom').checked;
  const bankSelectors = document.getElementById('bankSelectors');
  const promptDisplayArea = document.getElementById('promptDisplayArea');
  const customPromptInput = document.getElementById('customPromptInput');

  if (isCustom) {
    bankSelectors.style.display = 'none';
    promptDisplayArea.style.display = 'none';
    customPromptInput.style.display = 'block';
  } else {
    bankSelectors.style.display = 'grid';
    promptDisplayArea.style.display = 'block';
    customPromptInput.style.display = 'none';
    handlePromptChange();
  }
  resetGuideTimer();
};

window.syncCustomPrompt = () => {
  // Đồng bộ đề tự dán
};

/* ================== CƠ CHẾ BẤM GIỜ TỰ LỰC 20S ================== */
window.toggleGuide = () => {
  const box = document.getElementById('guideContentBox');
  const btn = document.getElementById('btnToggleGuide');
  isGuideOpen = !isGuideOpen;

  if (isGuideOpen) {
    box.style.display = 'block';
    btn.innerText = "📕 ĐÓNG HƯỚNG DẪN CHI TIẾT";
    startGuideTimer();
  } else {
    box.style.display = 'none';
    btn.innerText = "📖 MỞ HƯỚNG DẪN CHI TIẾT (GỢI Ý & TỪ VỰNG)";
    stopGuideTimer();
  }
};

function startGuideTimer() {
  if (guideTimer) return;
  guideTimer = setInterval(() => {
    guideSecondsCount++;
    document.getElementById('timerCount').innerText = guideSecondsCount;

    if (guideSecondsCount > 20 && !hasUsedAssistance) {
      hasUsedAssistance = true;
      const badge = document.getElementById('selfRelianceBadge');
      badge.className = "self-reliance-badge assisted";
      badge.innerHTML = `⚠️ Đã dùng trợ giúp (>20s: ${guideSecondsCount}s)`;
    } else if (hasUsedAssistance) {
      document.getElementById('selfRelianceBadge').innerHTML = `⚠️ Đã dùng trợ giúp (>20s: ${guideSecondsCount}s)`;
    }
  }, 1000);
}

function stopGuideTimer() {
  if (guideTimer) {
    clearInterval(guideTimer);
    guideTimer = null;
  }
}

function resetGuideTimer() {
  stopGuideTimer();
  guideSecondsCount = 0;
  hasUsedAssistance = false;
  isGuideOpen = false;
  document.getElementById('guideContentBox').style.display = 'none';
  document.getElementById('btnToggleGuide').innerText = "📖 MỞ HƯỚNG DẪN CHI TIẾT (GỢI Ý & TỪ VỰNG)";
  document.getElementById('timerCount').innerText = '0';
  const badge = document.getElementById('selfRelianceBadge');
  badge.className = "self-reliance-badge clean";
  badge.innerHTML = `🟢 Tự lực (<span id="timerCount">0</span>s / tối đa 20s)`;
}

/* ================== THU ÂM & WEB SPEECH API ================== */
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

/* ================== STREAMING GEMINI ENGINE ================== */
async function streamGeminiDirect(apiKey, parts, onChunk) {
  const modelsQueue = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.0-flash-lite",
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
      console.warn(`Model ${model} chuyển tiếp dự phòng: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError;
}

/* ================== GỬI CHẤM SPEAKING ================== */
window.startGrading = async () => {
  const apiKey = getDecodedKey();
  const isCustom = document.getElementById('modeCustom').checked;
  const taskPrompt = isCustom 
    ? document.getElementById('customPromptInput').value.trim() 
    : document.getElementById('promptDisplayArea').innerText.trim();
  const transcript = document.getElementById('speechTranscript').value.trim();

  if (!taskPrompt) {
    alert("⚠️ Vui lòng chọn hoặc nhập đề bài Speaking!");
    return;
  }

  if (!transcript) {
    alert("⚠️ Vui lòng ghi âm hoặc dán bản ký âm câu trả lời của em!");
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

  statusBar.innerHTML = "⏳ Thầy đang phân tích phát âm, ngữ điệu & mổ xẻ bài nói 2 tầng cho em, em đợi một chút nhé...";

  const assistanceStatus = hasUsedAssistance
    ? `HỌC SINH ĐÃ MỞ XEM HƯỚNG DẪN QUÁ 20S (${guideSecondsCount}s). Hãy nhận xét thêm về phản xạ độc lập và độ phụ thuộc tài liệu.`
    : `HỌC SINH HOÀN TOÀN TỰ LỰC (Không mở hướng dẫn hoặc mở dưới 20s).`;

  const systemInstruction = `
Bạn là Giám khảo IELTS Speaking hàng đầu và là người Thầy tận tụy.
QUY TẮC XƯNG HÔ: Bắt buộc xưng "Anh" và gọi học sinh là "Em".
QUY TẮC ĐỊNH DẠNG: DÙNG 100% MARKDOWN THUẦN (###, ####, -). MỖI Ý XUỐNG DÒNG RIÊNG BIỆT.
TRẠNG THÁI BÀI LÀM: ${assistanceStatus}

HÃY XUẤT BÀI CHẤM THEO ĐÚNG CẤU TRÚC 5 PHẦN SAU:

# PHẦN 1: MỔ XẺ TỪNG CÂU NÓI (2 TẦNG SPEAKING)
---
### 📌 Câu nói [Số thứ tự]: "[Câu nói gốc của em]" — Đánh giá: Band [Điểm/9]
#### 🛠️ BƯỚC 1: SỬA LỖI DIỄN ĐẠT & NGỮ PHÁP (Khắc phục xong đạt: Band [Điểm/9])
- **Anh chỉnh lại tự nhiên:** [Viết lại câu. Lỗi dùng <del class="err">từ sai</del>, sửa đúng bằng <ins class="fix">từ chuẩn xác</ins>, lưu ý dùng <span class="teacher-note">💬 (lời dặn)</span>]
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
*(Lặp lại cho tất cả các câu nói trong transcript của học sinh)*

# PHẦN 2: BẢNG ĐÁNH GIÁ 4 TIÊU CHÍ SPEAKING
| Fluency and Coherence | Lexical Resource | Grammatical Range & Accuracy | Pronunciation |
|---|---|---|---|
| Band [Điểm] | Band [Điểm] | Band [Điểm] | Band [Điểm] |

<div class="score-box">
  <h2>🎯 OVERALL SPEAKING BAND HIỆN TẠI: [Band điểm]</h2>
</div>

# PHẦN 3: LỜI DẶN DÒ CHIẾN LƯỢC CỦA ANH
[Đoạn văn nhận xét tật xấu khi nói: ngắt nghỉ không đúng chỗ, thiếu liên từ tự nhiên, thói quen dịch từ tiếng Việt, và đánh giá tính độc lập phản xạ theo trạng thái: "${assistanceStatus}"]

# PHẦN 4: BẢN NÓI HOÀN THIỆN TỰ NHIÊN (CLEAN VERSION)
> [Viết lại toàn bộ câu trả lời hoàn chỉnh theo Bước 1 để học sinh luyện đọc trôi chảy]

# PHẦN 5: BẢN NÓI XUẤT THẦN CHUẨN BẢN XỨ (MASTER 8.5 VERSION)
> [Viết lại toàn bộ câu trả lời hoàn chỉnh theo Bước 2 với Idioms & Collocations C1-C2]
`;

  const partsPayload = [
    { text: systemInstruction + `\n\nPhần thi: IELTS Speaking Part ${currentPart}\nCâu hỏi:\n${taskPrompt}\n\nTranscript học sinh nói:\n${transcript}` }
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
