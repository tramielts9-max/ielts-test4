import { ExerciseEngine } from './exercise-engine-g.js';

export class LessonRenderer {
  constructor(container, data) {
    this.container = container;
    this.data = data;
    this.currentUnitIndex = 0;
  }

  init() {
    this.container.innerHTML = `
      <div class="hero-box-g">
        <h1 id="lessonMainTitle">${this.data.title}</h1>
        <p>Chọn từng phần thì bên dưới để học lý thuyết & làm bài tập tự động chấm điểm!</p>
      </div>

      <!-- Menu chọn Phần Thì -->
      <div class="unit-selector-bar" id="unitNavButtons"></div>

      <!-- Khung Lý thuyết & Bài tập của Phần được chọn -->
      <div id="unitMainContent"></div>
    `;

    this.renderUnitNav();
    this.loadUnit(0);
  }

  renderUnitNav() {
    const navBar = document.getElementById('unitNavButtons');
    navBar.innerHTML = this.data.units.map((u, idx) => `
      <button type="button" class="unit-nav-btn ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
        ${u.unit_name}
      </button>
    `).join('');

    navBar.querySelectorAll('.unit-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        navBar.querySelectorAll('.unit-nav-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.loadUnit(parseInt(e.currentTarget.dataset.idx, 10));
      });
    });
  }

  loadUnit(unitIdx) {
    this.currentUnitIndex = unitIdx;
    const unit = this.data.units[unitIdx];
    const contentBox = document.getElementById('unitMainContent');

    contentBox.innerHTML = `
      <div class="tab-nav-g">
        <button type="button" class="tab-btn-g active" id="tabTheoryBtn">📖 1. Lý Thuyết & Quy Tắc</button>
        <button type="button" class="tab-btn-g" id="tabExerciseBtn">✍️ 2. Luyện Tập (${unit.exercises.length} câu)</button>
      </div>

      <!-- TAB 1: LÝ THUYẾT -->
      <div id="paneTheory" style="display: block;">
        ${unit.theory.map(t => `
          <div class="theory-card-g">
            <h3>${t.title}</h3>
            <div>${t.content}</div>
          </div>
        `).join('')}
      </div>

      <!-- TAB 2: BÀI TẬP -->
      <div id="paneExercise" style="display: none;">
        <div class="exercise-card-g">
          <form id="quizForm" onsubmit="return false;">
            ${unit.exercises.map((q, qIdx) => {
              let inputField = '';
              if (q.type === 'blank') {
                const parts = q.prompt.split('[blank]');
                inputField = `
                  <span>${parts[0]}</span>
                  <input type="text" class="input-blank-g" data-qid="${q.id}" placeholder="nhập đáp án...">
                  <span>${parts[1] || ''}</span>
                `;
              } else if (q.type === 'rewrite') {
                inputField = `
                  <div style="width: 100%;">
                    <div style="margin-bottom: 6px; color:#475569;">Gợi ý/Đề bài: <b>${q.prompt}</b></div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <b>${q.targetStart || ''}</b>
                      <input type="text" class="input-blank-g" style="flex:1;" data-qid="${q.id}" placeholder="...">
                    </div>
                  </div>
                `;
              }

              return `
                <div class="q-item-row" id="row_${q.id}">
                  <div class="q-prompt-box">
                    <span class="q-number">Câu ${qIdx + 1}:</span>
                    ${inputField}
                  </div>
                  <div class="feedback-msg" id="fb_${q.id}"></div>
                </div>
              `;
            }).join('')}
          </form>

          <div style="margin-top: 24px; text-align: center;">
            <button type="button" class="btn-submit-g" id="btnCheckAnswers">
              🚀 NỘP BÀI & CHẤM ĐIỂM NGAY
            </button>
          </div>
        </div>
      </div>
    `;

    // Gắn sự kiện chuyển tab
    const tBtn = document.getElementById('tabTheoryBtn');
    const eBtn = document.getElementById('tabExerciseBtn');
    const pTheory = document.getElementById('paneTheory');
    const pExercise = document.getElementById('paneExercise');

    tBtn.onclick = () => {
      tBtn.classList.add('active'); eBtn.classList.remove('active');
      pTheory.style.display = 'block'; pExercise.style.display = 'none';
    };
    eBtn.onclick = () => {
      eBtn.classList.add('active'); tBtn.classList.remove('active');
      pExercise.style.display = 'block'; pTheory.style.display = 'none';
    };

    // Gắn sự kiện chấm bài
    document.getElementById('btnCheckAnswers').onclick = () => this.gradeCurrentUnit(unit);
  }

  gradeCurrentUnit(unit) {
    let score = 0;
    const total = unit.exercises.length;

    unit.exercises.forEach(q => {
      const input = document.querySelector(`input[data-qid="${q.id}"]`);
      const val = input ? input.value : "";
      const result = ExerciseEngine.grade(q, val);

      const row = document.getElementById(`row_${q.id}`);
      const fb = document.getElementById(`fb_${q.id}`);

      fb.style.display = 'block';

      if (result.isCorrect) {
        score++;
        row.className = "q-item-row correct-row";
        fb.className = "feedback-msg fb-correct";
        fb.innerHTML = `✅ <b>Chính xác!</b> ${q.explanation ? `• <i>${q.explanation}</i>` : ''}`;
      } else {
        row.className = "q-item-row wrong-row";
        fb.className = "feedback-msg fb-wrong";
        fb.innerHTML = `❌ <b>Sai rồi!</b> Đáp án đúng là: <b>${result.correctDisplay}</b> ${q.explanation ? `<br>💡 <i>${q.explanation}</i>` : ''}`;
      }
    });

    const percent = Math.round((score / total) * 100);
    alert(`🎉 KẾT QUẢ BÀI LÀM:\nBạn đạt ${score}/${total} câu (${percent}%).\nHãy xem lại đáp án và giải thích chi tiết màu đỏ/xanh bên dưới từng câu!`);
  }
}
