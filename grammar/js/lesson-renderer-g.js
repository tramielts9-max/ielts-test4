import { ExerciseEngine } from './exercise-engine-g.js';

export class LessonRenderer {
  constructor(containerElement, data) {
    this.container = containerElement;
    this.data = data;
    this.totalQuestions = 0;
  }

  renderAll() {
    this.renderHero();
    this.renderTabs();
    this.renderTheory();
    this.renderExercises();
    this.renderBottomBar();
  }

  renderHero() {
    const hero = document.createElement('div');
    hero.className = 'hero-box-g';
    hero.innerHTML = `
      <h1>${this.data.title}</h1>
      <p>Hệ thống tự động học lý thuyết, làm bài tập và chấm điểm tức thì kèm giải thích.</p>
    `;
    this.container.appendChild(hero);
  }

  renderTabs() {
    const nav = document.createElement('div');
    nav.className = 'tab-nav-g';
    nav.innerHTML = `
      <button type="button" class="tab-btn-g active" id="btnTabTheory">📖 Lý Thuyết</button>
      <button type="button" class="tab-btn-g" id="btnTabExercise">✍️ Làm Bài Tập & Chấm Điểm</button>
    `;
    this.container.appendChild(nav);

    nav.querySelector('#btnTabTheory').onclick = () => this.switchTab('theory');
    nav.querySelector('#btnTabExercise').onclick = () => this.switchTab('exercise');
  }

  switchTab(tab) {
    const theoryBox = document.getElementById('tabTheoryContent');
    const exerciseBox = document.getElementById('tabExerciseContent');
    const btnT = document.getElementById('btnTabTheory');
    const btnE = document.getElementById('btnTabExercise');
    const bottomBar = document.getElementById('stickyBottomBar');

    if (tab === 'theory') {
      theoryBox.style.display = 'block';
      exerciseBox.style.display = 'none';
      btnT.classList.add('active');
      btnE.classList.remove('active');
      bottomBar.style.display = 'none';
    } else {
      theoryBox.style.display = 'none';
      exerciseBox.style.display = 'block';
      btnT.classList.remove('active');
      btnE.classList.add('active');
      bottomBar.style.display = 'flex';
    }
  }

  renderTheory() {
    const box = document.createElement('div');
    box.id = 'tabTheoryContent';

    let html = '';
    this.data.theory_sections.forEach(sec => {
      html += `
        <div class="theory-card-g">
          <h3>${sec.heading}</h3>
          ${sec.formula ? `<div class="formula-box-g">⚡ Công thức: ${sec.formula}</div>` : ''}
          <ul>
            ${sec.rules.map(r => `<li>${r}</li>`).join('')}
          </ul>
          ${sec.examples ? `
            <div style="margin-top:10px; font-size:13.5px; color:#475569;">
              <b>Ví dụ thực tế:</b>
              ${sec.examples.map(ex => `<div>• <i>${ex}</i></div>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    });
    box.innerHTML = html;
    this.container.appendChild(box);
  }

  renderExercises() {
    const box = document.createElement('div');
    box.id = 'tabExerciseContent';
    box.style.display = 'none';

    let html = '';
    this.totalQuestions = 0;

    this.data.exercise_sections.forEach((sec, sIdx) => {
      html += `
        <div class="section-card-g">
          <h3 class="section-title-g">${sec.section_title}</h3>
          <div class="section-instruction-g">${sec.instruction}</div>
      `;

      sec.questions.forEach((q, qIdx) => {
        this.totalQuestions++;
        let questionInputHtml = '';

        if (q.type === 'blank') {
          const parts = q.prompt.split('[blank]');
          questionInputHtml = `
            <span>${parts[0]}</span>
            <input type="text" class="input-blank-g" data-qid="${q.id}" autocomplete="off" placeholder="Nhập đáp án...">
            <span>${parts[1] || ''}</span>
          `;
        } else if (q.type === 'choice') {
          questionInputHtml = `
            <div style="width: 100%;">
              <div style="margin-bottom:8px;">${q.prompt}</div>
              ${q.options.map((opt, oIdx) => `
                <label class="choice-label-g">
                  <input type="radio" name="${q.id}" value="${oIdx}"> ${opt}
                </label>
              `).join('')}
            </div>
          `;
        } else if (q.type === 'rewrite') {
          questionInputHtml = `
            <div style="width: 100%;">
              <div style="margin-bottom: 6px; color:#64748b;">Câu gốc: <b>${q.prompt}</b></div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span>${q.targetStart || ''}</span>
                <input type="text" class="input-blank-g" style="flex:1;" data-qid="${q.id}" placeholder="...">
              </div>
            </div>
          `;
        }

        html += `
          <div class="q-row-g" id="row_${q.id}">
            <div class="q-text-g">
              <span style="color:var(--primary-color);">#${qIdx + 1}.</span>
              ${questionInputHtml}
            </div>
            <div class="feedback-box-g" id="fb_${q.id}"></div>
          </div>
        `;
      });

      html += `</div>`;
    });

    box.innerHTML = html;
    this.container.appendChild(box);
  }

  renderBottomBar() {
    const bar = document.createElement('div');
    bar.id = 'stickyBottomBar';
    bar.className = 'sticky-submit-bar';
    bar.style.display = 'none';
    bar.innerHTML = `
      <div>
        <b style="font-size:15px;" id="scoreSummaryLabel">Tổng số câu hỏi: ${this.totalQuestions} câu</b>
        <div style="font-size:12.5px; color:#64748b;">Sau khi nộp, hệ thống sẽ hiển thị đáp án và lời giải thích.</div>
      </div>
      <button type="button" class="btn-submit-g" id="btnGradeQuiz">Chấm Điểm & Xem Đáp Án</button>
    `;
    document.body.appendChild(bar);

    bar.querySelector('#btnGradeQuiz').onclick = () => this.gradeAll();
  }

  gradeAll() {
    let correctCount = 0;

    this.data.exercise_sections.forEach(sec => {
      sec.questions.forEach(q => {
        let userVal = '';
        if (q.type === 'blank' || q.type === 'rewrite') {
          const input = document.querySelector(`input[data-qid="${q.id}"]`);
          userVal = input ? input.value : '';
        } else if (q.type === 'choice') {
          const checked = document.querySelector(`input[name="${q.id}"]:checked`);
          userVal = checked ? checked.value : '-1';
        }

        const result = ExerciseEngine.gradeQuestion(q, userVal);
        const row = document.getElementById(`row_${q.id}`);
        const fb = document.getElementById(`fb_${q.id}`);

        fb.classList.add('show');
        if (result.isCorrect) {
          correctCount++;
          row.className = 'q-row-g is-correct';
          fb.className = 'feedback-box-g show correct';
          fb.innerHTML = `✅ <b>Chính xác!</b> ${q.explanation || ''}`;
        } else {
          row.className = 'q-row-g is-wrong';
          fb.className = 'feedback-box-g show wrong';
          fb.innerHTML = `❌ <b>Chưa chính xác!</b> Đáp án đúng là: <b>${result.correctDisplay}</b>. <br>💡 <i>${q.explanation || ''}</i>`;
        }
      });
    });

    const percent = Math.round((correctCount / this.totalQuestions) * 100);
    const scoreLabel = document.getElementById('scoreSummaryLabel');
    scoreLabel.innerHTML = `🎉 Điểm số của bạn: <span style="color:#0d9488; font-size:17px;">${correctCount} / ${this.totalQuestions} (${percent}%)</span>`;

    window.scrollTo({ top: document.getElementById('tabExerciseContent').offsetTop - 30, behavior: 'smooth' });
  }
}
