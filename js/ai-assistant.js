/**
 * js/ai-assistant.js - Kết nối và hỏi đáp Gemini AI
 */
import { CONFIG } from './config.js';
import { stateManager } from './state.js';

export async function askGemini(qId, promptText) {
  if (stateManager.isReviewMode) {
    alert("Em đang ở chế độ xem lại bài đã nộp.");
    return;
  }

  const inputEl = document.getElementById(`ai_ask_${qId}`);
  const responseBox = document.getElementById(`ai_response_${qId}`);
  if (!inputEl || !responseBox) return;

  const userQuestion = promptText || inputEl.value.trim();
  if (!userQuestion) {
    alert("Vui lòng gõ thắc mắc của em trước khi gửi nhé!");
    return;
  }

  responseBox.style.display = "block";
  const tempId = "temp_" + Date.now();
  const safeText = userQuestion.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const tempDiv = document.createElement('div');
  tempDiv.id = tempId;
  tempDiv.style.cssText = "border-top: 1px dashed var(--border-color); padding-top: 8px; margin-top: 8px;";
  tempDiv.innerHTML = `
    <div style="font-weight: 700; color: var(--primary-blue); font-size: 13.5px;">💬 "${safeText}"</div>
    <i style="color: var(--text-muted); font-size: 13px;">⏳ AI đang phân tích và chuẩn bị câu trả lời...</i>
  `;
  responseBox.appendChild(tempDiv);
  inputEl.value = "";

  const qDiv = document.getElementById(qId);
  let qContext = "";
  if (qDiv) {
    const clone = qDiv.cloneNode(true);
    clone.querySelectorAll('.explanation, .thought-box, .ai-assistant-box, .result').forEach(el => el.remove());
    qContext = clone.innerText.trim();
  }

  const prompt = `Bạn là giáo viên IELTS Master. Giải thích chi tiết, trực quan thắc mắc sau bằng tiếng Việt.
Dùng **từ khóa** để IN ĐẬM, ==bằng chứng== để TÔ VÀNG, [kw]từ khóa[/kw] để TÔ XANH.
[CÂU HỎI]: ${qContext}
[HỌC VIÊN HỎI]: ${userQuestion}`;

  try {
    const res = await fetch(CONFIG.AI_AND_SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "ask_ai", prompt })
    });
    const data = await res.json();
    const targetEl = document.getElementById(tempId);
    if (data?.reply && targetEl) {
      const formatted = data.reply
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/==(.*?)==/g, "<mark style='background:#fef08a; padding:1px 4px;'>$1</mark>")
        .replace(/\[kw\](.*?)\[\/kw\]/g, "<span class='kw'>$1</span>");

      targetEl.innerHTML = `
        <div style="font-weight: 700; color: var(--primary-blue); font-size: 13.5px;">💬 "${safeText}"</div>
        <div style="line-height: 1.65; margin-top: 4px;"><b>🤖 Trợ giảng AI:</b><br>${formatted}</div>
      `;

      // Kích hoạt event input để tự động lưu box chat này vào state LocalStorage
      document.dispatchEvent(new Event('input'));
    }
  } catch {
    const targetEl = document.getElementById(tempId);
    if (targetEl) targetEl.innerHTML = `⚠️ <i>Lỗi kết nối. Vui lòng bấm hỏi lại!</i>`;
  }
}
