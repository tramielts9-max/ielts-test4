import { StorageManager } from './storage-v.js';
import { SRSEngine } from './srs-engine-v.js';
import { BotsSimulation } from './bots-simulation-v.js';
import { QuizController } from './quiz-v.js';
import { UIController } from './ui-v.js';

class App {
  constructor() {
    this.courses = [];
    this.currentCourse = null;
    this.currentCourseId = localStorage.getItem('sv_active_course_id') || 'course_ielts_300';
    this.activeTab = 'ontap';
    this.user = StorageManager.getUser();
    this.progress = StorageManager.getWordProgress(this.user.email);
    this.leaderboard = StorageManager.getLeaderboard();
    this.currentWordsPool = [];
  }

async init() {
    try {
      const resCourses = await fetch('data-v/courses-v.json');
      this.courses = await resCourses.json();
      this.currentCourse = this.courses.find(c => c.id === this.currentCourseId) || this.courses[0];
      
      // Mặc định nạp toàn bộ từ của khóa học hiện tại
      await this.loadAllWordsForCurrentCourse();
    } catch (e) {
      alert("Không thể tải danh sách khóa học!");
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

    // 🌟 SỰ KIỆN ĐỔI KHÓA HỌC (300 TỪ <-> 540 TỪ) NẰM Ở ĐÂY:
    const courseDropdown = document.getElementById('courseSelectorDropdown');
    if (courseDropdown) {
      courseDropdown.value = this.currentCourse.id;
      courseDropdown.onchange = async (e) => {
        const selectedId = e.target.value;
        this.currentCourse = this.courses.find(c => c.id === selectedId) || this.courses[0];
        localStorage.setItem('sv_active_course_id', this.currentCourse.id);
        await this.loadAllWordsForCurrentCourse();
        this.renderRoadmap();
        this.refreshDashboard();
      };
    }

    document.getElementById('btnStartReview').onclick = () => this.startReviewSession(this.currentWordsPool);

    setInterval(() => {
      this.leaderboard = BotsSimulation.simulateBotProgress(this.leaderboard, this.user.xp);
      StorageManager.saveLeaderboard(this.leaderboard);
      UIController.renderLeaderboard(this.leaderboard, 'me');
    }, 15000);
  }

  async loadAllWordsForCurrentCourse() {
    const promises = this.currentCourse.lessons.map(async (lesson) => {
      try {
        const res = await fetch(`data-v/${lesson.file}`);
        return await res.json();
      } catch (err) {
        return [];
      }
    });
    const results = await Promise.all(promises);
    this.currentWordsPool = results.flat();
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
        <div class="lesson-card ${isStart ? 'active-start' : ''}" onclick="window.startUnitLesson('${lesson.file}')">
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

    window.startUnitLesson = async (fileName) => {
      try {
        const res = await fetch(`data-v/${fileName}`);
        const unitWords = await res.json();
        this.startReviewSession(unitWords);
      } catch (e) {
        alert("Không thể tải bài học: " + fileName);
      }
    };
  }

  renderSotay() {
    UIController.renderMemoryTower(this.currentWordsPool, this.progress, (tierLevel) => {
      const wordsInTier = this.currentWordsPool.filter(w => (this.progress[w.id]?.level || 1) === tierLevel);
      UIController.showTierWordsModal(tierLevel, wordsInTier, this.progress);
    });
  }

  renderWeeklyStreak() {
    const checkedDays = StorageManager.getWeekCheckin(this.user.email);
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
    this.progress = StorageManager.getWordProgress(this.user.email);
    UIController.renderMemoryTower(this.currentWordsPool, this.progress, (tierLevel) => {
      const wordsInTier = this.currentWordsPool.filter(w => (this.progress[w.id]?.level || 1) === tierLevel);
      UIController.showTierWordsModal(tierLevel, wordsInTier, this.progress);
    });

    const queueData = SRSEngine.getReviewQueue(this.currentWordsPool, this.progress);
    const nextTime = SRSEngine.getNextReviewCountdown(this.currentWordsPool, this.progress);
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
      const nextLvl = SRSEngine.calculateNextReview(currentProg, res.isCorrect);
      
      // Ghi log chi tiết ngày, giờ, số lần bấm theo từng email
      this.progress = StorageManager.recordWordReview(this.user.email, res.wordId, res.isCorrect, nextLvl);
    });

    const earnedXP = correctCount * (isGoldenTime ? 15 : 10);
    this.user.xp += earnedXP;
    StorageManager.saveUser(this.user);
    StorageManager.recordTodayCheckin(this.user.email);
    this.renderWeeklyStreak();

    const sessionCount = StorageManager.incrementSessionCount(this.user.email);
    const mm = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const ss = String(totalSecs % 60).padStart(2, '0');
    const speedStr = `${mm}:${ss}`;

    // Lưu đám mây Drive chi tiết kèm lịch sử học
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
