import { ExerciseEngine } from './exercise-engine-g.js';

export class LessonRenderer {
  constructor(containerElement, theoryData, exerciseData) {
    this.container = containerElement;
    this.theoryData = theoryData;
    this.exerciseData = exerciseData;
    this.totalQuestions = 0;
    this.totalRecallQuestions = 0;
  }

  renderAll() {
    this.renderHero();
    this.renderTabs();
    this.renderTheory();
    this.renderTheoryRecall(); // TAB Ở GIỮA
    this.renderExercises();
    this.renderBottomBar();
  }

  renderHero() {
    const hero = document.createElement('div');
    hero.className = 'hero-box-g';
    hero.innerHTML = `
      <h1>${this.theoryData.tense_name}</h1>
      <p>Học lý thuyết ➔ Khảo thuộc lòng công thức ➔ Làm bài tập áp dụng thực tế</p>
    `;
    this.container.appendChild(hero);
  }

  renderTabs() {
    const nav = document.createElement('div');
    nav.className = 'tab-nav-g';
    nav.innerHTML = `
      <button type="button" class="tab-btn-g active" id="btnTabTheory">📖 1. Lý Thuyết</button>
      <button type="button" class="tab-btn-g" id="btnTabRecall" style="background:#fffbeb; border-color:#fef08a; color:#854d0e;">📝 2. Khảo Lý Thuyết</button>
      <button type="button" class="tab-btn-g" id="btnTabExercise">✍️ 3. Bài Tập Áp Dụng</button>
    `;
    this.container.appendChild(nav);

    nav.querySelector('#btnTabTheory').onclick = () => this.switchTab('theory');
    nav.querySelector('#btnTabRecall').onclick = () => this.switchTab('recall');
    nav.querySelector('#btnTabExercise').onclick = () => this.switchTab('exercise');
  }

  switchTab(tab) {
    const theoryBox = document.getElementById('tabTheoryContent');
    const recallBox = document.getElementById('tabRecallContent');
    const exerciseBox = document.getElementById('tabExerciseContent');
    const btnT = document.getElementById('btnTabTheory');
    const btnR = document.getElementById('btnTabRecall');
    const btnE = document.getElementById('btnTabExercise');
    const bottomBar = document.getElementById('stickyBottomBar');

    // Ẩn tất cả
    theoryBox.style.display = 'none';
    if (recallBox) recallBox.style.display = 'none';
    exerciseBox.style.display = 'none';
    btnT.classList.remove('active');
    btnR.classList.remove('active');
    btnE.classList.remove('active');
    if (bottomBar) bottomBar.style.display = 'none';

    // Hiện tab được chọn
    if (tab === 'theory') {
      theoryBox.style.display = 'block';
      btnT.classList.add('active');
    } else if (tab === 'recall') {
      if (recallBox) recallBox.style.display = 'block';
      btnR.classList.add('active');
    } else {
      exerciseBox.style.display = 'block';
      btnE.classList.add('active');
      if (bottomBar) bottomBar.style.display = 'flex';
    }
  }

  renderTheory() {
    const box = document.createElement('div');
    box.id = 'tabTheoryContent';

    let html = '';

    if (this.theoryData.word_symbols && this.theoryData.word_symbols.length > 0) {
      html += `
        <div class="theory-card-g">
          <h3>📌 KÝ HIỆU CÁC LOẠI TỪ CƠ BẢN</h3>
          <table style="width:100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background:#f1f5f9; text-align:left;">
                <th style="padding:8px; border:1px solid #e2e8f0;">Ký hiệu</th>
                <th style="padding:8px; border:1px solid #e2e8f0;">Loại từ</th>
                <th style="padding:8px; border:1px solid #e2e8f0;">Định nghĩa</th>
                <th style="padding:8px; border:1px solid #e2e8f0;">Ví dụ</th>
              </tr>
            </thead>
            <tbody>
              ${this.theoryData.word_symbols.map(s => `
                <tr>
                  <td style="padding:8px; border:1px solid #e2e8f0;"><b>${s.symbol}</b></td>
                  <td style="padding:8px; border:1px solid #e2e8f0;">${s.meaning}</td>
                  <td style="padding:8px; border:1px solid #e2e8f0;">${s.definition}</td>
                  <td style="padding:8px; border:1px solid #e2e8f0; color:#0f766e;"><i>${s.example}</i></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    this.theoryData.sections.forEach(sec => {
      html += `
        <div class="theory-card-g">
          <h3>${sec.title}</h3>
          
          ${sec.formulas ? `
            <div class="formula-box-g">
              <div><b>Khẳng định:</b> ${sec.formulas.affirmative}</div>
              <div><b>Phủ định:</b> ${sec.formulas.negative}</div>
              <div><b>Nghi vấn:</b> ${sec.formulas.interrogative}</div>
            </div>
          ` : ''}

          ${sec.rules ? `
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; margin: 12px 0;">
              ${sec.rules.map(r => `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:8px 12px; border-radius:6px; font-size:13.5px;">
                  ${r}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${sec.subject_rules ? `
            <ul>
              ${sec.subject_rules.map(r => `<li>${r}</li>`).join('')}
            </ul>
          ` : ''}

          ${sec.spelling_rules ? `
            <h4 style="margin: 12px 0 6px 0; color:#0f766e;">Quy tắc chính tả:</h4>
            <ul>
              ${sec.spelling_rules.map(sp => `
                <li><b>${sp.condition}:</b> ${sp.rule} ➔ <i>(${sp.examples})</i></li>
              `).join('')}
            </ul>
          ` : ''}

          ${sec.usages ? `
            <ul>
              ${sec.usages.map(u => `<li><b>${u.name}:</b> ${u.desc} ➔ <i>(${u.example})</i></li>`).join('')}
            </ul>
          ` : ''}

          ${sec.markers ? `
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:10px; margin-top:10px;">
              ${sec.markers.map(m => `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:8px 12px; border-radius:6px; font-size:13px;">
                  <b>${m.word}</b>: ${m.vn} <span style="color:#0d9488; font-weight:bold;">(${m.percent})</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${sec.note ? `<p style="font-size:13.5px; color:#64748b; font-style:italic; margin-top:10px;">💡 ${sec.note}</p>` : ''}
        </div>
      `;
    });

    box.innerHTML = html;
    this.container.appendChild(box);
  }

  // =========================================================================
  // HÀM HIỂN THỊ PHẦN KHẢO LÝ THUYẾT (TAB Ở GIỮA)
  // =========================================================================
  renderTheoryRecall() {
    const box = document.createElement('div');
    box.id = 'tabRecallContent';
    box.style.display = 'none';

    if (!this.theoryData.theory_recall || this.theoryData.theory_recall.length === 0) {
      box.innerHTML = `<div class="theory-card-g"><p>Chuyên đề này hiện chưa có bài khảo lý thuyết.</p></div>`;
      this.container.appendChild(box);
      return;
    }

    let html = `
      <div class="theory-card-g" style="background:#fefce8; border-color:#fef08a;">
        <h3 style="color:#854d0e; border-bottom-color:#fde047;">🎯 BÀI KHẢO LÝ THUYẾT (ĐIỀN TỪ VÀO CHỖ TRỐNG ĐỂ THUỘC BÀI)</h3>
        <p style="font-size:14px; color:#713f12; margin:0 0 15px 0;">Hãy điền đúng công thức, quy tắc và dấu hiệu đã học để kiểm tra xem bạn đã thực sự ghi nhớ bài chưa nhé!</p>
      </div>
    `;

    this.totalRecallQuestions = this.theoryData.theory_recall.length;

    this.theoryData.theory_recall.forEach((item, idx) => {
      const parts = item.prompt.split('[blank]');
      html += `
        <div class="q-row-g" id="recall_row_${item.id}" style="background:#ffffff;">
          <div class="q-text-g">
            <span style="color:#b45309; font-weight:bold;">Câu ${idx + 1}:</span>
            <span>${parts[0]}</span>
            <input type="text" class="input-blank-g" data-recall-id="${item.id}" autocomplete="off" placeholder="Điền lý thuyết...">
            <span>${parts[1] || ''}</span>
          </div>
          <div class="feedback-box-g" id="recall_fb_${item.id}"></div>
        </div>
      `;
    });

    html += `
      <div style="margin-top:20px; text-align:center;">
        <button type="button" class="btn-submit-g" id="btnGradeRecall" style="background:#d97706; padding:12px 32px;">
          Chấm Bài Khảo Lý Thuyết
        </button>
      </div>
    `;

    box.innerHTML = html;
    this.container.appendChild(box);

    box.querySelector('#btnGradeRecall').onclick = () => this.gradeRecall();
  }

  gradeRecall() {
    let correct = 0;
    this.theoryData.theory_recall.forEach(item => {
      const input = document.querySelector(`input[data-recall-id="${item.id}"]`);
      const userVal = input ? input.value : '';
      const result = ExerciseEngine.gradeQuestion(item, userVal);

      const row = document.getElementById(`recall_row_${item.id}`);
      const fb = document.getElementById(`recall_fb_${item.id}`);

      fb.classList.add('show');
      if (result.isCorrect) {
        correct++;
        row.className = 'q-row-g is-correct';
        fb.className = 'feedback-box-g show correct';
        fb.innerHTML = `✅ <b>Chính xác!</b> ${item.explanation || ''}`;
      } else {
        row.className = 'q-row-g is-wrong';
        fb.className = 'feedback-box-g show wrong';
        fb.innerHTML = `❌ <b>Chưa đúng!</b> Đáp án: <b>${result.correctDisplay}</b>. 💡 <i>${item.explanation || ''}</i>`;
      }
    });

    alert(`🎉 Bạn đã thuộc: ${correct} / ${this.totalRecallQuestions} câu lý thuyết!`);
  }

  renderExercises() {
    const box = document.createElement('div');
    box.id = 'tabExerciseContent';
    box.style.display = 'none';

    let html = '';
    this.totalQuestions = 0;

    this.exerciseData.exercise_groups.forEach(group => {
      html += `
        <div class="section-card-g">
          <h3 class="section-title-g">${group.group_title}</h3>
          <div class="section-instruction-g">${group.instruction}</div>
      `;

      group.questions.forEach((q, qIdx) => {
        this.totalQuestions++;
        let questionHtml = '';

        if (q.type === 'blank') {
          const parts = q.prompt.split('[blank]');
          questionHtml = `
            <span>${parts[0]}</span>
            <input type="text" class="input-blank-g" data-qid="${q.id}" autocomplete="off" placeholder="Điền từ...">
            <span>${parts[1] || ''}</span>
          `;
        } else if (q.type === 'choice') {
          questionHtml = `
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
          questionHtml = `
            <div style="width: 100%;">
              <div style="margin-bottom: 6px; color:#475569;">${q.prompt}</div>
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
              ${questionHtml}
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
        <b style="font-size:15px;" id="scoreSummaryLabel">Tổng bài tập: ${this.totalQuestions} câu</b>
        <div style="font-size:12.5px; color:#64748b;">Làm xong bấm nút bên phải để tự động chấm điểm & xem giải thích.</div>
      </div>
      <button type="button" class="btn-submit-g" id="btnGradeQuiz">Chấm Điểm & Xem Đáp Án</button>
    `;
    document.body.appendChild(bar);

    bar.querySelector('#btnGradeQuiz').onclick = () => this.gradeAll();
  }

  gradeAll() {
    let correctCount = 0;

    this.exerciseData.exercise_groups.forEach(group => {
      group.questions.forEach(q => {
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
          fb.innerHTML = `❌ <b>Chưa đúng!</b> Đáp án đúng: <b>${result.correctDisplay}</b>. <br>💡 <i>${q.explanation || ''}</i>`;
        }
      });
    });

    const percent = Math.round((correctCount / this.totalQuestions) * 100);
    const scoreLabel = document.getElementById('scoreSummaryLabel');
    scoreLabel.innerHTML = `🎉 Điểm của bạn: <span style="color:#0d9488; font-size:17px; font-weight:800;">${correctCount} / ${this.totalQuestions} (${percent}%)</span>`;

    window.scrollTo({ top: document.getElementById('tabExerciseContent').offsetTop - 30, behavior: 'smooth' });
  }
}
