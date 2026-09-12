import { StorageManager } from './storage-v.js';
import { SRSEngine } from './srs-engine-v.js';
import { BotsSimulation } from './bots-simulation-v.js';
import { QuizController } from './quiz-v.js';
import { UIController } from './ui-v.js';

class App {
  constructor() {
    this.words = [];
    this.user = StorageManager.getUser();
    this.progress = StorageManager.getWordProgress();
    this.leaderboard = StorageManager.getLeaderboard();
  }

  async init() {
    try {
      // Gọi đúng thư mục data-v và file words-v.json
      const res = await fetch('data-v/words-v.json');
      this.words = await res.json();
    } catch (e) {
      alert("Không tìm thấy file data-v/words-v.json!");
      return;
    }

    if (!this.leaderboard) {
      this.leaderboard = BotsSimulation.initLeague(this.user);
      StorageManager.saveLeaderboard(this.leaderboard);
    }

    this.updateUserStatsUI();
    this.refreshDashboard();

    document.getElementById('btnStartReview').onclick = () => this.startReviewSession();

    setInterval(() => {
      this.leaderboard = BotsSimulation.simulateBotProgress(this.leaderboard, this.user.xp);
      StorageManager.saveLeaderboard(this.leaderboard);
      UIController.renderLeaderboard(this.leaderboard, 'me');
    }, 15000);
  }

  updateUserStatsUI() {
    document.getElementById('userStreak').innerText = `🔥 ${this.user.streak} ngày`;
    document.getElementById('userFreeze').innerText = `🧊 ${this.user.freezeCards} thẻ`;
    document.getElementById('userXP').innerText = `⚡ ${this.user.xp} XP`;
    document.getElementById('userLeague').innerText = `🏆 Hạng ${this.user.currentLeague}`;
  }

  refreshDashboard() {
    UIController.renderMemoryTower(this.words, this.progress);
    UIController.renderLeaderboard(this.leaderboard, 'me');

    const nextTime = SRSEngine.getNextReviewCountdown(this.words, this.progress);
    UIController.startGoldenTimer(nextTime, () => {
      if (Notification.permission === "granted") {
        new Notification("⚡ ĐÃ ĐẾN THỜI ĐIỂM VÀNG!", {
          body: "Có từ vựng chuẩn bị rơi khỏi não bạn, vào giải cứu ngay!"
        });
      }
    });
  }

  startReviewSession() {
    const queue = SRSEngine.getReviewQueue(this.words, this.progress);
    if (queue.length === 0) {
      alert("Bạn đã ôn sạch các từ trong đợt này rồi!");
      return;
    }

    const quiz = new QuizController(
      queue,
      (wordId, isCorrect, timeSpentSec) => this.onAnswerWord(wordId, isCorrect, timeSpentSec),
      () => this.onFinishSession()
    );

    quiz.start();
  }

  onAnswerWord(wordId, isCorrect, timeSpentSec) {
    const currentProg = this.progress[wordId];
    const newProg = SRSEngine.calculateNextReview(currentProg, isCorrect);
    this.progress[wordId] = newProg;
    StorageManager.saveWordProgress(this.progress);

    const earnedXP = isCorrect ? 15 : 2;
    this.user.xp += earnedXP;
    StorageManager.saveUser(this.user);

    this.leaderboard = BotsSimulation.simulateBotProgress(this.leaderboard, this.user.xp);
    StorageManager.saveLeaderboard(this.leaderboard);

    this.updateUserStatsUI();
  }

  onFinishSession() {
    document.getElementById('quizContainer').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');
    alert("🎉 Xuất sắc! Bạn đã giải cứu thành công các từ vựng trong Thời Điểm Vàng!");
    this.refreshDashboard();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
  const app = new App();
  app.init();
});
