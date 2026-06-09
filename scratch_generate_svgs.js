const fs = require('fs');
const path = require('path');
const { renderHeatmap, presets } = require('./dist/index.umd.js');

// Create scratch dir if not exists
const scratchDir = '/home/mlc/.gemini/antigravity-cli/brain/c5d664b9-cf6f-4fa1-aebb-3042193c163a/scratch';
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

// 1. Generate 24h Example
const mock24h = [];
const now = new Date('2026-06-09T12:00:00Z');
for (let d = 0; d < 7; d++) {
  for (let h = 0; h < 24; h++) {
    const timestamp = new Date(now);
    timestamp.setDate(now.getDate() - d);
    timestamp.setHours(h);
    // peak at 10am and 3pm
    let val = 0;
    if (h === 10) val = 15;
    else if (h === 15) val = 22;
    else if (h % 4 === 0) val = 5;
    mock24h.push({ timestamp, value: val });
  }
}
const p24h = presets.aggregate24h(mock24h, { startOfWeek: 1 });
const svg24h = renderHeatmap(p24h.data, {
  cols: p24h.cols,
  rows: p24h.rows,
  colorScheme: 'sky',
  colLabels: p24h.colLabels,
  colLabelInterval: 3,
  rowLabels: p24h.rowLabels,
  rowLabelInterval: 2,
  title: '24h Server Load Heatmap (Example)',
});
fs.writeFileSync(path.join(scratchDir, 'example_24h.svg'), svg24h);

// 2. Generate Month Example
const mockMonth = [];
for (let d = 1; d <= 30; d++) {
  const date = new Date(2026, 5, d); // June
  let val = d % 3 === 0 ? 12 : (d % 5 === 0 ? 18 : 2);
  mockMonth.push({ date, value: val });
}
const pMonth = presets.aggregateMonth(mockMonth, { year: 2026, month: 5, startOfWeek: 1 });
const svgMonth = renderHeatmap(pMonth.data, {
  cols: pMonth.cols,
  rows: pMonth.rows,
  colorScheme: 'coral',
  colLabels: pMonth.colLabels,
  rowLabels: pMonth.rowLabels,
  title: 'June 2026 Monthly Calendar Heatmap (Example)',
});
fs.writeFileSync(path.join(scratchDir, 'example_month.svg'), svgMonth);

// 3. Generate Year Example
const mockYear = [];
const start = new Date(2026, 0, 1);
const end = new Date(2026, 11, 31);
const curr = new Date(start);
while (curr <= end) {
  const day = curr.getDay();
  let val = 0;
  if (day !== 0 && day !== 6) {
    val = (curr.getDate() % 7 === 0) ? 14 : (curr.getDate() % 3 === 0 ? 6 : 1);
  }
  mockYear.push({ date: new Date(curr), value: val });
  curr.setDate(curr.getDate() + 1);
}
const pYear = presets.aggregateYear(mockYear, { year: 2026, startOfWeek: 1 });
const svgYear = renderHeatmap(pYear.data, {
  cols: pYear.cols,
  rows: pYear.rows,
  colorScheme: 'emerald',
  colLabels: pYear.colLabels,
  rowLabels: pYear.rowLabels,
  rowLabelInterval: 2,
  title: 'GitHub Contributions Year 2026 (Example)',
});
fs.writeFileSync(path.join(scratchDir, 'example_year.svg'), svgYear);

console.log('Examples generated successfully.');
