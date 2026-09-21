import { getAllSubmissions } from './db-pl.js';

export async function exportReport() {
  const subs = await getAllSubmissions();
  if (subs.length === 0) {
    alert("Chưa có bài tập nào được nộp để xuất báo cáo!");
    return;
  }

  let text = `📋 BÁO CÁO TIẾN ĐỘ PRE-LISTENING (ELLLO)\n`;
  text += `Thời gian xuất: ${new Date().toLocaleString("vi-VN")}\n`;
  text += `Tổng số bài đã hoàn thành: ${subs.length}\n`;
  text += `--------------------------------------------------\n\n`;

  subs.forEach((s, idx) => {
    text += `${idx + 1}. [PRE-LISTENING - ${s.level}] ID: ${s.id}\n`;
    text += `   - Điểm số: ${s.correct}/${s.total} (${Math.round((s.correct / s.total) * 100)}%)\n`;
    text += `   - Câu sai: ${s.wrongNotes}\n`;
    text += `   - Ảnh chi tiết câu sai: ${s.wrongProofs ? s.wrongProofs.length : 0} ảnh\n`;
    text += `   - Ảnh Full bài làm: ${s.fullProof ? 'Đã tải lên' : 'Chưa có'}\n`;
    text += `   - Thời gian nộp: ${s.timestamp}\n\n`;
  });

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head><title>Báo Cáo Pre-Listening</title></head>
      <body style="font-family: monospace; padding: 24px; white-space: pre-wrap; background: #f8fafc; font-size: 13.5px; line-height: 1.5;">${text}</body>
    </html>
  `);
  win.document.close();
}
