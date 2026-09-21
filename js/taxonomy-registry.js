/**
 * js/taxonomy-registry.js
 * SỔ CÁI ĐỊNH DANH, CẤP ĐỘ KHÓ VÀ TAG DẠNG BÀI TOÀN HỆ THỐNG
 */

export const TAXONOMY = {
  TIERS: {
    TIER_0: { label: "Mất Gốc", band: "0 - 4.0", color: "#64748b", bg: "#f1f5f9" },
    TIER_1: { label: "Nền Tảng", band: "4.5 - 5.5", color: "#0284c7", bg: "#e0f2fe" },
    TIER_2: { label: "Tiêu Chuẩn", band: "6.0 - 6.5", color: "#16a34a", bg: "#dcfce7" },
    TIER_3: { label: "Nâng Cao", band: "7.0 - 7.5", color: "#d97706", bg: "#fef3c7" },
    TIER_4: { label: "Chuyên Sâu", band: "8.0+", color: "#dc2626", bg: "#fee2e2" }
  },

  TAGS: {
    TFNG: { name: "True/False/Not Given", color: "#0284c7" },
    YNNG: { name: "Yes/No/Not Given", color: "#0369a1" },
    MATCH_HEADINGS: { name: "Matching Headings", color: "#7c3aed" },
    MATCH_INFO: { name: "Matching Information", color: "#9333ea" },
    MATCH_FEATURES: { name: "Matching Features", color: "#a855f7" },
    SUMMARY_COMP: { name: "Summary Completion", color: "#059669" },
    NOTE_COMP: { name: "Notes Completion", color: "#10b981" },
    TABLE_COMP: { name: "Table Completion", color: "#0d9488" },
    FLOW_CHART: { name: "Flow-chart Completion", color: "#0891b2" },
    MCQ: { name: "Trắc nghiệm Multiple Choice", color: "#ea580c" },
    FORM_COMP: { name: "Điền Form (Part 1)", color: "#0284c7" },
    MAP_PLAN: { name: "Bản đồ Map (Part 2)", color: "#d97706" },
    LECTURE_COMP: { name: "Bài giảng Lecture (Part 4)", color: "#dc2626" },
    TENSES: { name: "Thì Động Từ", color: "#0d9488" },
    CONDITIONALS: { name: "Câu Điều Kiện", color: "#059669" },
    PASSIVE_VOICE: { name: "Câu Bị Động", color: "#0284c7" }
  }
};

export const CENTRAL_REGISTRY = [
  // --- READING CAM 21 ---
  { id: "READ_CAM21_T1_P1", tier: "TIER_2", tags: ["NOTE_COMP", "TFNG"] },
  { id: "READ_CAM21_T1_P2", tier: "TIER_3", tags: ["MATCH_INFO", "SUMMARY_COMP"] },
  { id: "READ_CAM21_T1_P3", tier: "TIER_3", tags: ["MCQ", "YNNG"] },
  { id: "READ_CAM21_T2_P1", tier: "TIER_2", tags: ["TFNG", "FLOW_CHART"] },
  { id: "READ_CAM21_T2_P2", tier: "TIER_3", tags: ["MATCH_HEADINGS"] },
  { id: "READ_CAM21_T2_P3", tier: "TIER_3", tags: ["MCQ", "SUMMARY_COMP"] },
  { id: "READ_CAM21_T3_P1", tier: "TIER_2", tags: ["NOTE_COMP", "TFNG"] },
  { id: "READ_CAM21_T3_P2", tier: "TIER_2", tags: ["TFNG", "NOTE_COMP"] },
  { id: "READ_CAM21_T3_P3", tier: "TIER_3", tags: ["MCQ", "YNNG"] },
  { id: "READ_CAM21_T4_P1", tier: "TIER_2", tags: ["TFNG", "FLOW_CHART"] },
  { id: "READ_CAM21_T4_P2", tier: "TIER_3", tags: ["SUMMARY_COMP", "YNNG"] },
  { id: "READ_CAM21_T4_P3", tier: "TIER_3", tags: ["SUMMARY_COMP", "MCQ"] },

  // --- READING CAM 20 ---
  { id: "READ_CAM20_T1_P1", tier: "TIER_1", tags: ["NOTE_COMP", "TFNG"] },
  { id: "READ_CAM20_T1_P2", tier: "TIER_2", tags: ["MATCH_INFO", "SUMMARY_COMP"] },
  { id: "READ_CAM20_T1_P3", tier: "TIER_3", tags: ["MCQ", "YNNG"] },
  { id: "READ_CAM20_T2_P1", tier: "TIER_1", tags: ["TFNG"] },
  { id: "READ_CAM20_T2_P2", tier: "TIER_2", tags: ["MATCH_HEADINGS"] },
  { id: "READ_CAM20_T2_P3", tier: "TIER_3", tags: ["MCQ", "SUMMARY_COMP"] },

  // --- LISTENING CAM 21 ---
  { id: "LIS_CAM21_T1_P1", tier: "TIER_1", tags: ["FORM_COMP", "NOTE_COMP"] },
  { id: "LIS_CAM21_T1_P2", tier: "TIER_2", tags: ["MAP_PLAN", "MCQ"] },
  { id: "LIS_CAM21_T1_P3", tier: "TIER_3", tags: ["MCQ"] },
  { id: "LIS_CAM21_T1_P4", tier: "TIER_4", tags: ["LECTURE_COMP"] }
];

export function renderTagsHtml(id) {
  const item = CENTRAL_REGISTRY.find(x => x.id === id);
  if (!item) {
    return `
      <div style="display:flex; gap:6px; margin: 6px 0 8px 0; align-items:center;">
        <span style="font-family:monospace; font-size:11px; background:#1e293b; color:#ffffff; padding:2px 6px; border-radius:4px; font-weight:800;">${id}</span>
        <span style="font-size:11px; background:#f1f5f9; color:#64748b; padding:2px 6px; border-radius:4px; border:1px solid #cbd5e1;">Mặc định</span>
      </div>
    `;
  }

  const tier = TAXONOMY.TIERS[item.tier] || TAXONOMY.TIERS.TIER_2;
  let html = `
    <div style="display:flex; flex-wrap:wrap; gap:5px; align-items:center; margin: 6px 0 10px 0;">
      <span style="font-family:monospace; font-weight:800; font-size:11px; padding:2px 6px; border-radius:4px; background:#1e293b; color:#ffffff;">
        ${item.id}
      </span>
      <span style="font-weight:700; font-size:11px; padding:2px 7px; border-radius:12px; background:${tier.bg}; color:${tier.color}; border:1px solid ${tier.color};">
        ${tier.label} (${tier.band})
      </span>
  `;

  (item.tags || []).forEach(tagKey => {
    const t = TAXONOMY.TAGS[tagKey];
    if (t) {
      html += `
        <span style="font-weight:600; font-size:11px; padding:2px 6px; border-radius:4px; background:#f1f5f9; color:${t.color}; border:1px solid #cbd5e1;">
          🏷️ ${t.name}
        </span>
      `;
    }
  });

  html += `</div>`;
  return html;
}
