export class QuizController {
  constructor(words, onCompleteWord, onFinishSession) {
    this.words = words;
    this.onCompleteWord = onCompleteWord;
    this.onFinishSession = onFinishSession;
    this.currentIndex = 0;
    this.startTime = null;
  }

  start() {
    this.currentIndex = 0;
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
      this.onFinishSession();
      return;
    }

    const item = this.words[this.currentIndex];
    this.startTime = Date.now();

    const quizBox = document.getElementById('quizContainer');
    quizBox.classList.remove('hidden');
    document.getElementById('dashboardView').classList.add('hidden');

    quizBox.innerHTML = `
      <div class="quiz-header">
        <span>Từ ${this.currentIndex + 1}/${this.words.length}</span>
        <span>⏱️ Phản xạ nhanh nhận thưởng XP</span>
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
    const timeSpentSec = (Date.now() - this.startTime) / 1000;
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

    setTimeout(() => {
      this.onCompleteWord(item.id, isCorrect, timeSpentSec);
      this.currentIndex++;
      this.renderQuestion();
    }, 1200);
  }
}
