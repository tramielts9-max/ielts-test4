export const UIController = {
  renderMemoryTower(allWords, wordProgress) {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allWords.forEach(w => {
      const p = wordProgress[w.id];
      const lvl = p ? p.level : 1;
      counts[lvl]++;
    });

    document.getElementById('towerT1').innerText = `${counts[1]} từ`;
    document.getElementById('towerT2').innerText = `${counts[2]} từ`;
    document.getElementById('towerT3').innerText = `${counts[3]} từ`;
    document.getElementById('towerT4').innerText = `${counts[4]} từ`;
    document.getElementById('towerT5').innerText = `${counts[5]} từ`;

    const total = allWords.length || 1;
    const retentionRate = Math.round(((counts[4] + counts[5]) / total) * 100);
    document.getElementById('retentionRateDisplay').innerText = `${retentionRate}%`;
  },

  renderLeaderboard(members, currentUserId = 'me') {
    const listEl = document.getElementById('leaderboardList');
    if (!listEl) return;

    listEl.innerHTML = members.map((m, index) => {
      const rank = index + 1;
      let zoneClass = '';
      if (rank <= 5) zoneClass = 'promote-zone';
      else if (rank > 25) zoneClass = 'demote-zone';

      const isMe = (m.id === currentUserId) ? 'user-me' : '';

      return `
        <div class="leaderboard-row ${zoneClass} ${isMe}">
          <div class="rank-num">${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}</div>
          <div class="user-avatar">${m.avatar}</div>
          <div class="user-info">
            <div style="font-weight: 700;">${m.name} ${m.isBot ? '' : '(Bạn)'}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${rank <= 5 ? '🟢 Thăng hạng' : (rank > 25 ? '🔴 Nguy cơ rớt' : '⚪ Giữ hạng')}</div>
          </div>
          <div class="user-xp">${m.xp} XP</div>
        </div>
      `;
    }).join('');
  },

  startGoldenTimer(nextTime, onDue) {
    const timerDisplay = document.getElementById('goldenCountdown');
    const reviewBtn = document.getElementById('btnStartReview');

    if (window._timerInterval) clearInterval(window._timerInterval);

    const update = () => {
      if (!nextTime) {
        timerDisplay.innerText = "00:00:00";
        reviewBtn.disabled = false;
        reviewBtn.innerText = "⚡ ÔN TẬP NGAY (TẤT CẢ TỪ ĐÃ SẴN SÀNG)";
        return;
      }

      const diff = nextTime - Date.now();
      if (diff <= 0) {
        timerDisplay.innerText = "00:00:00";
        reviewBtn.disabled = false;
        reviewBtn.innerText = "⚡ ĐÃ ĐẾN GIỜ VÀNG - ÔN TẬP NGAY!";
        clearInterval(window._timerInterval);
        if (onDue) onDue();
      } else {
        reviewBtn.disabled = true;
        reviewBtn.innerText = "⏳ ĐANG TRONG THỜI GIAN GHI NHỚ";
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        timerDisplay.innerText = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      }
    };

    update();
    window._timerInterval = setInterval(update, 1000);
  }
};
