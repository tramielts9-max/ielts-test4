// js/reading-builder.js
window.buildReadingHtml = function(data) {
  let html = '';

  // 1. Dựng từng nhóm câu hỏi (Groups)
  (data.groups || []).forEach(group => {
    html += `<div class="section-title">${group.title}</div>`;
    if (group.instructions) {
      html += `<p>${group.instructions}</p>`;
    }

    // Dạng 1: TRUE / FALSE / NOT GIVEN hoặc Trắc nghiệm
    if (group.type === 'tfng' || group.type === 'choice') {
      group.questionIds.forEach(qId => {
        const q = data.questions[qId];
        if (!q) return;

        html += `
        <div class="question" id="${qId}">
          <!-- SOCRATIC LADDER -->
          ${buildSocraticBox(qId, q.socratic, q.finalAnswer)}

          <p><b>${q.num}.</b> ${q.text}</p>

          <div class="options">
            ${(q.options || ['TRUE', 'FALSE', 'NOT GIVEN']).map(opt => `
              <label><input type="radio" name="${qId}" value="${opt}"> ${opt}</label>
            `).join('')}
          </div>

          <div class="thought-box">
            <label>💭 Mạch suy nghĩ của em (Câu ${q.num}):</label>
            <textarea id="${qId}_thought"></textarea>
          </div>

          <div class="result"></div>

          <!-- EXPLANATION & AI -->
          ${buildExplanationBox(qId, q)}
        </div>`;
      });
    }

    // Dạng 2: Điền từ vào bài tóm tắt (Notes/Summary Completion)
    if (group.type === 'notes') {
      html += `<div style="background: var(--bg-card, #fff); border: 2px solid var(--border-color, #e2e8f0); border-radius: 8px; padding: 18px; margin-bottom: 20px;">`;
      if (group.noteTitle) html += `<h3 style="margin-top: 0; text-align: center; color: var(--primary-blue, #0369a1);">${group.noteTitle}</h3>`;
      
      // Xử lý nội dung điền từ
      let content = group.template;
      group.questionIds.forEach(qId => {
        const q = data.questions[qId];
        const inputSlot = `
        <div class="question" id="${qId}" style="display: inline-block; background: transparent; padding: 0; border: none;">
          <input type="text" id="${qId}_input" class="fill-input" style="width: ${q.inputWidth || '110px'};">
          <div class="thought-box"><label>💭 Mạch suy nghĩ của em:</label><textarea id="${qId}_thought"></textarea></div>
          <div class="result"></div>
          ${buildExplanationBox(qId, q)}
        </div>`;
        content = content.replace(`{{${qId}}}`, inputSlot);
      });

      html += content + `</div>`;
    }
  });

  html += `<button class="btn-submit" onclick="checkAnswers()">CHẤM BÀI VÀ NỘP KẾT QUẢ</button>`;
  return html;
};

function buildSocraticBox(qId, socratic, finalAnswer) {
  if (!socratic || !socratic.steps) return '';
  return `
  <div style="background: var(--bg-subcard); border: 1.5px solid var(--border-color); border-radius: 8px; padding: 14px; margin-bottom: 14px; font-size: 1em;">
    <div style="font-weight: 700; color: var(--primary-blue); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span>🪜 <b>GỢI Ý MỚM DẪN DẮT (SOCRATIC)</b></span>
      <span id="${qId}_badge" style="font-size: 0.85em; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px;">Nấc 1/${socratic.steps.length}</span>
    </div>
    ${socratic.steps.map((step, idx) => {
      const stepNum = idx + 1;
      const isFirst = stepNum === 1;
      return `
      <div id="${qId}_step_${stepNum}" style="${isFirst ? '' : 'display: none; margin-top: 12px; border-top: 1px dashed var(--border-color); padding-top: 10px;'}">
        <div style="margin-bottom: 6px;"><b>🤖 Máy hỏi (${stepNum}/${socratic.steps.length} - ${step.title}):</b> ${step.question}</div>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="${qId}_in_${stepNum}" placeholder="Gõ câu trả lời của em..." style="flex:1; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 1em;" onkeydown="if(event.key==='Enter') document.getElementById('${qId}_btn_${stepNum}').click()">
          <button type="button" id="${qId}_btn_${stepNum}" onclick="nextSocraticStep('${qId}', ${stepNum}, '${finalAnswer}')" style="background: var(--primary-blue); color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 1em;">Gửi</button>
        </div>
        <div id="${qId}_ans_${stepNum}" style="display: none; background: #f0fdf4; border-left: 4px solid #16a34a; padding: 10px 14px; border-radius: 6px; margin-top: 8px; line-height: 1.6;">
          <div style="color: #166534; font-weight: 700;">🎯 LỜI GIẢI HƯỚNG DẪN:</div>
          <div>${step.guide}</div>
          <div style="margin-top: 6px; font-style: italic; color: #475569;">🌉 <i>${step.bridge}</i></div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function buildExplanationBox(qId, q) {
  if (!q.explanation) return '';
  return `
  <div class="explanation">
    <h4 style="color: #0369a1; margin-bottom: 8px;">📝 LỜI GIẢI CHI TIẾT 4 BƯỚC:</h4>
    <div class="exp-step">• <b>Đáp án chốt:</b> <span class="kw-exp">${q.finalAnswer}</span></div>
    ${(q.explanation.steps || []).map(s => `<div class="exp-step">• ${s}</div>`).join('')}
    ${q.highlightId ? `<button class="btn-locate" onclick="highlightText('${q.highlightId}')">📍 Định vị vị trí bài đọc</button>` : ''}
    <div class="ai-assistant-box">
      <label>🤖 Hỏi Trợ giảng AI về câu này:</label>
      <div class="ai-input-group">
        <input type="text" id="ai_ask_${qId}">
        <button class="ai-btn" onclick="askGeminiAI('${qId}')">Gửi AI</button>
      </div>
      <div class="ai-response" id="ai_response_${qId}"></div>
    </div>
  </div>`;
}
