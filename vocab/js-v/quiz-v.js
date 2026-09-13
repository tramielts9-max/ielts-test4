export class QuizController {
  constructor(words, isGoldenTime, onFinishSession, allWordsPool = []) {
    this.words = words;
    this.allWordsPool = allWordsPool.length > 0 ? allWordsPool : words;
    this.isGoldenTime = isGoldenTime;
    this.onFinishSession = onFinishSession;
    this.currentIndex = 0;
    this.sessionResults = [];
    this.startTime = null;
    this.mode = 'flashcard'; // 'flashcard' (mặc định) hoặc 'quiz'
    this.isCardFlipped = false;

    // Lắng nghe phím tắt: Space (lật thẻ), Phím Trái (Chưa nhớ), Phím Phải (Đã nhớ)
    this.handleKeyDown = (e) => {
      if (document.getElementById('quizContainer').classList.contains('hidden')) return;
      if (this.mode === 'flashcard') {
        if (e.code === 'Space') {
          e.preventDefault();
          this.toggleFlipCard();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          this.handleFlashcardAnswer(false);
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          this.handleFlashcardAnswer(true);
        }
      }
    };
    window.removeEventListener('keydown', window._fcKeyHandler);
    window._fcKeyHandler = this.handleKeyDown;
    window.addEventListener('keydown', window._fcKeyHandler);
  }

  start() {
    this.currentIndex = 0;
    this.sessionResults = [];
    this.renderCurrentQuestion();
  }

  speakWord(wordText) {
    if (!wordText || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(wordText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  toggleFlipCard() {
    const card = document.getElementById('mainFlashcard');
    if (!card) return;
    this.isCardFlipped = !this.isCardFlipped;
    card.classList.toggle('is-flipped', this.isCardFlipped);
  }

  /**
   * TỰ ĐỘNG TẠO 4 ĐÁP ÁN CHO TRẮC NGHIỆM:
   * 1 đáp án chuẩn xác của từ đó + 3 đáp án ngẫu nhiên bốc từ các từ khác trong kho
   */
  generateAutoOptions(currentWord) {
    const correct = currentWord.meaning;
    const otherMeanings = this.allWordsPool
      .filter(w => w.id !== currentWord.id && w.meaning !== correct)
      .map(w => w.meaning);

    // Trộn ngẫu nhiên và bốc 3 đáp án sai
    const shuffledOthers = otherMeanings.sort(() => 0.5 - Math.random());
    const pickedWrong = shuffledOthers.slice(0, 3);

    // Hợp nhất lại thành 4 đáp án và đảo vị trí ngẫu nhiên
    const combined = [correct, ...pickedWrong];
    return combined.sort(() => 0.5 - Math.random());
  }

  renderCurrentQuestion() {
    if (this.currentIndex >= this.words.length) {
      this.onFinishSession(this.sessionResults, this.isGoldenTime);
      return;
    }

    const item = this.words[this.currentIndex];
    this.startTime = Date.now();
    this.isCardFlipped = false;

    const quizBox = document.getElementById('quizContainer');
    quizBox.classList.remove('hidden');
    document.getElementById('dashboardView').classList.add('hidden');

    const topBarHtml = `
      <div class="quiz-top-bar">
        <div>Thẻ <b>${this.currentIndex + 1} / ${this.words.length}</b> (${this.isGoldenTime ? '⚡ Giờ Vàng' : '🎯 Luyện tự do'})</div>
        <button class="mode-switcher-btn" id="btnSwitchMode">
          ${this.mode === 'flashcard' ? '🎯 Đổi sang Trắc nghiệm 4 đáp án' : '🎴 Đổi sang Thẻ lật (Flashcard)'}
        </button>
      </div>
    `;

    if (this.mode === 'flashcard') {
      // GIAO DIỆN THẺ LẬT CHUẨN QUIZLET
      quizBox.innerHTML = `
        ${topBarHtml}
        <div class="flashcard-wrapper">
          <div class="flashcard" id="mainFlashcard">
            <!-- Mặt trước -->
            <div class="card-face">
              <div style="font-size:13px; color:#94a3b8;">MẶT TRƯỚC: THUẬT NGỮ</div>
              <div class="card-main-content">
                <div class="card-term">${item.word}</div>
                <div class="card-phonetic">${item.phonetic || ''}</div>
                <button class="audio-btn" id="btnSpeakTerm">🔊</button>
              </div>
              <div class="card-hint-bar">⌨️ Bấm vào thẻ hoặc nhấn [Phím Cách] để lật</div>
            </div>
            <!-- Mặt sau -->
            <div class="card-face card-face-back">
              <div style="font-size:13px; color:#38bdf8;">MẶT SAU: ĐỊNH NGHĨA</div>
              <div class="card-main-content">
                <div class="card-meaning">${item.meaning}</div>
                ${item.example ? `<div class="card-example">"${item.example}"</div>` : ''}
              </div>
              <div class="card-hint-bar">⌨️ Bấm vào thẻ để lật lại</div>
            </div>
          </div>
        </div>

        <div class="flashcard-actions">
          <button class="btn-fc-action btn-fc-wrong" id="btnFcWrong" title="Chưa nhớ (Phím mũi tên trái ←)">✕</button>
          <button class="btn-fc-action btn-fc-correct" id="btnFcCorrect" title="Đã thuộc (Phím mũi tên phải →)">✓</button>
        </div>
      `;

      document.getElementById('mainFlashcard').onclick = () => this.toggleFlipCard();
      document.getElementById('btnSpeakTerm').onclick = (e) => {
        e.stopPropagation();
        this.speakWord(item.word);
      };
      document.getElementById('btnFcWrong').onclick = () => this.handleFlashcardAnswer(false);
      document.getElementById('btnFcCorrect').onclick = () => this.handleFlashcardAnswer(true);

    } else {
      // GIAO DIỆN TRẮC NGHIỆM 4 ĐÁP ÁN (TỰ SINH ĐÁP ÁN ĐÚNG/SAI)
      const options = this.generateAutoOptions(item);

      quizBox.innerHTML = `
        ${topBarHtml}
        <div style="text-align: center; margin: 20px 0 25px 0;">
          <div style="font-size: 34px; font-weight: 800; color: var(--primary);">${item.word}</div>
          <div style="color: var(--text-muted); font-size: 16px; margin-top: 4px;">${item.phonetic || ''}</div>
          <button class="audio-btn" id="btnSpeakQuiz" style="background:#ede9fe; color:var(--primary);">🔊</button>
        </div>

        <div class="quiz-options">
          ${options.map((opt, i) => `
            <button class="quiz-opt-btn" data-answer="${opt}">
              ${String.fromCharCode(65 + i)}. ${opt}
            </button>
          `).join('')}
        </div>
      `;

      document.getElementById('btnSpeakQuiz').onclick = () => this.speakWord(item.word);

      const optButtons = quizBox.querySelectorAll('.quiz-opt-btn');
      optButtons.forEach(btn => {
        btn.onclick = () => this.handleQuizAnswer(btn, item, optButtons);
      });
    }

    this.speakWord(item.word);

    document.getElementById('btnSwitchMode').onclick = () => {
      this.mode = (this.mode === 'flashcard') ? 'quiz' : 'flashcard';
      this.renderCurrentQuestion();
    };
  }

  handleFlashcardAnswer(isCorrect) {
    const thinkTimeSec = Math.round(((Date.now() - this.startTime) / 1000) * 10) / 10;
    const item = this.words[this.currentIndex];

    this.sessionResults.push({
      wordId: item.id,
      word: item.word,
      meaning: item.meaning,
      userChoice: isCorrect ? "Đã nhớ (✓)" : "Chưa nhớ (✕)",
      isCorrect: isCorrect,
      thinkTimeSec: thinkTimeSec
    });

    this.currentIndex++;
    this.renderCurrentQuestion();
  }

  handleQuizAnswer(selectedBtn, item, allButtons) {
    allButtons.forEach(b => b.disabled = true);
    const thinkTimeSec = Math.round(((Date.now() - this.startTime) / 1000) * 10) / 10;
    const selectedAnswer = selectedBtn.getAttribute('data-answer');
    const isCorrect = (selectedAnswer === item.meaning);

    if (isCorrect) {
      selectedBtn.classList.add('correct');
    } else {
      selectedBtn.classList.add('wrong');
      allButtons.forEach(b => {
        if (b.getAttribute('data-answer') === item.meaning) b.classList.add('correct');
      });
    }

    this.sessionResults.push({
      wordId: item.id,
      word: item.word,
      meaning: item.meaning,
      userChoice: selectedAnswer,
      isCorrect: isCorrect,
      thinkTimeSec: thinkTimeSec
    });

    setTimeout(() => {
      this.currentIndex++;
      this.renderCurrentQuestion();
    }, 900);
  }
}
