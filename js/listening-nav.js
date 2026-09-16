/**
 * js/listening-nav.js - Thanh điều hướng đáy, Modal Answer Sheet & Modal Bảng điểm chuẩn IELTS
 */

// Bảng quy đổi Band Score IELTS Listening chuẩn 40 câu
function calculateBandScore(score, total) {
  // Nếu là bài 1 Part (10 câu), quy đổi tỉ lệ tương đương 40 câu
  const scaledScore = total <= 10 ? Math.round((score / total) * 40) : score;

  if (scaledScore >= 39) return "9.0";
  if (scaledScore >= 37) return "8.5";
  if (scaledScore >= 35) return "8.0";
  if (scaledScore >= 32) return "7.5";
  if (scaledScore >= 30) return "7.0";
  if (scaledScore >= 26) return "6.5";
  if (scaledScore >= 23) return "6.0";
  if (scaledScore >= 18) return "5.5";
  if (scaledScore >= 16) return "5.0";
  if (scaledScore >= 13) return "4.5";
  if (scaledScore >= 10) return "4.0";
  if (scaledScore >= 8)  return "3.5";
  if (scaledScore >= 6)  return "3.0";
  if (scaledScore >= 4)  return "2.5";
  return "1.0";
}

export function initListeningNavigation() {
  if (document.getElementById('listeningBottomBar')) return;

  const testData = window.TEST_DATA || { answers: {} };
  const qKeys = Object.keys(testData.answers || {});
  if (qKeys.length === 0) return;

  // 1. Tạo thanh điều hướng cố định dưới đáy
  const bottomBar = document.createElement('div');
  bottomBar.id = 'listeningBottomBar';
  bottomBar.className = 'bottom-nav-bar';

  // Nhận diện Part hiện tại từ URL hoặc tên bài
  let currentPartNum = 1;
  const matchPart = window.location.href.match(/-p(\d+)/i);
  if (matchPart) currentPartNum = parseInt(matchPart[1], 10);

  // Dựng cụm nút Part 1 -> Part 4
  let partsHtml = '';
  for (let p = 1; p <= 4; p++) {
    if (p === currentPartNum) {
      // Part đang làm: Hiển thị các nút số câu [1] [2]...
      const buttonsHtml = qKeys.map(k => {
        const num = k.replace(/^[a-zA-Z]+/, '');
        return `<button type="button" class="q-badge-btn" id="badge_${k}" data-q="${k}">${num}</button>`;
      }).join(' ');

      partsHtml += `
        <div class="part-nav-group active-part">
          <b>Part ${p}:</b> ${buttonsHtml}
        </div>
      `;
    } else {
      // Các Part khác: Hiện nút tab chuyển bài nếu có
      const targetUrl = window.location.href.replace(new RegExp(`-p${currentPartNum}`, 'i'), `-p${p}`);
      partsHtml += `
        <div class="part-nav-group inactive-part" onclick="window.location.href='${targetUrl}'">
          <b>Part ${p}:</b> <i>10 questions</i>
        </div>
      `;
    }
  }

  bottomBar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <button type="button" class="btn-nav-arrow" id="btnPrevQ" title="Câu trước">←</button>
      <button type="button" class="btn-nav-arrow" id="btnNextQ" title="Câu sau">→</button>
    </div>

    <div class="parts-container">
      ${partsHtml}
    </div>

    <div style="display: flex; align-items: center; gap: 10px;">
      <button type="button" class="btn-sheet-toggle" id="btnOpenSheet" title="Xem bảng đáp án">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zm4-10h14v2H8V6zm0 5h14v2H8v-2zm0 5h14v2H8v-2z"/>
        </svg>
      </button>
      <button type="button" class="btn-submit-bar" id="btnBottomSubmit">
        Submit ✈
      </button>
    </div>
  `;

  document.body.appendChild(bottomBar);

  // 2. Dựng 2 Modal: (1) Answer Sheet khi đang làm & (2) Score Popup sau khi nộp
  const modalWrapper = document.createElement('div');
  modalWrapper.id = 'lisModalBackdrop';
  modalWrapper.className = 'modal-backdrop';
  modalWrapper.innerHTML = `
    <div class="modal-content-card">
      <button type="button" class="modal-close-btn" id="btnCloseModal">✕</button>
      <div id="modalDynamicBody"></div>
    </div>
  `;
  document.body.appendChild(modalWrapper);

  // 3. Sự kiện bấm số câu -> Cuộn mượt đến câu đó
  let activeQIndex = 0;
  function scrollToQuestion(index) {
    if (index < 0 || index >= qKeys.length) return;
    activeQIndex = index;
    const targetId = qKeys[index];
    const el = document.getElementById(targetId) || document.getElementById(`${targetId}_input`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const inputEl = document.getElementById(`${targetId}_input`);
      if (inputEl) setTimeout(() => inputEl.focus(), 300);
    }
  }

  qKeys.forEach((k, idx) => {
    document.getElementById(`badge_${k}`)?.addEventListener('click', () => scrollToQuestion(idx));
  });

  document.getElementById('btnPrevQ')?.addEventListener('click', () => scrollToQuestion(activeQIndex - 1));
  document.getElementById('btnNextQ')?.addEventListener('click', () => scrollToQuestion(activeQIndex + 1));

  // 4. Mở Bảng Answer Sheet (Xem các câu đã làm)
  document.getElementById('btnOpenSheet')?.addEventListener('click', () => {
    openAnswerSheetModal(qKeys);
  });

  // Đóng modal
  document.getElementById('btnCloseModal')?.addEventListener('click', () => {
    modalWrapper.style.display = 'none';
  });
  modalWrapper.addEventListener('click', (e) => {
    if (e.target === modalWrapper) modalWrapper.style.display = 'none';
  });

  // 5. Nút Submit dưới đáy
  document.getElementById('btnBottomSubmit')?.addEventListener('click', () => {
    const btn = document.getElementById('btnBottomSubmit');
    if (btn.classList.contains('is-retake')) {
      if (confirm("Em có chắc chắn muốn làm lại bài thi từ đầu?")) {
        localStorage.removeItem(window.stateManager?.testKey || '');
        window.location.reload();
      }
      return;
    }
    if (window.checkAnswers) window.checkAnswers();
  });

  // 6. Lắng nghe sau khi chấm bài để bật Modal Kết Quả & Đổi màu nút
  listenForSubmission(qKeys, testData);
}

// Bảng Answer Sheet (Đang làm bài)
function openAnswerSheetModal(qKeys) {
  const modal = document.getElementById('lisModalBackdrop');
  const body = document.getElementById('modalDynamicBody');
  if (!modal || !body) return;

  let rowsHtml = '';
  qKeys.forEach(k => {
    const num = k.replace(/^[a-zA-Z]+/, '');
    const textInput = document.getElementById(`${k}_input`);
    const radio = document.querySelector(`input[name="${k}"]:checked`);
    const val = textInput ? textInput.value.trim() : (radio ? radio.value : '');

    rowsHtml += `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 14px; font-weight: 700; width: 60px; text-align: center;">${num}</td>
        <td style="padding: 10px 14px; color: ${val ? '#0f172a' : '#94a3b8'}; font-weight: 600;">
          ${val || '<i style="color:#cbd5e1; font-weight: normal;">(Chưa trả lời)</i>'}
        </td>
      </tr>
    `;
  });

  body.innerHTML = `
    <h3 style="margin: 0 0 14px 0; font-size: 16px; color: #0f172a;">📋 Review Answer Sheet</h3>
    <div style="max-height: 55vh; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0;">
            <th style="padding: 10px; width: 60px;">#</th>
            <th style="padding: 10px; text-align: left;">Your Answer</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
  modal.style.display = 'flex';
}

// Bảng Kết Quả (Sau khi nộp bài)
function listenForSubmission(qKeys, testData) {
  const originalCheckAnswers = window.checkAnswers;
  window.checkAnswers = async function() {
    if (originalCheckAnswers) await originalCheckAnswers();

    // 1. Đổi nút Submit -> Retake Test
    const submitBtn = document.getElementById('btnBottomSubmit');
    if (submitBtn) {
      submitBtn.innerText = "Retake Test";
      submitBtn.classList.add('is-retake');
      submitBtn.style.background = "#16a34a";
    }

    // 2. Thu thập điểm & Dựng bảng đối chiếu 3 cột
    let correctCount = 0;
    let tableRows = '';

    qKeys.forEach(k => {
      const num = k.replace(/^[a-zA-Z]+/, '');
      const expected = testData.answers[k];
      const textInput = document.getElementById(`${k}_input`);
      const radio = document.querySelector(`input[name="${k}"]:checked`);
      const userVal = textInput ? textInput.value.trim() : (radio ? radio.value : '');

      let isCorrect = false;
      if (radio) {
        isCorrect = (userVal.toUpperCase() === String(expected).trim().toUpperCase());
      } else {
        const cleanVal = userVal.toLowerCase().replace(/\s+/g, ' ');
        if (Array.isArray(expected)) {
          isCorrect = expected.map(a => a.toLowerCase().trim()).includes(cleanVal);
        } else {
          isCorrect = (cleanVal === String(expected).toLowerCase().trim());
        }
      }

      if (isCorrect) correctCount++;

      // Đổi màu nút tròn dưới đáy
      const badge = document.getElementById(`badge_${k}`);
      if (badge) {
        badge.classList.toggle('status-correct', isCorrect);
        badge.classList.toggle('status-incorrect', !isCorrect);
      }

      const expStr = Array.isArray(expected) ? expected.join(' / ') : expected;
      const rowBg = isCorrect ? '#f0fdf4' : '#fef2f2';

      tableRows += `
        <tr style="background: ${rowBg}; border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px; text-align: center; font-weight: 700; width: 50px;">${num}</td>
          <td style="padding: 10px; font-weight: 600; color: ${isCorrect ? '#166534' : '#991b1b'};">${userVal || '—'}</td>
          <td style="padding: 10px; font-weight: 700; color: #166534;">${expStr}</td>
        </tr>
      `;
    });

    const total = qKeys.length;
    const band = calculateBandScore(correctCount, total);
    const timeSpent = document.getElementById('timerDisplay')?.innerText || '00:00';

    // 3. Hiện Modal Điểm & Đối chiếu
    const modal = document.getElementById('lisModalBackdrop');
    const body = document.getElementById('modalDynamicBody');
    if (modal && body) {
      body.innerHTML = `
        <div style="text-align: center; margin-bottom: 18px;">
          <h2 style="color: #991b1b; font-size: 26px; margin: 0 0 6px 0; border: none; padding: 0;">Band Score: ${band}</h2>
          <div style="font-size: 19px; font-weight: 800; color: #1e293b;">${correctCount}/${total}</div>
          <div style="font-size: 13.5px; color: #64748b; margin-top: 4px;">⏱️ Thời gian: <b>${timeSpent}</b></div>
        </div>

        <div style="max-height: 52vh; overflow-y: auto; border: 1.5px solid #e2e8f0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0;">
                <th style="padding: 10px; text-align: center;">#</th>
                <th style="padding: 10px; text-align: left;">Your Answer</th>
                <th style="padding: 10px; text-align: left;">Correct Answer</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      `;
      modal.style.display = 'flex';
    }
  };
}
