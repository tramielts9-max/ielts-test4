export const SRSEngine = {
  // Khoảng cách giờ của 5 Hũ
  INTERVALS: {
    1: 2,    // Hũ 1: 2 giờ
    2: 24,   // Hũ 2: 1 ngày
    3: 72,   // Hũ 3: 3 ngày
    4: 168,  // Hũ 4: 7 ngày
    5: 720   // Hũ 5: 30 ngày (Master dài hạn)
  },

  calculateNextReview(currentProgress, isCorrect) {
    const now = Date.now();
    let level = currentProgress ? currentProgress.level : 1;

    if (isCorrect) {
      level = Math.min(5, level + 1);
    } else {
      level = 1; // Sai rớt thẳng về Hũ 1
    }

    const intervalHours = this.INTERVALS[level];
    const nextReviewAt = now + intervalHours * 60 * 60 * 1000;

    return {
      level,
      intervalHours,
      lastReviewedAt: now,
      nextReviewAt,
      consecutiveCorrect: isCorrect ? ((currentProgress?.consecutiveCorrect || 0) + 1) : 0
    };
  },

  getReviewQueue(allWords, wordProgress) {
    const now = Date.now();
    return allWords.filter(word => {
      const prog = wordProgress[word.id];
      if (!prog) return true;
      return prog.nextReviewAt <= now;
    });
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
