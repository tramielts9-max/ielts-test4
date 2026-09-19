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

    box.innerHTML = `
      <div class="theory-card-g" style="background:#fefce8; border: 1.5px solid #fef08a; padding: 22px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="color:#854d0e; margin:0 0 6px 0;">📝 ĐỀ KIỂM TRA TỰ LUẬN KHẢO LÝ THUYẾT: ${this.theoryData.tense_name}</h3>
            <p style="font-size:13.5px; color:#713f12; margin:0;">
              Học sinh tự nhớ lại và trình bày đầy đủ: <b>Công thức 3 thể (+, -, ?), Tất cả các cách dùng, Tự đặt câu ví dụ</b> và <b>Dấu hiệu nhận biết</b>.
            </p>
          </div>
          <span style="background:#f59e0b; color:white; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px;">
            AI CHẤM TRỰC TIẾP
          </span>
        </div>
      </div>

      <div class="theory-card-g" style="background:#ffffff; margin-top:16px;">
        <label style="font-weight:700; font-size:14.5px; display:block; margin-bottom:8px; color:#0f172a;">
          ✍️ Nhập bài làm tự luận của Em vào đây (Trình bày chi tiết từng mục):
        </label>
        <textarea id="aiRecallInput" rows="12" style="width:100%; box-sizing:border-box; padding:14px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:14px; line-height:1.6; font-family:inherit; outline:none;" placeholder="Em hãy gõ bài làm vào đây:
1. Công thức (+, -, ? với to be và V thường):
...
2. Tất cả các cách sử dụng:
- Cách 1: ... (Ví dụ: ...)
- Cách 2: ... (Ví dụ: ...)
3. Dấu hiệu nhận biết & Trạng từ:
..."></textarea>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; flex-wrap:wrap; gap:10px;">
          <div id="aiGradingStatus" style="font-size:13.5px; font-weight:600; color:#d97706;"></div>
          <button type="button" class="btn-submit-g" id="btnSubmitToAI" style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding:12px 28px; font-size:14.5px; box-shadow:0 4px 12px rgba(217, 119, 6, 0.25);">
            🤖 GỬI BÀI CHO AI CHẤM ĐIỂM
          </button>
        </div>
      </div>

      <!-- KHUNG HIỂN THỊ KẾT QUẢ AI CHẤM TỰ ĐỘNG -->
      <div id="aiReportContainer" class="theory-card-g" style="display:none; background:#ffffff; border:2px solid #0d9488; margin-top:20px; padding:24px;">
        <div id="aiReportMarkdown" style="line-height:1.7; font-size:14.5px; color:#1e293b;"></div>
      </div>
    `;

    this.container.appendChild(box);

    // Gắn sự kiện gọi AI khi bấm nút
    box.querySelector('#btnSubmitToAI').onclick = () => this.handleCallAIGrading();
  }

  async handleCallAIGrading() {
    const text = document.getElementById('aiRecallInput').value.trim();
    if (!text || text.length < 20) {
      alert("⚠️ Em hãy viết đầy đủ bài tự luận (công thức, cách dùng, ví dụ...) trước khi gửi Anh chấm nhé!");
      return;
    }

    const btn = document.getElementById('btnSubmitToAI');
    const status = document.getElementById('aiGradingStatus');
    const reportBox = document.getElementById('aiReportContainer');
    const reportMd = document.getElementById('aiReportMarkdown');

    btn.disabled = true;
    reportBox.style.display = 'block';
    reportMd.innerHTML = '';
    status.innerHTML = "⏳ Anh đang phân tích bài tự luận, soi xét câu ví dụ và chấm điểm cho Em...";

    // Cuộn nhẹ xuống khung kết quả
    reportBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

    let fullMarkdown = '';

    try {
      // Import động hàm AI
      const { gradeTheoryEssayWithAI } = await import('./ai-grader-g.js');

      await gradeTheoryEssayWithAI(
        this.theoryData.tense_name,
        this.theoryData.sections,
        text,
        (chunk) => {
          fullMarkdown += chunk;
          if (window.marked) {
            reportMd.innerHTML = window.marked.parse(fullMarkdown);
          } else {
            reportMd.innerText = fullMarkdown;
          }
        }
      );

      status.innerHTML = "✅ Anh đã chấm xong bài tự luận cho Em! Em xem chi tiết bảng điểm bên dưới nhé.";
      btn.disabled = false;
      btn.innerText = "CHẤM LẠI BÀI KHÁC";
    } catch (err) {
      console.error(err);
      status.innerHTML = "❌ Lỗi: " + err.message;
      btn.disabled = false;
      btn.innerText = "THỬ LẠI";
    }
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
