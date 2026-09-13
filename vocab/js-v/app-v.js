import { StorageManager } from './storage-v.js';
import { SRSEngine } from './srs-engine-v.js';
import { BotsSimulation } from './bots-simulation-v.js';
import { QuizController } from './quiz-v.js';
import { UIController } from './ui-v.js';

class App {
  constructor() {
    this.words = [];
    this.courses = [];
    this.currentCourse = null;
    this.activeTab = 'ontap'; // 'ontap', 'roadmap', 'sotay', 'rank'
    this.user = StorageManager.getUser();
    this.progress = StorageManager.getWordProgress();
    this.leaderboard = StorageManager.getLeaderboard();
  }

  async init() {
    try {
      const [resWords, resCourses] = await Promise.all([
        fetch('data-v/words-v.json'),
        fetch('data-v/courses-v.json')
      ]);
      this.words = await resWords.json();
      this.courses = await resCourses.json();
      this.currentCourse = this.courses[0];
    } catch (e) {
      alert("Không thể tải dữ liệu khóa học!");
      return;
    }

    if (!this.leaderboard) {
      this.leaderboard = BotsSimulation.initLeague(this.user);
      StorageManager.saveLeaderboard(this.leaderboard);
    }

    this.initNavigationTabs();
    this.updateUserStatsUI();
    this.renderWeeklyStreak();
    this.refreshDashboard();

    document.getElementById('btnStartReview').onclick = () => this.startReviewSession(this.words);

    setInterval(() => {
      this.leaderboard = BotsSimulation.simulateBotProgress(this.leaderboard, this.user.xp);
      StorageManager.saveLeaderboard(this.leaderboard);
      UIController.renderLeaderboard(this.leaderboard, 'me');
    }, 15000);
  }

  initNavigationTabs() {
    const tabs = ['ontap', 'roadmap', 'sotay', 'rank'];
    tabs.forEach(tab => {
      document.getElementById(`tab_${tab}`)?.addEventListener('click', () => {
        this.activeTab = tab;
        tabs.forEach(t => {
          document.getElementById(`tab_${t}`)?.classList.toggle('active', t === tab);
          document.getElementById(`view_${t}`)?.classList.toggle('hidden', t !== tab);
        });
        if (tab === 'roadmap') this.renderRoadmap();
        if (tab === 'sotay') this.renderSotay();
        if (tab === 'rank') UIController.renderLeaderboard(this.leaderboard, 'me');
      });
    });
  }

  renderRoadmap() {
    const container = document.getElementById('roadmapLessonList');
    if (!container || !this.currentCourse) return;

    document.getElementById('courseHeaderTitle').innerText = this.currentCourse.title;

    container.innerHTML = this.currentCourse.lessons.map((lesson, idx) => {
      const isStart = idx === 0;
      return `
        <div class="lesson-card ${isStart ? 'active-start' : ''}" onclick="window.startLesson(${lesson.unit})">
          ${isStart ? '<div class="badge-start-here">START HERE</div>' : ''}
          <div class="lesson-avatar">${lesson.icon}</div>
          <div class="lesson-info">
            <div class="lesson-title">${lesson.title}</div>
            <div class="lesson-subtitle">${lesson.subTitle}</div>
          </div>
          <div class="lesson-badge-count">${lesson.count} từ</div>
        </div>
      `;
    }).join('');

    window.startLesson = (unitNum) => {
      const unitWords = this.words.filter(w => w.unit === unitNum);
      this.startReviewSession(unitWords);
    };
  }

  renderSotay() {
    UIController.renderMemoryTower(this.words, this.progress, (tierLevel) => {
      const wordsInTier = this.words.filter(w => (this.progress[w.id]?.level || 1) === tierLevel);
      UIController.showTierWordsModal(tierLevel, wordsInTier, this.progress);
    });
  }

  renderWeeklyStreak() {
    const checkedDays = StorageManager.getWeekCheckin();
    // 1: T2, 2: T3, 3: T4, 4: T5, 5: T6, 6: T7, 0: CN
    const daysMap = [
      { day: 1, label: "T2" }, { day: 2, label: "T3" }, { day: 3, label: "T4" },
      { day: 4, label: "T5" }, { day: 5, label: "T6" }, { day: 6, label: "T7" }, { day: 0, label: "CN" }
    ];

    const container = document.getElementById('weekStreakDays');
    if (!container) return;

    container.innerHTML = daysMap.map(d => {
      const isDone = checkedDays.includes(d.day);
      return `
        <div class="day-bubble">
          <div class="day-circle ${isDone ? 'checked' : ''}">${isDone ? '✓' : ''}</div>
          <div class="day-label">${d.label}</div>
        </div>
      `;
    }).join('');
  }

  updateUserStatsUI() {
    document.getElementById('userStreak').innerText = `🔥 ${this.user.streak} ngày`;
    document.getElementById('userFreeze').innerText = `🧊 ${this.user.freezeCards} thẻ`;
    document.getElementById('userXP').innerText = `⚡ ${this.user.xp} KN`;
    document.getElementById('userLeague').innerText = `🏆 ${this.user.currentLeague}`;
  }

  refreshDashboard() {
    UIController.renderMemoryTower(this.words, this.progress, (tierLevel) => {
      const wordsInTier = this.words.filter(w => (this.progress[w.id]?.level || 1) === tierLevel);
      UIController.showTierWordsModal(tierLevel, wordsInTier, this.progress);
    });

    const queueData = SRSEngine.getReviewQueue(this.words, this.progress);
    const nextTime = SRSEngine.getNextReviewCountdown(this.words, this.progress);
    UIController.startGoldenTimer(nextTime, queueData.isGoldenTime);
  }

  startReviewSession(wordsPool) {
    const queueData = SRSEngine.getReviewQueue(wordsPool, this.progress);
    const quiz = new QuizController(
      queueData.words,
      queueData.isGoldenTime,
      (results, isGoldenTime, totalSecs) => this.onFinishSession(results, isGoldenTime, totalSecs)
    );
    quiz.start();
  }

  onFinishSession(sessionResults, isGoldenTime, totalSecs) {
    let correctCount = 0;
    sessionResults.forEach(res => {
      if (res.isCorrect) correctCount++;
      const currentProg = this.progress[res.wordId];
      this.progress[res.wordId] = SRSEngine.calculateNextReview(currentProg, res.isCorrect);
    });

    StorageManager.saveWordProgress(this.progress);

    const earnedXP = correctCount * (isGoldenTime ? 15 : 10);
    this.user.xp += earnedXP;
    StorageManager.saveUser(this.user);
    StorageManager.recordTodayCheckin();
    this.renderWeeklyStreak();

    const sessionCount = StorageManager.incrementSessionCount();
    const mm = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const ss = String(totalSecs % 60).padStart(2, '0');
    const speedStr = `${mm}:${ss}`;

    // Lưu đám mây Drive
    StorageManager.sendSessionToCloud({
      studentName: this.user.name,
      studentEmail: this.user.email,
      sessionData: {
        sessionNumber: sessionCount,
        score: correctCount,
        totalWords: sessionResults.length,
        duration: speedStr,
        details: sessionResults
      }
    });

    this.updateUserStatsUI();
    document.getElementById('quizContainer').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');

    // HIỂN THỊ POP-UP KẾT QUẢ 3 CHỈ SỐ LỚN (ĐÃ LƯU, ĐIỂM KN, TỐC ĐỘ)
    this.showResultPopup(correctCount, sessionResults.length, earnedXP, speedStr);
    this.refreshDashboard();
  }

  showResultPopup(correct, total, xp, speedStr) {
    let existing = document.getElementById('sessionResultModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'sessionResultModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="result-modal-card">
        <div class="result-celebrate-icon">🎉</div>
        <h2>Tuyệt vời!</h2>
        <div class="result-subtitle">Bạn vừa hoàn thành một phiên luyện từ vựng xuất sắc</div>

        <div class="result-stats-grid">
          <div class="result-stat-box">
            <div class="stat-val">${correct}/${total}</div>
            <div class="stat-lbl">ĐÃ LƯU</div>
          </div>
          <div class="result-stat-box">
            <div class="stat-val" style="color: #f59e0b;">+${xp}</div>
            <div class="stat-lbl">ĐIỂM KN</div>
          </div>
          <div class="result-stat-box">
            <div class="stat-val" style="color: #10b981;">${speedStr}</div>
            <div class="stat-lbl">TỐC ĐỘ</div>
          </div>
        </div>

        <button class="btn-result-finish" id="btnFinishPopup">TIẾP TỤC</button>
      </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('btnFinishPopup').onclick = () => modal.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
