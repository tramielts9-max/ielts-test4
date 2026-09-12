export class QuizController {
  constructor(words, isGoldenTime, onFinishSession) {
    this.words = words;
    this.isGoldenTime = isGoldenTime;
    this.onFinishSession = onFinishSession;
    this.currentIndex = 0;
    this.sessionResults = [];
    this.startTime = null;
  }

  start() {
    this.currentIndex = 0;
    this.sessionResults = [];
    this.renderQuestion();
  }

  speakCurrentWord() {
    const current = this.words[this.currentIndex];
    if (!current || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(current.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  renderQuestion() {
    if (this.currentIndex >= this.words.length) {
      this.onFinishSession(this.sessionResults, this.isGoldenTime);
      return;
    }

    const item = this.words[this.currentIndex];
    this.startTime = Date.now();

    const quizBox = document.getElementById('quizContainer');
    quizBox.classList.remove('hidden');
    document.getElementById('dashboardView').classList.add('hidden');

    quizBox.innerHTML = `
      <div class="quiz-header">
        <span>Từ ${this.currentIndex + 1}/${this.words.length} (${this.isGoldenTime ? '⚡ Giờ Vàng' : '🎯 Học tự do'})</span>
        <span id="thinkTimer">⏱️ 0.0s</span>
      </div>

      <div class="word-display">
        <div class="word">${item.word}</div>
        <div class="phonetic">${item.phonetic}</div>
        <button class="audio-btn" id="btnSpeak">🔊</button>
      </div>

      <div class="quiz-options">
        ${item.options.map((opt, i) => `
          <button class="quiz-opt-btn" data-answer="${opt}">
            ${String.fromCharCode(65 + i)}. ${opt}
          </button>
        `).join('')}
      </div>
    `;

    document.getElementById('btnSpeak').onclick = () => this.speakCurrentWord();
    this.speakCurrentWord();

    const optButtons = quizBox.querySelectorAll('.quiz-opt-btn');
    optButtons.forEach(btn => {
      btn.onclick = () => this.handleAnswer(btn, item, optButtons);
    });
  }

  handleAnswer(selectedBtn, item, allButtons) {
    allButtons.forEach(b => b.disabled = true);
    // Đo thời gian suy nghĩ chính xác từng từ (lấy đến 2 chữ số thập phân)
    const thinkTimeSec = Math.round(((Date.now() - this.startTime) / 1000) * 100) / 100;
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
      this.renderQuestion();
    }, 1000);
  }
}
