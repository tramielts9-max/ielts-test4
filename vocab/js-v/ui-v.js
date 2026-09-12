export const UIController = {
  renderMemoryTower(allWords, wordProgress, onTierClick) {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allWords.forEach(w => {
      const p = wordProgress[w.id];
      const lvl = p ? p.level : 1;
      counts[lvl]++;
    });

    for (let i = 1; i <= 5; i++) {
      const tierEl = document.getElementById(`towerT${i}`);
      if (tierEl) {
        tierEl.innerText = `${counts[i]} từ 👉`;
        const parentTier = tierEl.closest('.tower-tier');
        if (parentTier) {
          parentTier.onclick = () => onTierClick(i);
        }
      }
    }

    const total = allWords.length || 1;
    const retentionRate = Math.round(((counts[4] + counts[5]) / total) * 100);
    document.getElementById('retentionRateDisplay').innerText = `${retentionRate}%`;
  },

  showTierWordsModal(tierLevel, wordsInTier, wordProgress) {
    const tierNames = {
      1: "Tầng 1: Mới gặp (Cần ôn gấp)",
      2: "Tầng 2: Nhớ mang máng",
      3: "Tầng 3: Tạm nhớ",
      4: "Tầng 4: Ghi nhớ tốt",
      5: "Tầng 5: Dài hạn (Master)"
    };

    let existing = document.getElementById('tierWordsModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'tierWordsModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3>📚 ${tierNames[tierLevel]} (${wordsInTier.length} từ)</h3>
          <button class="btn-close-modal" id="btnCloseTierModal">&times;</button>
        </div>
        <div class="modal-body">
          ${wordsInTier.length === 0 ? '<div style="text-align:center; padding:20px; color:var(--text-muted);">Chưa có từ nào ở tầng này!</div>' : ''}
          ${wordsInTier.map(w => {
            const p = wordProgress[w.id];
            const nextReviewStr = p ? new Date(p.nextReviewAt).toLocaleString("vi-VN") : "Chưa học";
            return `
              <div class="word-tier-item">
                <div>
                  <div style="font-weight: 800; font-size: 16px; color: var(--primary);">${w.word} <span style="font-size: 13px; font-weight: normal; color: var(--text-muted);">${w.phonetic}</span></div>
                  <div style="font-size: 13.5px; margin-top: 2px;">${w.meaning}</div>
                </div>
                <div style="text-align: right; font-size: 12px; color: var(--text-muted);">
                  <div>Ôn tiếp theo:</div>
                  <b style="color: #334155;">${nextReviewStr}</b>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('btnCloseTierModal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
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

  startGoldenTimer(nextTime, hasDueWords) {
    const timerDisplay = document.getElementById('goldenCountdown');
    const reviewBtn = document.getElementById('btnStartReview');

    if (window._timerInterval) clearInterval(window._timerInterval);

    const update = () => {
      // 🌟 HỌC SINH LUÔN BẤM ĐƯỢC NÚT (KHÔNG BAO GIỜ BỊ DISABLED)
      reviewBtn.disabled = false;

      if (hasDueWords || !nextTime || nextTime <= Date.now()) {
        timerDisplay.innerText = "00:00:00";
        reviewBtn.style.background = "#f59e0b"; // Nổi bật màu vàng cảnh báo
        reviewBtn.innerText = "🚨 ĐẾN GIỜ VÀNG - CỨU TỪ NGAY!";
      } else {
        reviewBtn.style.background = "var(--primary)";
        reviewBtn.innerText = "⚡ LUYỆN TẬP TỰ DO (HỌC KHÔNG GIỚI HẠN)";
        const diff = nextTime - Date.now();
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
