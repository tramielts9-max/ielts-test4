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

    // Giả lập bot cày điểm nhẹ mỗi 15 giây
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
    // Kích hoạt tính năng bấm vào 5 tầng tháp để xem danh sách từ
    UIController.renderMemoryTower(this.words, this.progress, (tierLevel) => {
      const wordsInTier = this.words.filter(w => {
        const p = this.progress[w.id];
        return (p ? p.level : 1) === tierLevel;
      });
      UIController.showTierWordsModal(tierLevel, wordsInTier, this.progress);
    });

    UIController.renderLeaderboard(this.leaderboard, 'me');

    const queueData = SRSEngine.getReviewQueue(this.words, this.progress);
    const nextTime = SRSEngine.getNextReviewCountdown(this.words, this.progress);

    UIController.startGoldenTimer(nextTime, queueData.isGoldenTime);
  }

  startReviewSession() {
    const queueData = SRSEngine.getReviewQueue(this.words, this.progress);
    if (queueData.words.length === 0) {
      alert("Chưa có từ vựng nào trong hệ thống!");
      return;
    }

    const quiz = new QuizController(
      queueData.words,
      queueData.isGoldenTime,
      (results, isGoldenTime) => this.onFinishSession(results, isGoldenTime)
    );

    quiz.start();
  }

  async onFinishSession(sessionResults, isGoldenTime) {
    let correctCount = 0;
    let totalThinkTime = 0;
    const wordsSummaryArr = [];

    // 1. Cập nhật 5 Hũ Trí Nhớ & tính điểm
    sessionResults.forEach(res => {
      if (res.isCorrect) correctCount++;
      totalThinkTime += res.thinkTimeSec;
      wordsSummaryArr.push(`${res.word} (${res.isCorrect ? 'ĐÚNG' : 'SAI'})`);

      const currentProg = this.progress[res.wordId];
      const newProg = SRSEngine.calculateNextReview(currentProg, res.isCorrect);
      this.progress[res.wordId] = newProg;
    });

    StorageManager.saveWordProgress(this.progress);

    // 2. Tính XP và cập nhật Gamification
    const earnedXP = correctCount * (isGoldenTime ? 15 : 10);
    this.user.xp += earnedXP;
    StorageManager.saveUser(this.user);

    const sessionCount = StorageManager.incrementSessionCount();
    const avgResponseTime = Math.round((totalThinkTime / sessionResults.length) * 10) / 10;

    // 3. ĐỒNG BỘ ĐẦY ĐỦ DỮ LIỆU LÊN GOOGLE DRIVE/SHEETS
    const payload = {
      studentName: this.user.name,
      studentEmail: this.user.email,
      sessionData: {
        sessionNumber: sessionCount,
        sessionType: isGoldenTime ? "Thời Điểm Vàng" : "Luyện tập tự do",
        score: correctCount,
        totalWords: sessionResults.length,
        avgResponseTime: avgResponseTime,
        wordsSummary: wordsSummaryArr.join(', '),
        details: sessionResults
      }
    };

    StorageManager.sendSessionToCloud(payload);

    // 4. Cập nhật giao diện
    this.updateUserStatsUI();
    document.getElementById('quizContainer').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');

    alert(`🎉 Hoàn thành lượt học #${sessionCount}!\n- Kết quả: ${correctCount}/${sessionResults.length} từ đúng\n- Phản xạ TB: ${avgResponseTime}s/từ\n- Nhận được: +${earnedXP} XP\nDữ liệu đã được lưu an toàn lên Google Drive!`);

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
