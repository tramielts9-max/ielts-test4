import { StorageManager } from './storage-v.js';
import { SRSEngine } from './srs-engine-v.js';
import { BotsSimulation } from './bots-simulation-v.js';
import { QuizController } from './quiz-v.js';
import { UIController } from './ui-v.js';

class App {
  constructor() {
    this.words = [];
    this.selectedUnit = 'all'; // Mặc định là 'all' hoặc 1, 2, 3...
    this.user = StorageManager.getUser();
    this.progress = StorageManager.getWordProgress();
    this.leaderboard = StorageManager.getLeaderboard();
  }

  async init() {
    try {
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

    // Sự kiện chọn Unit
    const unitSel = document.getElementById('unitSelector');
    if (unitSel) {
      unitSel.onchange = (e) => {
        this.selectedUnit = e.target.value;
        this.refreshDashboard();
      };
    }

    document.getElementById('btnStartReview').onclick = () => this.startReviewSession();

    setInterval(() => {
      this.leaderboard = BotsSimulation.simulateBotProgress(this.leaderboard, this.user.xp);
      StorageManager.saveLeaderboard(this.leaderboard);
      UIController.renderLeaderboard(this.leaderboard, 'me');
    }, 15000);
  }

  getActiveWords() {
    if (this.selectedUnit === 'all') return this.words;
    const unitNum = parseInt(this.selectedUnit, 10);
    return this.words.filter(w => w.unit === unitNum);
  }

  updateUserStatsUI() {
    document.getElementById('userStreak').innerText = `🔥 ${this.user.streak} ngày`;
    document.getElementById('userFreeze').innerText = `🧊 ${this.user.freezeCards} thẻ`;
    document.getElementById('userXP').innerText = `⚡ ${this.user.xp} XP`;
    document.getElementById('userLeague').innerText = `🏆 Hạng ${this.user.currentLeague}`;
  }

  refreshDashboard() {
    const activeWords = this.getActiveWords();

    UIController.renderMemoryTower(activeWords, this.progress, (tierLevel) => {
      const wordsInTier = activeWords.filter(w => {
        const p = this.progress[w.id];
        return (p ? p.level : 1) === tierLevel;
      });
      UIController.showTierWordsModal(tierLevel, wordsInTier, this.progress);
    });

    UIController.renderLeaderboard(this.leaderboard, 'me');

    const queueData = SRSEngine.getReviewQueue(activeWords, this.progress);
    const nextTime = SRSEngine.getNextReviewCountdown(activeWords, this.progress);

    UIController.startGoldenTimer(nextTime, queueData.isGoldenTime);
  }

  startReviewSession() {
    const activeWords = this.getActiveWords();
    const queueData = SRSEngine.getReviewQueue(activeWords, this.progress);

    if (queueData.words.length === 0) {
      alert("Chưa có từ vựng nào trong Unit này!");
      return;
    }

    const quiz = new QuizController(
      queueData.words,
      queueData.isGoldenTime,
      (results, isGoldenTime) => this.onFinishSession(results, isGoldenTime),
      this.words // Truyền toàn bộ kho 300 từ để tự sinh 4 đáp án trắc nghiệm
    );

    quiz.start();
  }

  async onFinishSession(sessionResults, isGoldenTime) {
    let correctCount = 0;
    let totalThinkTime = 0;
    const wordsSummaryArr = [];

    sessionResults.forEach(res => {
      if (res.isCorrect) correctCount++;
      totalThinkTime += res.thinkTimeSec;
      wordsSummaryArr.push(`${res.word} (${res.isCorrect ? 'ĐÚNG' : 'SAI'})`);

      const currentProg = this.progress[res.wordId];
      const newProg = SRSEngine.calculateNextReview(currentProg, res.isCorrect);
      this.progress[res.wordId] = newProg;
    });

    StorageManager.saveWordProgress(this.progress);

    const earnedXP = correctCount * (isGoldenTime ? 15 : 10);
    this.user.xp += earnedXP;
    StorageManager.saveUser(this.user);

    const sessionCount = StorageManager.incrementSessionCount();
    const avgResponseTime = Math.round((totalThinkTime / sessionResults.length) * 10) / 10;

    const payload = {
      studentName: this.user.name,
      studentEmail: this.user.email,
      sessionData: {
        sessionNumber: sessionCount,
        unit: this.selectedUnit,
        sessionType: isGoldenTime ? "Thời Điểm Vàng" : "Luyện tập tự do",
        score: correctCount,
        totalWords: sessionResults.length,
        avgResponseTime: avgResponseTime,
        wordsSummary: wordsSummaryArr.join(', '),
        details: sessionResults
      }
    };

    StorageManager.sendSessionToCloud(payload);

    this.updateUserStatsUI();
    document.getElementById('quizContainer').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');

    alert(`🎉 Hoàn thành Unit!\n- Kết quả: ${correctCount}/${sessionResults.length} từ đúng\n- Phản xạ TB: ${avgResponseTime}s/từ\n- Nhận được: +${earnedXP} XP\nDữ liệu đã lưu an toàn lên Google Drive!`);

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
