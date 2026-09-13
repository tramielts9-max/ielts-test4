export const StorageManager = {
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyNErQQFdciAQM0k9KUrACtpX7rxKkopjChYAC2Ubwj5MGzFOeekDEGs8C1n7P9cNR6vg/exec",

  KEYS: {
    USER: 'sv_user_data_v',
    PROGRESS: 'sv_word_progress_v',
    LEADERBOARD: 'sv_weekly_league_v',
    SESSION_COUNT: 'sv_total_sessions_count_v',
    WEEK_CHECKIN: 'sv_week_checkin_history_v'
  },

  getUser() {
    const raw = localStorage.getItem(this.KEYS.USER);
    const studentName = localStorage.getItem('ielts_student_name') || 'Học viên';
    const studentEmail = localStorage.getItem('ielts_student_email') || '';

    if (raw) {
      const u = JSON.parse(raw);
      if (!u.email && studentEmail) u.email = studentEmail;
      if (u.name === 'Bạn (Học viên)' && studentName) u.name = studentName;
      u.currentLeague = this.calculateRankTier(u.xp);
      return u;
    }

    return {
      name: studentName,
      email: studentEmail,
      xp: 0,
      streak: 1,
      freezeCards: 1,
      streakGoal: 7, // Mục tiêu 7 ngày
      lastActiveDate: new Date().toISOString().slice(0, 10),
      currentLeague: 'Đồng'
    };
  },

  calculateRankTier(xp) {
    if (xp >= 2000) return 'Kim Cương 👑';
    if (xp >= 1000) return 'Bạch Kim 💎';
    if (xp >= 500) return 'Vàng 🥇';
    if (xp >= 200) return 'Bạc 🥈';
    return 'Đồng 🥉';
  },

  saveUser(user) {
    user.currentLeague = this.calculateRankTier(user.xp);
    localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
  },

  getWeekCheckin() {
    const raw = localStorage.getItem(this.KEYS.WEEK_CHECKIN);
    return raw ? JSON.parse(raw) : [];
  },

  recordTodayCheckin() {
    const today = new Date().getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
    const list = this.getWeekCheckin();
    if (!list.includes(today)) {
      list.push(today);
      localStorage.setItem(this.KEYS.WEEK_CHECKIN, JSON.stringify(list));
    }
  },

  getSessionCount() {
    return parseInt(localStorage.getItem(this.KEYS.SESSION_COUNT) || '0', 10);
  },

  incrementSessionCount() {
    const count = this.getSessionCount() + 1;
    localStorage.setItem(this.KEYS.SESSION_COUNT, count.toString());
    return count;
  },

  getWordProgress() {
    const raw = localStorage.getItem(this.KEYS.PROGRESS);
    return raw ? JSON.parse(raw) : {};
  },

  saveWordProgress(progress) {
    localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(progress));
  },

  getLeaderboard() {
    const raw = localStorage.getItem(this.KEYS.LEADERBOARD);
    return raw ? JSON.parse(raw) : null;
  },

  saveLeaderboard(data) {
    localStorage.setItem(this.KEYS.LEADERBOARD, JSON.stringify(data));
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
      console.warn("Lỗi gửi dữ liệu lên Google Drive:", e);
    }
  }
};
