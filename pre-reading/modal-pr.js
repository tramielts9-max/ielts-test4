import { getSubmission, saveSubmission } from './db-pr.js';

let activeLessonId = null;
let currentLevel = 'A1';
let tempWrongImages = [];
let tempFullImage = null;
let onSaveCallback = null;
let currentPasteTarget = 'wrong'; // 'wrong' hoặc 'full'

export function initModal(onSaved) {
  onSaveCallback = onSaved;

  document.getElementById('mWrongImgs').addEventListener('change', (e) => {
    handleFileSelect(Array.from(e.target.files), 'wrong');
  });

  document.getElementById('mFullImg').addEventListener('change', (e) => {
    if (e.target.files[0]) {
      handleFileSelect([e.target.files[0]], 'full');
    }
  });

  const zoneWrong = document.getElementById('pasteZoneWrong');
  const zoneFull = document.getElementById('pasteZoneFull');

  zoneWrong.addEventListener('click', () => setPasteTarget('wrong'));
  zoneFull.addEventListener('click', () => setPasteTarget('full'));

  // LẮNG NGHE CTRL + V TOÀN CỤC KHI MODAL ĐANG MỞ
  window.addEventListener('paste', (e) => {
    const modal = document.getElementById('submitModal');
    if (modal.classList.contains('hidden')) return;

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let foundImage = false;

    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        foundImage = true;
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          if (currentPasteTarget === 'wrong') {
            tempWrongImages.push(event.target.result);
            renderWrongPreview();
          } else {
            tempFullImage = event.target.result;
            renderFullPreview();
          }
        };
        reader.readAsDataURL(blob);
      }
    }

    if (foundImage) {
      e.preventDefault();
    }
  });

  window.removeWrongImgPR = (idx) => {
    tempWrongImages.splice(idx, 1);
    renderWrongPreview();
  };

  window.removeFullImgPR = () => {
    tempFullImage = null;
    renderFullPreview();
  };

  window.closeModalPR = () => closeModal();
  window.submitFormPR = () => handleSave();
}

function setPasteTarget(target) {
  currentPasteTarget = target;
  const zoneWrong = document.getElementById('pasteZoneWrong');
  const zoneFull = document.getElementById('pasteZoneFull');

  if (target === 'wrong') {
    zoneWrong.classList.add('active-paste');
    zoneFull.classList.remove('active-paste');
  } else {
    zoneFull.classList.add('active-paste');
    zoneWrong.classList.remove('active-paste');
  }
}

function handleFileSelect(files, target) {
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (target === 'wrong') {
        tempWrongImages.push(event.target.result);
        renderWrongPreview();
      } else {
        tempFullImage = event.target.result;
        renderFullPreview();
      }
    };
    reader.readAsDataURL(file);
  });
}

export async function openModal(id, title, level) {
  activeLessonId = id;
  currentLevel = level;
  document.getElementById('mTitle').innerText = title;
  document.getElementById('mLevel').innerText = `READING - ${level}`;

  document.getElementById('mCorrect').value = '';
  document.getElementById('mTotal').value = '';
  document.getElementById('mWrongList').value = '';
  document.getElementById('mWrongImgs').value = '';
  document.getElementById('mFullImg').value = '';
  document.getElementById('previewWrong').innerHTML = '';
  document.getElementById('previewFull').innerHTML = '';
  tempWrongImages = [];
  tempFullImage = null;

  setPasteTarget('full');

  const existing = await getSubmission(id);
  if (existing) {
    document.getElementById('mCorrect').value = existing.correct;
    document.getElementById('mTotal').value = existing.total;
    document.getElementById('mWrongList').value = existing.wrongNotes || '';
    if (existing.fullProof) {
      tempFullImage = existing.fullProof;
      renderFullPreview();
    }
    if (existing.wrongProofs && existing.wrongProofs.length > 0) {
      tempWrongImages = existing.wrongProofs;
      renderWrongPreview();
    }
  }

  document.getElementById('submitModal').classList.remove('hidden');
}

export function closeModal() {
  document.getElementById('submitModal').classList.add('hidden');
  activeLessonId = null;
}

function renderWrongPreview() {
  const container = document.getElementById('previewWrong');
  container.innerHTML = tempWrongImages.map((src, idx) => `
    <div class="relative w-16 h-16 rounded border overflow-hidden group shadow-sm bg-slate-50">
      <img src="${src}" class="w-full h-full object-cover">
      <button onclick="window.removeWrongImgPR(${idx})" class="absolute top-0 right-0 bg-rose-600 text-white w-4 h-4 text-[10px] flex items-center justify-center opacity-90 hover:opacity-100">&times;</button>
    </div>
  `).join('');
}

function renderFullPreview() {
  const container = document.getElementById('previewFull');
  if (!tempFullImage) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <div class="relative inline-block border rounded overflow-hidden shadow-sm mt-2">
      <img src="${tempFullImage}" class="h-28 object-contain bg-slate-100 rounded">
      <button onclick="window.removeFullImgPR()" class="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">&times;</button>
    </div>
  `;
}

async function handleSave() {
  const correct = document.getElementById('mCorrect').value.trim();
  const total = document.getElementById('mTotal').value.trim();
  const wrongNotes = document.getElementById('mWrongList').value.trim();

  if (correct === '' || total === '') {
    alert("⚠️ Vui lòng nhập số câu đúng và tổng số câu!");
    return;
  }
  if (!tempFullImage) {
    alert("⚠️ Bắt buộc phải tải hoặc dán (Ctrl+V) ảnh chụp FULL màn hình kết quả làm bài!");
    return;
  }

  const submission = {
    id: activeLessonId,
    skill: "reading",
    level: currentLevel,
    correct: parseInt(correct),
    total: parseInt(total),
    wrongNotes: wrongNotes || 'Không có',
    wrongProofs: tempWrongImages,
    fullProof: tempFullImage,
    timestamp: new Date().toLocaleString("vi-VN")
  };

  await saveSubmission(submission);
  closeModal();
  if (onSaveCallback) onSaveCallback();
}
