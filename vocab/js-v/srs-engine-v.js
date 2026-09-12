export const SRSEngine = {
  INTERVALS: {
    1: 2,    // Hũ 1: 2 giờ
    2: 24,   // Hũ 2: 1 ngày
    3: 72,   // Hũ 3: 3 ngày
    4: 168,  // Hũ 4: 7 ngày
    5: 720   // Hũ 5: 30 ngày
  },

  calculateNextReview(currentProgress, isCorrect) {
    const now = Date.now();
    let level = currentProgress ? currentProgress.level : 1;

    if (isCorrect) {
      level = Math.min(5, level + 1);
    } else {
      level = 1; // Sai là rơi thẳng về hũ 1
    }

    const intervalHours = this.INTERVALS[level];
    const nextReviewAt = now + intervalHours * 60 * 60 * 1000;

    return {
      level,
      intervalHours,
      lastReviewedAt: now,
      nextReviewAt,
      consecutiveCorrect: isCorrect ? ((currentProgress?.consecutiveCorrect || 0) + 1) : 0,
      totalReviews: (currentProgress?.totalReviews || 0) + 1
    };
  },

  /**
   * Lấy danh sách từ để học (Ưu tiên từ Giờ Vàng đến hạn -> Nếu không có thì lấy toàn bộ từ để học tự do)
   */
  getReviewQueue(allWords, wordProgress) {
    const now = Date.now();
    // 1. Tìm các từ đã đến hạn Thời Điểm Vàng
    const dueWords = allWords.filter(word => {
      const prog = wordProgress[word.id];
      return !prog || prog.nextReviewAt <= now;
    });

    if (dueWords.length > 0) {
      return { words: dueWords, isGoldenTime: true };
    }

    // 2. Nếu chưa có từ nào đến hạn: Cho phép học KHÔNG GIỚI HẠN (Luyện tập tự do)
    // Sắp xếp ưu tiên các từ ở hũ thấp lên trước để luyện phản xạ
    const freePracticeWords = [...allWords].sort((a, b) => {
      const lvlA = wordProgress[a.id]?.level || 1;
      const lvlB = wordProgress[b.id]?.level || 1;
      return lvlA - lvlB;
    });

    return { words: freePracticeWords, isGoldenTime: false };
  },

  getNextReviewCountdown(allWords, wordProgress) {
    const now = Date.now();
    let minTime = Infinity;

    allWords.forEach(word => {
      const prog = wordProgress[word.id];
      if (prog && prog.nextReviewAt > now) {
        if (prog.nextReviewAt < minTime) {
          minTime = prog.nextReviewAt;
        }
      }
    });

    return minTime === Infinity ? null : minTime;
  }
};
