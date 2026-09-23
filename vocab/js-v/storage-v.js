export const StorageManager = {
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyNErQQFdciAQM0k9KUrACtpX7rxKkopjChYAC2Ubwj5MGzFOeekDEGs8C1n7P9cNR6vg/exec",

  getUser() {
    const studentEmail = (localStorage.getItem('ielts_student_email') || '').toLowerCase().trim();
    const studentName = localStorage.getItem('ielts_student_name') || 'Học viên';

    const userKey = studentEmail ? `sv_user_${studentEmail}` : 'sv_user_default';
    const raw = localStorage.getItem(userKey);

    if (raw) {
      const u = JSON.parse(raw);
      u.name = studentName || u.name;
      u.email = studentEmail || u.email;
      u.currentLeague = this.calculateRankTier(u.xp || 0);
      return u;
    }

    return {
      name: studentName,
      email: studentEmail,
      xp: 0,
      streak: 1,
      freezeCards: 1,
      streakGoal: 7,
      lastActiveDate: new Date().toISOString().slice(0, 10),
      currentLeague: 'Đồng 🥉'
    };
  },

  saveUser(user) {
    user.currentLeague = this.calculateRankTier(user.xp || 0);
    const userKey = user.email ? `sv_user_${user.email.toLowerCase().trim()}` : 'sv_user_default';
    localStorage.setItem(userKey, JSON.stringify(user));
  },

  calculateRankTier(xp) {
    if (xp >= 2000) return 'Kim Cương 👑';
    if (xp >= 1000) return 'Bạch Kim 💎';
    if (xp >= 500) return 'Vàng 🥇';
    if (xp >= 200) return 'Bạc 🥈';
    return 'Đồng 🥉';
  },

  // LƯU TIẾN TRÌNH THEO TỪNG EMAIL CỤ THỂ
  getProgressKey(email) {
    const cleanEmail = (email || localStorage.getItem('ielts_student_email') || 'default').toLowerCase().trim();
    return `sv_progress_${cleanEmail}`;
  },

  getWordProgress(email) {
    const raw = localStorage.getItem(this.getProgressKey(email));
    return raw ? JSON.parse(raw) : {};
  },

  /**
   * Lưu lại chi tiết từ: Cấp độ hũ trí nhớ, số lần đã bấm, mốc ngày giờ bấm chính xác
   */
  recordWordReview(email, wordId, isCorrect, levelInfo) {
    const progress = this.getWordProgress(email);
    const now = new Date();
    const dateStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')} - ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;

    if (!progress[wordId]) {
      progress[wordId] = {
        level: 1,
        totalReviews: 0,
        reviewHistory: []
      };
    }

    progress[wordId].level = levelInfo.level;
    progress[wordId].intervalHours = levelInfo.intervalHours;
    progress[wordId].lastReviewedAt = levelInfo.lastReviewedAt;
    progress[wordId].nextReviewAt = levelInfo.nextReviewAt;
    progress[wordId].totalReviews = (progress[wordId].totalReviews || 0) + 1;
    
    if (!progress[wordId].reviewHistory) progress[wordId].reviewHistory = [];
    progress[wordId].reviewHistory.push({
      reviewedAt: dateStr,
      timestamp: Date.now(),
      action: isCorrect ? "Đã nhớ (✓)" : "Chưa nhớ (✕)",
      toLevel: levelInfo.level
    });

    localStorage.setItem(this.getProgressKey(email), JSON.stringify(progress));
    return progress;
  },

  saveWordProgress(email, progress) {
    localStorage.setItem(this.getProgressKey(email), JSON.stringify(progress));
  },

  getWeekCheckin(email) {
    const cleanEmail = (email || localStorage.getItem('ielts_student_email') || 'default').toLowerCase().trim();
    const raw = localStorage.getItem(`sv_week_checkin_${cleanEmail}`);
    return raw ? JSON.parse(raw) : [];
  },

  recordTodayCheckin(email) {
    const cleanEmail = (email || localStorage.getItem('ielts_student_email') || 'default').toLowerCase().trim();
    const today = new Date().getDay();
    const list = this.getWeekCheckin(cleanEmail);
    if (!list.includes(today)) {
      list.push(today);
      localStorage.setItem(`sv_week_checkin_${cleanEmail}`, JSON.stringify(list));
    }
  },

  getSessionCount(email) {
    const cleanEmail = (email || localStorage.getItem('ielts_student_email') || 'default').toLowerCase().trim();
    return parseInt(localStorage.getItem(`sv_session_count_${cleanEmail}`) || '0', 10);
  },

  incrementSessionCount(email) {
    const count = this.getSessionCount(email) + 1;
    const cleanEmail = (email || localStorage.getItem('ielts_student_email') || 'default').toLowerCase().trim();
    localStorage.setItem(`sv_session_count_${cleanEmail}`, count.toString());
    return count;
  },

  getLeaderboard() {
    const raw = localStorage.getItem('sv_weekly_league_v');
    return raw ? JSON.parse(raw) : null;
  },

  saveLeaderboard(data) {
    localStorage.setItem('sv_weekly_league_v', JSON.stringify(data));
  },

  sendSessionToCloud(payload) {
    if (!this.GOOGLE_SCRIPT_URL) return;
    try {
      fetch(this.GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "save_vocab_session", ...payload })
      });
    } catch (e) {
      console.warn("Lỗi gửi dữ liệu lên Google Cloud:", e);
    }
  }
};
