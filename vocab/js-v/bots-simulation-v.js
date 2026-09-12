const BOT_NAMES = [
  "Minh Tuấn", "Phương Thảo", "Hoàng Nam", "Lan Anh", "Văn Đức",
  "Thu Trang", "Quốc Bảo", "Mai Hương", "Hải Đăng", "Bích Ngọc",
  "Tiến Dũng", "Khánh Linh", "Quang Huy", "Ngọc Ánh", "Gia Hưng",
  "Thanh Hằng", "Đức Anh", "Mỹ Tâm", "Trọng Hiếu", "Thùy Chi",
  "Tuấn Kiệt", "Bảo Châu", "Việt Hoàng", "Hồng Nhung", "Thành Long",
  "Diệu Linh", "Anh Khoa", "Kim Ngân", "Đình Trọng"
];

export const BotsSimulation = {
  initLeague(user) {
    const bots = BOT_NAMES.map((name, index) => {
      const type = index < 6 ? 'hardworking' : (index < 20 ? 'average' : 'lazy');
      const baseXP = type === 'hardworking' ? 120 : (type === 'average' ? 50 : 15);
      return {
        id: `bot_${index}`,
        name,
        avatar: '🤖',
        xp: baseXP + Math.floor(Math.random() * 20),
        isBot: true,
        type
      };
    });

    const userEntry = {
      id: 'me',
      name: user.name,
      avatar: '⭐',
      xp: user.xp,
      isBot: false
    };

    return [...bots, userEntry];
  },

  simulateBotProgress(leaderboard, userXP) {
    const updated = leaderboard.map(member => {
      if (!member.isBot) {
        return { ...member, xp: userXP };
      }
      const chance = member.type === 'hardworking' ? 0.7 : (member.type === 'average' ? 0.4 : 0.15);
      if (Math.random() < chance) {
        const gain = Math.floor(Math.random() * 15) + 5;
        return { ...member, xp: member.xp + gain };
      }
      return member;
    });

    return updated.sort((a, b) => b.xp - a.xp);
  }
};
