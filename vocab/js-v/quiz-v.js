export class QuizController {
  constructor(words, isGoldenTime, onFinishSession) {
    this.words = words;
    this.isGoldenTime = isGoldenTime;
    this.onFinishSession = onFinishSession;
    this.currentIndex = 0;
    this.sessionResults = [];
    this.sessionStartTime = Date.now();
    this.currentCardStartTime = null;
    this.isCardFlipped = false;

    // Lắng nghe phím tắt: Space (lật thẻ), Phím Trái (Chưa nhớ), Phím Phải (Đã nhớ)
    this.handleKeyDown = (e) => {
      const qBox = document.getElementById('quizContainer');
      if (!qBox || qBox.classList.contains('hidden')) return;
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
    };
    window.removeEventListener('keydown', window._fcKeyHandler);
    window._fcKeyHandler = this.handleKeyDown;
    window.addEventListener('keydown', window._fcKeyHandler);
  }

  start() {
    this.currentIndex = 0;
    this.sessionResults = [];
    this.sessionStartTime = Date.now();
    this.renderCurrentQuestion();
  }

  /**
   * NGẮT LUỒNG ÂM THANH CŨ TỨC THÌ (INTERRUPT) & PHÁT ÂM TỰ NHIÊN
   */
  speakWord(wordText) {
    if (!window.speechSynthesis) return;
    // Dập tắt ngay âm thanh cũ đang nói dở
    window.speechSynthesis.cancel();

    // Loại bỏ từ loại như (v), (adj), (n) để đọc chuẩn từ vựng
    const cleanWord = wordText.replace(/\s*\(.*?\)/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanWord);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  toggleFlipCard() {
    const card = document.getElementById('mainFlashcard');
    if (!card) return;
    this.isCardFlipped = !this.isCardFlipped;
    card.classList.toggle('is-flipped', this.isCardFlipped);
  }

  renderCurrentQuestion() {
    if (this.currentIndex >= this.words.length) {
      // Dập tắt âm thanh khi xong phiên học
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      const totalSessionSecs = Math.round((Date.now() - this.sessionStartTime) / 1000);
      this.onFinishSession(this.sessionResults, this.isGoldenTime, totalSessionSecs);
      return;
    }

    const item = this.words[this.currentIndex];
    this.currentCardStartTime = Date.now();
    this.isCardFlipped = false;

    const quizBox = document.getElementById('quizContainer');
    quizBox.classList.remove('hidden');
    document.getElementById('dashboardView').classList.add('hidden');

    quizBox.innerHTML = `
      <div class="quiz-top-bar">
        <div>Thẻ <b>${this.currentIndex + 1} / ${this.words.length}</b> (${this.isGoldenTime ? '⚡ Giờ Vàng' : '🎯 Luyện tập'})</div>
        <button id="btnExitSession" style="background:#f1f5f9; border:none; padding:4px 12px; border-radius:12px; font-weight:700; cursor:pointer;">✕ Thoát</button>
      </div>

      <div class="flashcard-wrapper">
        <div class="flashcard" id="mainFlashcard">
          <!-- Mặt trước -->
          <div class="card-face">
            <div style="font-size:13px; color:#94a3b8;">THUẬT NGỮ</div>
            <div class="card-main-content">
              <div class="card-term">${item.word}</div>
              <div class="card-phonetic">${item.phonetic || ''}</div>
              <button class="audio-btn" id="btnSpeakTerm">🔊</button>
            </div>
            <div class="card-hint-bar">⌨️ Bấm vào thẻ hoặc nhấn [Phím Cách] để lật</div>
          </div>
          <!-- Mặt sau -->
          <div class="card-face card-face-back">
            <div style="font-size:13px; color:#38bdf8;">ĐỊNH NGHĨA</div>
            <div class="card-main-content">
              <div class="card-meaning">${item.meaning}</div>
              ${item.example ? `<div class="card-example">"${item.example}"</div>` : ''}
            </div>
            <div class="card-hint-bar">⌨️ Bấm vào thẻ để lật lại</div>
          </div>
        </div>
      </div>

      <div class="flashcard-actions">
        <button class="btn-fc-action btn-fc-wrong" id="btnFcWrong" title="Chưa nhớ (Phím ←)">✕</button>
        <button class="btn-fc-action btn-fc-correct" id="btnFcCorrect" title="Đã thuộc (Phím →)">✓</button>
      </div>
    `;

    document.getElementById('mainFlashcard').onclick = () => this.toggleFlipCard();
    document.getElementById('btnSpeakTerm').onclick = (e) => {
      e.stopPropagation();
      this.speakWord(item.word);
    };
    document.getElementById('btnFcWrong').onclick = () => this.handleFlashcardAnswer(false);
    document.getElementById('btnFcCorrect').onclick = () => this.handleFlashcardAnswer(true);
    document.getElementById('btnExitSession').onclick = () => {
      if (confirm("Em có muốn dừng phiên học này không?")) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        quizBox.classList.add('hidden');
        document.getElementById('dashboardView').classList.remove('hidden');
      }
    };

    // Tự động phát âm ngay khi mở thẻ
    this.speakWord(item.word);
  }

  handleFlashcardAnswer(isCorrect) {
    const thinkTimeSec = Math.round(((Date.now() - this.currentCardStartTime) / 1000) * 10) / 10;
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
}
