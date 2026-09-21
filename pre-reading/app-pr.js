import { initDB, getAllSubmissions } from './db-pr.js';
import { initModal, openModal } from './modal-pr.js';
import { exportReport } from './export-pr.js';

let readingData = {};
let currentLevel = 'A1';
const LEVELS = ["A1", "A2", "B1", "B1+", "B2", "C1"];

async function start() {
  await initDB();
  initModal(() => renderLessons());

  try {
    const res = await fetch('./data-pr.json');
    readingData = await res.json();
  } catch (err) {
    console.error("Lỗi đọc data-pr.json:", err);
  }

  buildLevelTabs();
  document.getElementById('searchInput').addEventListener('input', () => renderLessons());
  window.exportSummaryPR = exportReport;
  window.openSubmitModalPR = (id, title) => openModal(id, title, currentLevel);
}

function buildLevelTabs() {
  const container = document.getElementById('level-container');
  container.innerHTML = '';

  LEVELS.forEach(lvl => {
    const btn = document.createElement('button');
    const isActive = lvl === currentLevel;
    btn.className = `px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
      isActive 
        ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300' 
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`;
    btn.innerText = lvl;
    btn.onclick = () => {
      currentLevel = lvl;
      buildLevelTabs();
    };
    container.appendChild(btn);
  });

  renderLessons();
}

async function renderLessons() {
  const container = document.getElementById('lessonList');
  const search = document.getElementById('searchInput').value.toLowerCase();
  const lessons = readingData[currentLevel] || [];

  const allSubs = await getAllSubmissions();
  const subMap = new Map(allSubs.map(s => [s.id, s]));

  let completedCount = 0;
  let filtered = [];

  lessons.forEach((l, idx) => {
    const id = `reading_${currentLevel}_${idx}`;
    const sub = subMap.get(id);
    if (sub) completedCount++;
    if (l.title.toLowerCase().includes(search)) {
      filtered.push({ ...l, id, sub, index: idx + 1 });
    }
  });

  document.getElementById('progress-badge').innerText = `${completedCount}/${lessons.length} Đã nộp`;

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 font-medium">Không tìm thấy bài tập nào!</div>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isDone = !!item.sub;
    const scorePct = isDone && item.sub.total > 0 ? Math.round((item.sub.correct / item.sub.total) * 100) : 0;
    
    return `
      <div class="bg-white rounded-xl border ${isDone ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'} p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
              Bài ${item.index} • ${currentLevel}
            </span>
            ${isDone 
              ? `<span class="text-xs font-bold text-emerald-600 flex items-center gap-1"><i class="fa-solid fa-circle-check"></i> Đã nộp: ${item.sub.correct}/${item.sub.total} (${scorePct}%)</span>` 
              : `<span class="text-xs font-semibold text-slate-400"><i class="fa-regular fa-clock"></i> Chưa làm</span>`
            }
          </div>

          <h4 class="font-bold text-slate-800 text-sm mb-3 line-clamp-2 leading-snug">
            ${item.title}
          </h4>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
          <a href="${item.url}" target="_blank" class="flex-1 text-center py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1">
            Làm bài <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
          </a>
          <button onclick="window.openSubmitModalPR('${item.id}', '${item.title.replace(/'/g, "\\'")}')" class="flex-1 py-2 px-3 rounded-lg ${isDone ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-600 hover:bg-amber-700'} text-white text-xs font-bold shadow transition flex items-center justify-center gap-1">
            <i class="fa-solid ${isDone ? 'fa-pen-to-square' : 'fa-upload'}"></i> ${isDone ? 'Sửa điểm & ảnh' : 'Nộp kết quả'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.addEventListener('DOMContentLoaded', start);
