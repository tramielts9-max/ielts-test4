/**
 * js/ai-assistant.js - Trợ giảng IELTS Reading AI Streaming trực tiếp (Bỏ trung gian)
 */
import { stateManager } from './state.js';

// HỆ THỐNG MÃ HÓA KEY CỦA BẠN SANG SỐ NGUYÊN (TỰ ĐỘNG DECODE RUNTIME)
const _AUTH_SEEDS = [
  65, 81, 46, 65, 98, 56, 82, 78, 54, 74, 111, 118, 45, 99, 119, 83,
  107, 75, 75, 119, 84, 75, 87, 97, 87, 105, 119, 116, 52, 84, 75, 121,
  112, 48, 90, 51, 65, 107, 65, 65, 119, 79, 116, 81, 115, 87, 50, 80,
  88, 104, 52, 110, 65
];

function getDecodedKey() {
  return _AUTH_SEEDS.map(c => String.fromCharCode(c)).join('');
}

/**
 * STREAMING ENGINE: Gọi trực tiếp Google Gemini API qua Server-Sent Events (SSE)
 * Thứ tự ưu tiên: gemini-3.5-flash-lite -> gemini-3.1-flash-lite -> các bản dự phòng
 */
async function streamGeminiDirect(apiKey, promptText, onChunk) {
  const modelsQueue = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  let lastError = null;

  for (const model of modelsQueue) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }]
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
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
              if (textChunk) onChunk(textChunk);
            } catch (e) {}
          }
        }
      }
      return model;
    } catch (err) {
      console.warn(`Model ${model} đang bận: ${err.message}. Đang chuyển model tiếp theo...`);
      lastError = err;
    }
  }

  throw lastError;
}

function formatAIResponse(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\n\n/g, '<div style="margin-bottom:8px;"></div>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/==(.*?)==/g, "<mark style='background:#fef08a; padding:1px 5px; border-radius:3px;'>$1</mark>")
    .replace(/\[kw\](.*?)\[\/kw\]/g, "<span class='kw' style='background:#86efac; color:#14532d; font-weight:700; padding:1px 5px; border-radius:3px;'>$1</span>");
}

export async function askGemini(qId, promptText) {
  if (stateManager.isReviewMode) {
    alert("Em đang ở chế độ xem lại bài đã nộp.");
    return;
  }

  const inputEl = document.getElementById(`ai_ask_${qId}`);
  const responseBox = document.getElementById(`ai_response_${qId}`);
  const btnEl = document.getElementById(`ai_btn_${qId}`);
  if (!inputEl || !responseBox) return;

  const userQuestion = promptText || inputEl.value.trim();
  if (!userQuestion) {
    alert("Vui lòng gõ thắc mắc của em trước khi gửi nhé!");
    return;
  }

  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerText = "⏳ Đang trả lời...";
  }

  responseBox.style.display = "block";
  const tempId = "ai_stream_" + Date.now();
  const safeUserText = userQuestion.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const tempDiv = document.createElement('div');
  tempDiv.id = tempId;
  tempDiv.style.cssText = "border-top: 1px dashed var(--border-color); padding-top: 10px; margin-top: 10px; font-size: 13.5px; line-height: 1.65;";
  tempDiv.innerHTML = `
    <div style="font-weight: 700; color: var(--primary-blue); margin-bottom: 4px;">💬 "${safeUserText}"</div>
    <div class="ai-stream-content" style="color: var(--text-main);"><i>🤖 AI đang đọc bài văn và phân tích câu hỏi...</i></div>
  `;
  responseBox.appendChild(tempDiv);
  inputEl.value = "";

  const streamContentEl = tempDiv.querySelector('.ai-stream-content');
  const passageText = document.getElementById('passageBox')?.innerText?.trim() || "";

  const qDiv = document.getElementById(qId);
  let qContext = "";
  if (qDiv) {
    const clone = qDiv.cloneNode(true);
    clone.querySelectorAll('.explanation, .thought-box, .ai-assistant-box, .result, .socratic-container').forEach(el => el.remove());
    qContext = clone.innerText.trim();
  }

  const fullPrompt = `Bạn là một Chuyên gia IELTS Reading 9.0 và là Giáo viên hướng dẫn tận tụy.
QUY TẮC PHẢN HỒI:
- Giải thích súc tích, trực diện, không lan man.
- QUY TẮC ĐỊNH DẠNG:
  + Dùng **từ khóa** để IN ĐẬM.
  + Dùng ==bằng chứng/dòng chứng minh trích từ bài đọc== để TÔ VÀNG.
  + Dùng [kw]từ đồng nghĩa (paraphrase)[/kw] để TÔ XANH LÁ.

--- NỘI DUNG BÀI ĐỌC (PASSAGE) ---
${passageText.slice(0, 10000)}

--- CÂU HỎI TRONG ĐỀ ---
${qContext}

--- HỌC VIÊN THẮC MẮC ---
"${userQuestion}"

HÃY GIẢI THÍCH CHO HỌC VIÊN TẠI SAO LẠI NHƯ VẬY DỰA TRÊN ĐOẠN VĂN TRÊN:`;

  const apiKey = getDecodedKey();
  let accumulatedMarkdown = "";

  try {
    await streamGeminiDirect(apiKey, fullPrompt, (chunk) => {
      accumulatedMarkdown += chunk;
      if (streamContentEl) {
        streamContentEl.innerHTML = formatAIResponse(accumulatedMarkdown);
      }
      responseBox.scrollTop = responseBox.scrollHeight;
    });

    document.dispatchEvent(new Event('input'));
  } catch (err) {
    if (streamContentEl) {
      streamContentEl.innerHTML = `<span style="color:#dc2626;">⚠️ <i>Lỗi kết nối AI (${err.message}). Em hãy bấm hỏi lại nhé!</i></span>`;
    }
  } finally {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerText = "Gửi AI";
    }
  }
}
