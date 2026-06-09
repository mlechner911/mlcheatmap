#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { renderHeatmap, presets } = require('../dist/index.umd.js');

// Parse CLI Arguments
const args = {};
process.argv.slice(2).forEach(val => {
  const parts = val.split('=');
  if (parts[0].startsWith('--')) {
    const key = parts[0].substring(2);
    args[key] = parts[1] || true;
  }
});

const presetType = args.preset || 'year';
const colorScheme = args.color || 'emerald';
const zeroColor = args['zero-color'] || undefined;
const angle = args.angle ? parseInt(args.angle, 10) : 30;
const labelPosition = args['label-pos'] || 'behind';
const shape = args.shape || 'prism';
const opacity = args.opacity ? parseFloat(args.opacity) : 1.0;
const animated = args.animated !== 'false' && args.animated !== '0' && args['no-animate'] === undefined;
const renderFlatZero = args['flat-zero'] !== 'false' && args['flat-zero'] !== '0' && args['no-flat-zero'] === undefined;
const outFile = args.out || 'output.svg';

// Ensure output directory exists
const outputDir = path.dirname(outFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`Generating heatmap: preset=${presetType}, color=${colorScheme}, angle=${angle}°, label-pos=${labelPosition}, shape=${shape}, opacity=${opacity}, animated=${animated}, flat-zero=${renderFlatZero}...`);

let dataPoints = [];
let options = {
  colorScheme,
  zeroColor,
  projectionAngle: angle,
  labelPosition,
  shape,
  opacity,
  animated,
  renderFlatZero,
  gridSize: 16,
  gap: 2,
  maxHeight: 40,
  showGrid: true,
  interactive: true
};

// Generate Mock Datasets
if (presetType === '24h') {
  const mock24h = [];
  const now = new Date('2026-06-09T12:00:00Z');
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const timestamp = new Date(now);
      timestamp.setDate(now.getDate() - d);
      timestamp.setHours(h);
      let val = 0;
      if (h === 10 || h === 15) val = Math.floor(Math.random() * 20) + 10;
      else if (h % 3 === 0) val = Math.floor(Math.random() * 8);
      mock24h.push({ timestamp, value: val });
    }
  }
  const p = presets.aggregate24h(mock24h, { startOfWeek: 1 });
  dataPoints = p.data;
  options = {
    ...options,
    cols: p.cols,
    rows: p.rows,
    colLabels: p.colLabels,
    colLabelInterval: 3,
    rowLabels: p.rowLabels,
    rowLabelInterval: 2,
    title: 'Hourly User Load (24h Preset)'
  };
} else if (presetType === '24h-single') {
  // 24 columns (hours), 1 row (day)
  dataPoints = [];
  const measurements = { 2: 12, 8: 42, 14: 85, 20: 32 };
  for (let h = 0; h < 24; h++) {
    const val = measurements[h] || 0;
    dataPoints.push({
      col: h,
      row: 0,
      value: val,
      label: `${h.toString().padStart(2, '0')}:00 — Value: ${val}`
    });
  }
  // Setup col labels for hours
  const colLabels = Array.from({ length: 24 }, (_, i) => {
    if (i % 6 === 0) {
      const suffix = i >= 12 ? 'PM' : 'AM';
      const hr = i % 12 === 0 ? 12 : i % 12;
      return `${hr}${suffix}`;
    }
    return '';
  });
  options = {
    ...options,
    cols: 24,
    rows: 1,
    colLabels,
    colLabelInterval: 1,
    rowLabels: ['Today'],
    rowLabelInterval: 1,
    gridSize: 22,
    gap: 3,
    maxHeight: 50,
    title: '24h Single-Day Timeline (4 Measurements)'
  };
} else if (presetType === '24h-double') {
  // 24 columns (hours), 2 rows (Series A and Series B)
  dataPoints = [];
  const seriesA = { 2: 12, 8: 42, 14: 85, 20: 32 };
  const seriesB = { 4: 25, 10: 60, 16: 90, 22: 45 };

  for (let h = 0; h < 24; h++) {
    // Series A (Row 0)
    const valA = seriesA[h] || 0;
    dataPoints.push({
      col: h,
      row: 0,
      value: valA,
      label: `Series A, ${h.toString().padStart(2, '0')}:00 — Value: ${valA}`
    });

    // Series B (Row 1)
    const valB = seriesB[h] || 0;
    dataPoints.push({
      col: h,
      row: 1,
      value: valB,
      label: `Series B, ${h.toString().padStart(2, '0')}:00 — Value: ${valB}`
    });
  }

  // Setup col labels for hours
  const colLabels = Array.from({ length: 24 }, (_, i) => {
    if (i % 6 === 0) {
      const suffix = i >= 12 ? 'PM' : 'AM';
      const hr = i % 12 === 0 ? 12 : i % 12;
      return `${hr}${suffix}`;
    }
    return '';
  });

  options = {
    ...options,
    cols: 24,
    rows: 2,
    colLabels,
    colLabelInterval: 1,
    rowLabels: ['Series A', 'Series B'],
    rowLabelInterval: 1,
    gridSize: 20,
    gap: 3,
    maxHeight: 50,
    title: '24h Dual-Series Timeline (2 Rows × 24 Hours)'
  };
} else if (presetType === '24h-triple') {
  // 24 columns (hours), 3 rows (Series A, Series B, Series C)
  dataPoints = [];

  for (let h = 0; h < 24; h++) {
    // Series A: Peak at 12:00
    const angleA = ((h - 6) / 12) * Math.PI;
    let valA = Math.round(Math.sin(angleA) * 20);

    // Series B: Peaks at 4:00 and 16:00
    const angleB = ((h - 4) / 6) * Math.PI;
    let valB = Math.round(Math.cos(angleB) * 18);

    // Series C: Evening peak at 20:00, night backup drop, gap at 4:00-6:00
    const angleC = ((h - 14) / 12) * Math.PI;
    let valC = Math.round(Math.sin(angleC) * 20);
    if (h >= 4 && h <= 6) valC = 0;

    dataPoints.push({
      col: h,
      row: 0,
      value: valA,
      label: `Series A (Users), ${h.toString().padStart(2, '0')}:00 — Value: ${valA}`
    });

    dataPoints.push({
      col: h,
      row: 1,
      value: valB,
      label: `Series B (Background), ${h.toString().padStart(2, '0')}:00 — Value: ${valB}`
    });

    dataPoints.push({
      col: h,
      row: 2,
      value: valC,
      label: `Series C (Network), ${h.toString().padStart(2, '0')}:00 — Value: ${valC}`
    });
  }

  // Setup col labels for hours
  const colLabels = Array.from({ length: 24 }, (_, i) => {
    if (i % 6 === 0) {
      const suffix = i >= 12 ? 'PM' : 'AM';
      const hr = i % 12 === 0 ? 12 : i % 12;
      return `${hr}${suffix}`;
    }
    return '';
  });

  options = {
    ...options,
    cols: 24,
    rows: 3,
    colLabels,
    colLabelInterval: 1,
    rowLabels: ['Users (A)', 'Background (B)', 'Network (C)'],
    rowLabelInterval: 1,
    gridSize: 18,
    gap: 3,
    maxHeight: 45,
    title: '24h Triple-Series Timeline (3 Rows × 24 Hours)'
  };
} else if (presetType === 'month') {
  const mockMonth = [];
  for (let d = 1; d <= 30; d++) {
    const date = new Date(2026, 5, d);
    const val = d % 3 === 0 ? 12 : (d % 7 === 0 ? 0 : 2);
    mockMonth.push({ date, value: val });
  }
  const p = presets.aggregateMonth(mockMonth, { year: 2026, month: 5, startOfWeek: 1 });
  dataPoints = p.data;
  options = {
    ...options,
    cols: p.cols,
    rows: p.rows,
    colLabels: p.colLabels,
    rowLabels: p.rowLabels,
    gridSize: 20,
    gap: 3,
    title: 'June 2026 Activity (Month Preset)'
  };
} else if (presetType === 'nulls') {
  const p = presets.nullsExample8x8();
  dataPoints = p.data;
  options = {
    ...options,
    cols: p.cols,
    rows: p.rows,
    colLabels: p.colLabels,
    rowLabels: p.rowLabels,
    gridSize: 24,
    gap: 3,
    maxHeight: 40,
    title: '8x8 Grid with Explicit Null Values (No Data)'
  };
} else {
  // Year
  const mockYear = [];
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 11, 31);
  const curr = new Date(start);
  while (curr <= end) {
    const day = curr.getDay();
    let val = 0;
    if (day !== 0 && day !== 6) {
      val = curr.getDate() % 5 === 0 ? 15 : (curr.getDate() % 2 === 0 ? 4 : 0);
    }
    mockYear.push({ date: new Date(curr), value: val });
    curr.setDate(curr.getDate() + 1);
  }
  const p = presets.aggregateYear(mockYear, { year: 2026, startOfWeek: 1 });
  dataPoints = p.data;
  options = {
    ...options,
    cols: p.cols,
    rows: p.rows,
    colLabels: p.colLabels,
    rowLabels: p.rowLabels,
    rowLabelInterval: 2,
    gridSize: 13,
    maxHeight: 25,
    title: 'Contributions Calendar (Year Preset)'
  };
}

// Apply command line overrides
if (args['grid-size']) options.gridSize = parseInt(args['grid-size'], 10);
if (args.gap) options.gap = parseInt(args.gap, 10);
if (args['max-height']) options.maxHeight = parseInt(args['max-height'], 10);

// Render SVG and write to file
try {
  const svg = renderHeatmap(dataPoints, options);
  fs.writeFileSync(outFile, svg);
  console.log(`Successfully wrote SVG to: ${outFile}`);
} catch (err) {
  console.error('Failed to render heatmap:', err.message);
  process.exit(1);
}
