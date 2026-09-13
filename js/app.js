/**
 * js/app.js - Điểm khởi động tập trung cho mọi bài Test
 */
import { CONFIG } from './config.js';
import { stateManager } from './state.js';
import { TestTimer } from './timer.js';
import { initHighlighting } from './highlight.js';
import { initResizer } from './resizer.js';
import { initAudioTranscriptSync } from './audio-sync.js';
import { askGemini } from './ai-assistant.js';
import { TestEvaluator } from './evaluator.js';

// 1. Font Size & Theme
let currentFontSize = parseInt(localStorage.getItem('ielts_font_size')) || 15;
applyFontSize(currentFontSize);

function applyFontSize(size) {
  document.documentElement.style.setProperty('--font-size-base', `${size}px`);
  document.querySelectorAll('.passage-box, .question-box').forEach(el => {
    el.style.fontSize = `${size}px`;
  });
}

window.changeFontSize = (delta) => {
  currentFontSize = Math.min(Math.max(currentFontSize + delta, 12), 24);
  applyFontSize(currentFontSize);
  localStorage.setItem('ielts_font_size', currentFontSize);
};

window.toggleTheme = () => {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('ielts_theme', isDark ? 'dark' : 'light');
  const btn = document.getElementById('btnThemeToggle');
  if (btn) btn.innerText = isDark ? '☀️ Sáng' : '🌙 Tối';
};

window.askGeminiAI = (qId) => askGemini(qId);
window.highlightText = (id) => {
  document.querySelectorAll('.hl-active').forEach(el => el.classList.remove('hl-active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('hl-active');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

async function initApp() {
  const isListening = !!document.querySelector('audio') || window.location.pathname.includes('lis') || window.location.search.includes('lis');

  const timer = new TestTimer('timerDisplay', (sec) => {
    if (sec % 5 === 0) collectAndSaveState();
  });
  window.startTimer = () => timer.start();
  window.pauseTimer = () => timer.pause();

  initHighlighting();
  initResizer();
  if (isListening) initAudioTranscriptSync();

  const user = stateManager.getUser();
  const nameInput = document.getElementById('studentNameInput');
  const emailInput = document.getElementById('studentEmailInput');
  if (nameInput && user.name) nameInput.value = user.name;
  if (emailInput && user.email) emailInput.value = user.email;

  const evaluator = new TestEvaluator(window.TEST_DATA);

  window.checkAnswers = async () => {
    const studentName = nameInput ? nameInput.value.trim() : "";
    const studentEmail = emailInput ? emailInput.value.trim().toLowerCase() : "";

    if (!studentName || !studentEmail) {
      alert("⚠️ Vui lòng điền Họ tên và Email trước khi nộp bài!");
      return;
    }

    stateManager.saveUser(studentName, studentEmail);
    timer.stop();

    const evaluation = evaluator.evaluate();
    const scoreStr = `${evaluation.score}/${evaluation.total}`;
    
    const scoreBadge = document.getElementById('scoreBadge');
    const scoreText = document.getElementById('scoreText');
    if (scoreBadge) scoreBadge.style.display = 'block';
    if (scoreText) scoreText.innerText = scoreStr;

    document.body.classList.add('submitted-mode');
    document.getElementById('passageBox')?.classList.add('submitted');

    collectAndSaveState(true, scoreStr);
    await evaluator.submitToCloud(evaluation, studentName, studentEmail, timer.formatTime(timer.seconds));
    alert(`🎉 Hoàn thành! Điểm của em: ${scoreStr}. Bài làm đã được lưu an toàn lên Google Drive.`);
  };

  function collectAndSaveState(isSubmitted = false, scoreStr = '') {
    if (stateManager.isReviewMode) return;
    const state = {
      seconds: timer.seconds,
      isSubmitted: isSubmitted || document.body.classList.contains('submitted-mode'),
      scoreText: scoreStr || document.getElementById('scoreText')?.innerText || '',
      inputs: {},
      radios: {},
      thoughts: {},
      aiResponses: {}
    };
    document.querySelectorAll('input.fill-input').forEach(i => state.inputs[i.id] = i.value);
    document.querySelectorAll('input[type="radio"]:checked').forEach(r => state.radios[r.name] = r.value);
    document.querySelectorAll('.thought-box textarea').forEach(t => state.thoughts[t.id] = t.value);
    document.querySelectorAll('.ai-response').forEach(a => {
      if (a.innerHTML.trim() !== '') state.aiResponses[a.id] = a.innerHTML;
    });
    stateManager.saveTestProgress(state);
  }

  // Lắng nghe nhập liệu để tự động lưu tạm chống mất bài
  document.addEventListener('input', () => collectAndSaveState());
  document.addEventListener('change', () => collectAndSaveState());

  // ==========================================================================
  // KIỂM TRA CHẾ ĐỘ XEM LẠI BÀI TỪ GOOGLE DRIVE (REVIEW MODE)
  // ==========================================================================
  const urlParams = new URLSearchParams(window.location.search);
  const attemptId = urlParams.get('attemptId');
  const emailParam = urlParams.get('email');

  if (attemptId && emailParam && CONFIG.DRIVE_STORAGE_URL) {
    try {
      const res = await fetch(CONFIG.DRIVE_STORAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "get_single_attempt", email: emailParam, attemptId: attemptId })
      });
      const data = await res.json();
      if (data?.attempt) {
        restoreReviewMode(data.attempt, timer, evaluator);
        return; // Đã vào Review Mode thì không khôi phục LocalStorage nữa
      }
    } catch (e) {
      console.warn("Không thể tải bài làm từ Cloud:", e);
    }
  }

  // Khôi phục bài đang làm dở từ LocalStorage
  const saved = stateManager.getSavedProgress();
  if (saved) {
    if (saved.seconds) timer.setTime(saved.seconds);
    if (saved.inputs) Object.entries(saved.inputs).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
    if (saved.radios) Object.entries(saved.radios).forEach(([name, val]) => { const el = document.querySelector(`input[name="${name}"][value="${val}"]`); if (el) el.checked = true; });
    if (saved.thoughts) Object.entries(saved.thoughts).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
    if (saved.aiResponses) Object.entries(saved.aiResponses).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) { el.style.display = 'block'; el.innerHTML = val; }
    });

    if (saved.isSubmitted) {
      evaluator.evaluate();
      document.body.classList.add('submitted-mode');
      document.getElementById('passageBox')?.classList.add('submitted');
      const scoreBadge = document.getElementById('scoreBadge');
      const scoreText = document.getElementById('scoreText');
      if (scoreBadge) scoreBadge.style.display = 'block';
      if (scoreText) scoreText.innerText = saved.scoreText;
      evaluator.renderPostSubmissionControls();
    }
  }
}

function restoreReviewMode(attempt, timer, evaluator) {
  stateManager.isReviewMode = true;
  timer.stop();

  // 1. Thêm banner xem lại bài
  const banner = document.createElement('div');
  banner.style.cssText = "background: #fef3c7; color: #92400e; border: 1.5px solid #f59e0b; padding: 10px 16px; font-weight: 700; font-size: 14px; text-align: center; border-radius: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;";
  banner.innerHTML = `
    <span>📜 ĐANG XEM LẠI BÀI (${attempt.timestamp}) — Điểm số: <b>${attempt.score}</b> (Học viên: ${attempt.studentName})</span>
    <div style="display:flex; gap:8px;">
      <button type="button" id="btnExitReview" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">🔄 Làm lại bài này</button>
      <a href="index.html" style="background: #b45309; color: white; padding: 6px 12px; text-decoration: none; border-radius: 6px; font-weight: bold;">🔙 Về Trang chủ</a>
    </div>
  `;
  document.body.insertBefore(banner, document.body.firstChild);

  document.getElementById('btnExitReview')?.addEventListener('click', () => {
    stateManager.clearProgress();
    const cleanUrl = window.location.pathname + `?test=` + (new URLSearchParams(window.location.search).get('test') || '');
    window.location.href = cleanUrl;
  });

  // 2. Điền lại toàn bộ dữ liệu & VÔ HIỆU HÓA chỉnh sửa
  if (attempt.inputs) {
    Object.entries(attempt.inputs).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) { el.value = val; el.disabled = true; }
    });
  }
  if (attempt.radios) {
    Object.entries(attempt.radios).forEach(([name, val]) => {
      const el = document.querySelector(`input[name="${name}"][value="${val}"]`);
      if (el) el.checked = true;
    });
    document.querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true);
  }
  if (attempt.thoughts) {
    Object.entries(attempt.thoughts).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) { el.value = val; el.disabled = true; }
    });
  }
  if (attempt.aiResponses) {
    Object.entries(attempt.aiResponses).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) { el.style.display = 'block'; el.innerHTML = val; }
    });
  }

  // 3. Hiển thị đáp án đúng/sai và lời giải
  evaluator.evaluate();
  document.body.classList.add('submitted-mode');
  document.getElementById('passageBox')?.classList.add('submitted');

  const scoreBadge = document.getElementById('scoreBadge');
  const scoreText = document.getElementById('scoreText');
  if (scoreBadge) scoreBadge.style.display = 'block';
  if (scoreText) scoreText.innerText = attempt.score;

  // Ẩn nút nộp bài
  document.querySelector('.btn-submit')?.remove();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ==========================================================================
// HỆ THỐNG XỬ LÝ KỊCH BẢN MỚM DẪN DẮT SOCRATIC 4 NẤC (INTERACTIVE LADDER)
// ==========================================================================
window.checkSocratic = function(qId, stepIdx, acceptedArr, wrongArr, correctMsg, wrongMsg, fallbackMsg, finalAnswer) {
  const inputEl = document.getElementById(`${qId}_soc_in_${stepIdx}`);
  const fbEl = document.getElementById(`${qId}_soc_fb_${stepIdx}`);
  const nextStepEl = document.getElementById(`${qId}_soc_step_${stepIdx + 1}`);
  const badgeEl = document.getElementById(`socratic_badge_${qId}`);
  if (!inputEl || !fbEl) return;

  const userVal = inputEl.value.trim().toLowerCase();
  if (!userVal) {
    alert("Em hãy gõ câu trả lời vào ô trước khi bấm Gửi nhé!");
    return;
  }

  fbEl.style.display = "block";
  let isCorrect = acceptedArr.some(k => userVal.includes(k.toLowerCase()));
  let isWrongTrap = wrongArr.some(w => userVal.includes(w.toLowerCase()));

  if (isCorrect) {
    fbEl.style.color = "#15803d";
    fbEl.style.background = "#dcfce7";
    fbEl.style.border = "1px solid #86efac";
    fbEl.style.padding = "8px 12px";
    fbEl.style.borderRadius = "6px";
    fbEl.innerHTML = correctMsg;

    inputEl.disabled = true;
    const btn = inputEl.nextElementSibling;
    if (btn) btn.disabled = true;

    if (nextStepEl) {
      nextStepEl.style.display = "block";
      if (badgeEl) badgeEl.innerText = `Nấc ${stepIdx + 1}/4`;
      const nextInput = document.getElementById(`${qId}_soc_in_${stepIdx + 1}`);
      if (nextInput) setTimeout(() => nextInput.focus(), 200);
    } else {
      if (badgeEl) {
        badgeEl.innerText = `✓ Đã hoàn thành 4/4 nấc!`;
        badgeEl.style.background = "#22c55e";
        badgeEl.style.color = "white";
      }
      // Tự động điền đáp án chuẩn vào ô bài thi chính
      const mainInput = document.getElementById(`${qId}_input`);
      if (mainInput && finalAnswer) {
        mainInput.value = finalAnswer;
        mainInput.dispatchEvent(new Event('input'));
      }
    }
  } else if (isWrongTrap) {
    fbEl.style.color = "#b91c1c";
    fbEl.style.background = "#fee2e2";
    fbEl.style.border = "1px solid #fca5a5";
    fbEl.style.padding = "8px 12px";
    fbEl.style.borderRadius = "6px";
    fbEl.innerHTML = wrongMsg;
  } else {
    fbEl.style.color = "#c2410c";
    fbEl.style.background = "#ffedd5";
    fbEl.style.border = "1px solid #fdba74";
    fbEl.style.padding = "8px 12px";
    fbEl.style.borderRadius = "6px";
    fbEl.innerHTML = fallbackMsg;
  }
};
