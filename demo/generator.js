#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { renderHeatmap } = require('../dist/index.umd.js');
const { presets } = require('../dist/presets.umd.js');

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
const heightTicks = args['height-ticks'] ? parseInt(args['height-ticks'], 10) : undefined;
const heightSolid = args['height-solid'] !== 'false' && args['height-solid'] !== '0' && args['no-height-solid'] === undefined;
const interpolateColors = args['interpolate-colors'] === true || args['interpolate-colors'] === 'true' || args['interpolate-colors'] === '1' || args.gradient === true || args.gradient === 'true' || args.gradient === '1';
const triangulateMesh = args.triangulate !== 'false' && args.triangulate !== '0' && args['no-triangulate'] === undefined;
const useSvg2Mesh = args.svg2mesh === true || args.svg2mesh === 'true' || args.svg2mesh === '1';
const shading = args.shading !== 'false' && args.shading !== '0' && args['no-shading'] === undefined;

const outFile = args.out || 'output.svg';

// Ensure output directory exists
const outputDir = path.dirname(outFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`Generating heatmap: preset=${presetType}, color=${colorScheme}, angle=${angle}°, label-pos=${labelPosition}, shape=${shape}, opacity=${opacity}, animated=${animated}, flat-zero=${renderFlatZero}, height-ticks=${heightTicks}, height-solid=${heightSolid}, interpolate-colors=${interpolateColors}, triangulate=${triangulateMesh}, svg2mesh=${useSvg2Mesh}, shading=${shading}...`);

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
  interpolateColors,
  triangulateMesh,
  useSvg2Mesh,
  shading,
  gridSize: 16,
  gap: 2,
  maxHeight: 40,
  showGrid: true,
  interactive: true,
  heightGrid: heightTicks ? {
    ticks: heightTicks,
    solid: heightSolid
  } : undefined
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
} else if (presetType === '24h-gradient') {
  // 24 columns (hours), 4 rows (separated by empty rows for spacing)
  dataPoints = [];
  const rowsToUse = [0, 2, 4, 6];
  for (const r of rowsToUse) {
    const labelPrefix = r === 0 ? 'Flat Ribbon' : r === 2 ? 'Continuous Ribbon' : r === 4 ? 'Cylinder' : 'Prism (Box)';
    for (let h = 0; h < 24; h++) {
      const angle = (h / 24) * 2 * Math.PI - Math.PI / 2;
      const val = parseFloat((Math.sin(angle) * 5 + 5).toFixed(1));
      dataPoints.push({
        col: h,
        row: r,
        value: val,
        label: `${labelPrefix}, ${h.toString().padStart(2, '0')}:00 — Value: ${val}`
      });
    }
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
    rows: 7,
    colLabels,
    colLabelInterval: 1,
    rowLabels: ['Flat Ribbon', '', 'Continuous Ribbon', '', 'Cylinder', '', 'Prism (Box)'],
    rowLabelInterval: 1,
    gridSize: 22,
    gap: 3,
    maxHeight: 50,
    interpolateColors: true, // Force color interpolation/gradient on by default
    shape: (row) => {
      if (row === 0) return 'flatribbon';
      if (row === 2) return 'ribbon';
      if (row === 4) return 'cylinder';
      return 'prism';
    },
    title: '24h Timeline Gradient Demo (4 Shapes, Values 0 to 10)'
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
} else if (presetType === 'month-mesh') {
  const mockMonth = [];
  const year = 2026;
  const month = 5; // June
  for (let d = 1; d <= 30; d++) {
    const date = new Date(year, month, d);
    const val = Math.round(12 + 10 * Math.sin((d / 30) * Math.PI * 2 - Math.PI / 2));
    mockMonth.push({ date, value: val });
  }
  const gridMonth = presets.aggregateMonth(mockMonth, { year, month, startOfWeek: 1 });
  
  // Inject null values
  const firstDay = new Date(year, month, 1);
  const firstDayIndex = (firstDay.getDay() - 1 + 7) % 7;
  const nullDays = [12, 13, 14, 24];
  for (const d of nullDays) {
    const cellIndex = firstDayIndex + d - 1;
    const c = Math.floor(cellIndex / 7);
    const r = cellIndex % 7;
    const dateStr = `2026-06-${d.toString().padStart(2, '0')}`;
    gridMonth.setCell(c, r, null, `${dateStr} — No Data (Outage)`);
  }

  dataPoints = gridMonth.getData();
  options = {
    ...options,
    cols: gridMonth.cols,
    rows: gridMonth.rows,
    colLabels: gridMonth.colLabels,
    rowLabels: gridMonth.rowLabels,
    shape: 'mesh',
    gridSize: 24,
    gap: 0,
    maxHeight: 50,
    interpolateColors: true,
    title: 'June 2026 — 3D Surface Mesh Calendar (With Missing Data Holes)'
  };
} else if (presetType === 'sixmonths') {
  const mockSixMonths = [];
  const year = 2026;
  const startMonth = 0; // Jan
  const D_start = new Date(year, startMonth, 1);
  const D_end = new Date(year, startMonth + 6, 0); // End of June

  const current = new Date(D_start);
  let dayIndex = 0;
  while (current <= D_end) {
    for (let m = 0; m < 2; m++) {
      const angle = (dayIndex / 181) * 6 * Math.PI + (m * Math.PI / 4);
      let val = Math.round(Math.sin(angle) * 15);
      val += Math.floor(Math.random() * 11) - 5;
      if (val < -20) val = -20;
      if (val > 20) val = 20;

      const date = new Date(current);
      date.setHours(m === 0 ? 8 : 16);
      mockSixMonths.push({ date, value: val, measurement: m });
    }
    current.setDate(current.getDate() + 1);
    dayIndex++;
  }
  const p = presets.aggregateSixMonthsDouble(mockSixMonths, { year, startMonth, startOfWeek: 1 });
  dataPoints = p.data;
  options = {
    ...options,
    cols: p.cols,
    rows: p.rows,
    colLabels: p.colLabels,
    rowLabels: p.rowLabels,
    rowLabelInterval: 2,
    gridSize: 11,
    gap: 1,
    maxHeight: 25,
    title: 'Jan - Jun 2026 — 6-Month Dual Timeline (2 Measurements/Day)'
  };
} else if (presetType === 'mixed') {
  const mockMonth = [];
  const year = 2026;
  const month = 5; // June
  for (let d = 1; d <= 30; d++) {
    const date = new Date(year, month, d);
    const val = d % 3 === 0 ? 15 : (d % 5 === 0 ? -8 : 3);
    mockMonth.push({ date, value: val });
  }
  const p = presets.aggregateMonth(mockMonth, { year, month, startOfWeek: 1 });
  dataPoints = p.data;
  
  const shapes = ['prism', 'cylinder', 'ribbon', 'flatribbon'];
  const shapeFn = (r) => shapes[r % shapes.length];

  options = {
    ...options,
    cols: p.cols,
    rows: p.rows,
    colLabels: p.colLabels,
    rowLabels: p.rowLabels,
    shape: shapeFn,
    gridSize: 20,
    gap: 3,
    maxHeight: 40,
    title: 'June 2026 Monthly Tracker — Mixed Shapes per Series (Row)'
  };
} else if (presetType === 'multimonth') {
  const year = 2026;
  const startOfWeek = 1;

  // 1. Generate May 2026 events
  const mockMay = [];
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, 4, d); // May
    const val = d % 3 === 0 ? 15 : (d % 5 === 0 ? -10 : 5);
    mockMay.push({ date, value: val });
  }

  // 2. Generate June 2026 events
  const mockJune = [];
  for (let d = 1; d <= 30; d++) {
    const date = new Date(year, 5, d); // June
    const val = d % 4 === 0 ? 20 : (d % 3 === 0 ? -12 : 8);
    mockJune.push({ date, value: val });
  }

  // 3. Aggregate
  const gridMay = presets.aggregateMonth(mockMay, { year, month: 4, startOfWeek });
  const gridJune = presets.aggregateMonth(mockJune, { year, month: 5, startOfWeek });

  // Mixed shapes per row/series: Mon=prism, Tue=cylinder, Wed=ribbon, Thu=flatribbon...
  const shapes = ['prism', 'cylinder', 'ribbon', 'flatribbon'];
  const shapeFn = (r) => shapes[r % shapes.length];

  const groupOptions = {
    ...options,
    shape: shapeFn,
    wrapper: 'g',
  };

  // Render May (with row labels, no col labels)
  const svgMayG = gridMay.render({
    ...groupOptions,
    rowLabels: gridMay.rowLabels,
    colLabels: undefined,
  });

  // Render June (no row labels, with col labels)
  const svgJuneG = gridJune.render({
    ...groupOptions,
    rowLabels: undefined,
    colLabels: gridJune.colLabels,
  });

  // Calculate translation offset for June based on May columns
  const colsMay = gridMay.cols;
  const rad = ((options.projectionAngle || 30) * Math.PI) / 180;
  const dx = colsMay * ((options.gridSize || 20) + (options.gap || 3)) * Math.cos(rad);
  const dy = colsMay * ((options.gridSize || 20) + (options.gap || 3)) * Math.sin(rad);

  // Wrap June in a translated group
  const translatedJune = `<g transform="translate(${dx.toFixed(2)}, ${dy.toFixed(2)})">
    ${svgJuneG}
  </g>`;

  // Parse bounds from the rendered G elements to construct parent viewBox
  const matchMay = svgMayG.match(/data-min-x="([^"]+)" data-min-y="([^"]+)" data-width="([^"]+)" data-height="([^"]+)"/);
  const matchJune = svgJuneG.match(/data-min-x="([^"]+)" data-min-y="([^"]+)" data-width="([^"]+)" data-height="([^"]+)"/);

  let minX = -100;
  let maxX = 500;
  let minY = -100;
  let maxY = 400;

  if (matchMay && matchJune) {
    const minX_1 = parseFloat(matchMay[1]);
    const minY_1 = parseFloat(matchMay[2]);
    const width_1 = parseFloat(matchMay[3]);
    const height_1 = parseFloat(matchMay[4]);
    const maxX_1 = minX_1 + width_1;
    const maxY_1 = minY_1 + height_1;

    const minX_2 = parseFloat(matchJune[1]) + dx;
    const minY_2 = parseFloat(matchJune[2]) + dy;
    const width_2 = parseFloat(matchJune[3]);
    const height_2 = parseFloat(matchJune[4]);
    const maxX_2 = minX_2 + width_2;
    const maxY_2 = minY_2 + height_2;

    minX = Math.min(minX_1, minX_2);
    maxX = Math.max(maxX_1, maxX_2);
    minY = Math.min(minY_1, minY_2);
    maxY = Math.max(maxY_1, maxY_2);
  }

  const padding = options.padding || 20;
  const combinedWidth = (maxX - minX) + 2 * padding;
  const combinedHeight = (maxY - minY) + 2 * padding;
  const viewX = minX - padding;
  const viewY = minY - padding;

  const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX.toFixed(2)} ${viewY.toFixed(2)} ${combinedWidth.toFixed(2)} ${combinedHeight.toFixed(2)}" width="100%" height="100%">
    <text x="${(viewX + combinedWidth / 2).toFixed(2)}" y="${(viewY + padding * 0.7).toFixed(2)}" fill="#24292f" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">May &amp; June 2026 — Combined Multi-Month (Mixed Shapes &amp; G-Group Integration)</text>
    ${svgMayG}
    ${translatedJune}
  </svg>`;

  try {
    fs.writeFileSync(outFile, combinedSvg);
    console.log(`Successfully wrote combined multi-month SVG to: ${outFile}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to write combined SVG:', err.message);
    process.exit(1);
  }
  } else if (presetType === 'sixmonths-split') {
  const year = 2026;
  const startOfWeek = 1;

  // Generate 6 months of daily mock events (Jan - Jun)
  const mockSixMonthsSingle = [];
  const D_start = new Date(year, 0, 1);
  const D_end = new Date(year, 6, 0);

  const current = new Date(D_start);
  let dayIndex = 0;
  while (current <= D_end) {
    const angle = (dayIndex / 181) * 4 * Math.PI;
    let val = Math.round(Math.sin(angle) * 15);
    val += Math.floor(Math.random() * 11) - 5;
    if (val < -20) val = -20;
    if (val > 20) val = 20;

    mockSixMonthsSingle.push({ date: new Date(current), value: val });
    current.setDate(current.getDate() + 1);
    dayIndex++;
  }

  // Render combined multi-month
  const months = [0, 1, 2, 3, 4, 5];
  const groups = [];
  let accumulatedCols = 0;
  const spacerCols = 1;

  const gridSize = options.gridSize || 11;
  const gap = options.gap || 1;
  const rad = ((options.projectionAngle || 30) * Math.PI) / 180;
  const stepX = (gridSize + gap) * Math.cos(rad);
  const stepY = (gridSize + gap) * Math.sin(rad);

  let overallMinX = Infinity;
  let overallMaxX = -Infinity;
  let overallMinY = Infinity;
  let overallMaxY = -Infinity;

  for (let i = 0; i < months.length; i++) {
    const m = months[i];
    const mEvents = mockSixMonthsSingle.filter(ev => ev.date.getMonth() === m);
    const gridModel = presets.aggregateMonth(mEvents, { year, month: m, startOfWeek });

    const rowLabels = i === 0 ? gridModel.rowLabels : undefined;
    const colLabels = gridModel.colLabels;

    const mSvg = gridModel.render({
      ...options,
      wrapper: 'g',
      rowLabels,
      colLabels,
      title: undefined
    });

    const colOffset = accumulatedCols + i * spacerCols;
    const dx = colOffset * stepX;
    const dy = colOffset * stepY;

    const groupElement = `<g class="iso-month-block" data-month="${m}" transform="translate(${dx.toFixed(2)}, ${dy.toFixed(2)})">
      ${mSvg}
    </g>`;
    groups.push(groupElement);

    const match = mSvg.match(/data-min-x="([^"]+)" data-min-y="([^"]+)" data-width="([^"]+)" data-height="([^"]+)"/);
    if (match) {
      const minX = parseFloat(match[1]) + dx;
      const minY = parseFloat(match[2]) + dy;
      const width = parseFloat(match[3]);
      const height = parseFloat(match[4]);
      const maxX = minX + width;
      const maxY = minY + height;

      if (minX < overallMinX) overallMinX = minX;
      if (maxX > overallMaxX) overallMaxX = maxX;
      if (minY < overallMinY) overallMinY = minY;
      if (maxY > overallMaxY) overallMaxY = maxY;
    }

    accumulatedCols += gridModel.cols;
  }

  const padding = options.padding || 20;
  const combinedWidth = (overallMaxX - overallMinX) + 2 * padding;
  const combinedHeight = (overallMaxY - overallMinY) + 2 * padding;
  const viewX = overallMinX - padding;
  const viewY = overallMinY - padding;

  const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX.toFixed(2)} ${viewY.toFixed(2)} ${combinedWidth.toFixed(2)} ${combinedHeight.toFixed(2)}" width="100%" height="100%">
    <text x="${(viewX + combinedWidth / 2).toFixed(2)}" y="${(viewY + padding * 0.7).toFixed(2)}" fill="#24292f" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">Jan - Jun 2026 — 6-Month Split Timeline (1 Value/Day with Monthly Spacers)</text>
    ${groups.join('\n')}
  </svg>`;

  try {
    fs.writeFileSync(outFile, combinedSvg);
    console.log(`Successfully wrote combined split 6-month SVG to: ${outFile}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to write combined split SVG:', err.message);
    process.exit(1);
  }
} else if (presetType === 'mesh-terrain') {
  const cols = 24;
  const rows = 24;
  dataPoints = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cx = c - 11.5;
      const cy = r - 11.5;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const val = parseFloat((Math.sin(dist / 2.5) * 8 + Math.cos(cx / 3.0) * 4).toFixed(1));
      
      const lakeDist = Math.sqrt(Math.pow(c - 16, 2) + Math.pow(r - 8, 2));
      const isLake = lakeDist < 3.5;
      
      dataPoints.push({
        col: c,
        row: r,
        value: isLake ? null : val,
        label: `Terrain [${c}, ${r}]: ${isLake ? 'Lake (No Data)' : val.toFixed(1)}`
      });
    }
  }
  const colLabels = Array.from({ length: cols }, (_, i) => i % 4 === 0 ? `C${i}` : '');
  const rowLabels = Array.from({ length: rows }, (_, i) => i % 4 === 0 ? `R${i}` : '');
  options = {
    ...options,
    cols,
    rows,
    colLabels,
    rowLabels,
    shape: 'mesh',
    gridSize: 18,
    gap: 0,
    maxHeight: 60,
    interpolateColors: true,
    title: '3D Contiguous Surface Mesh Terrain (Rolling Hills with Lake Hole)'
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
} else if (presetType === 'month-workweek') {
  // Monday to Friday Workweek Calendar Month (e.g., June 2026)
  const year = 2026;
  const month = 5; // June (0-indexed: Jan=0, June=5)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  // Find Monday of the first week (could be in the previous month)
  const firstDayDay = firstDay.getDay(); // 0-6 (Sun-Sat)
  const daysToMonday = (firstDayDay === 0 ? -6 : 1 - firstDayDay);
  const startMonday = new Date(year, month, 1 + daysToMonday);

  // Map values for each day of the month
  const valuesMap = new Map();
  for (let d = 1; d <= totalDays; d++) {
    // Generate positive-only mockup values (e.g. 0 to 20)
    let val = 0;
    const date = new Date(year, month, d);
    const day = date.getDay();
    if (day !== 0 && day !== 6) { // Weekdays only
      // Peak on Tuesdays and Thursdays
      if (day === 2 || day === 4) val = (d % 3 === 0 ? 18 : 12);
      else val = (d % 2 === 0 ? 6 : 0);
    }
    valuesMap.set(d, val);
  }

  // Count columns (weeks)
  const lastDayDay = lastDay.getDay();
  const lastDaysToMonday = (lastDayDay === 0 ? -6 : 1 - lastDayDay);
  const lastMonday = new Date(year, month, totalDays + lastDaysToMonday);
  const diffTime = lastMonday.getTime() - startMonday.getTime();
  const cols = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;
  const rows = 5; // Mon-Fri

  dataPoints = [];
  // Initialize all grid cells with 0 values (for padding days)
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      // Find what date this cell corresponds to
      const cellDate = new Date(startMonday);
      cellDate.setDate(startMonday.getDate() + c * 7 + r);
      
      let val = 0;
      let label = '';
      if (cellDate.getFullYear() === year && cellDate.getMonth() === month) {
        val = valuesMap.get(cellDate.getDate()) ?? 0;
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${cellDate.getDate().toString().padStart(2, '0')}`;
        label = `${dateStr} — ${val} units`;
      } else {
        // Outside the month (padding days) - set value to 0
        const dateStr = `${cellDate.getFullYear()}-${(cellDate.getMonth() + 1).toString().padStart(2, '0')}-${cellDate.getDate().toString().padStart(2, '0')}`;
        label = `${dateStr} (Outside Month) — 0 units`;
      }

      dataPoints.push({
        col: c,
        row: r,
        value: val,
        label: label
      });
    }
  }

  options = {
    ...options,
    cols,
    rows,
    colLabels: Array.from({ length: cols }, (_, i) => `W${i + 1}`),
    rowLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    gridSize: 22,
    gap: 3,
    maxHeight: 40,
    title: 'June 2026 Workweek Activity\n(Mon-Fri Preset)'
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

// Apply row label style overrides
const showRowLabels = args['show-row-labels'] !== undefined
  ? (args['show-row-labels'] === 'true' || args['show-row-labels'] === '1' || args['show-row-labels'] === true)
  : (args['no-row-labels'] !== undefined ? false : undefined);

if (showRowLabels !== undefined) {
  options.showRowLabels = showRowLabels;
}

const rowLabelStyle = {};
if (args['row-label-font-size']) rowLabelStyle.fontSize = parseInt(args['row-label-font-size'], 10);
if (args['row-label-font-family']) rowLabelStyle.fontFamily = args['row-label-font-family'];
if (args['row-label-color']) rowLabelStyle.color = args['row-label-color'];
if (args['row-label-bg']) rowLabelStyle.backgroundColor = args['row-label-bg'];
if (args['row-label-bg-opacity']) rowLabelStyle.backgroundOpacity = parseFloat(args['row-label-bg-opacity']);
if (args['row-label-padding']) rowLabelStyle.padding = parseInt(args['row-label-padding'], 10);
if (args['row-label-radius']) rowLabelStyle.borderRadius = parseInt(args['row-label-radius'], 10);

if (Object.keys(rowLabelStyle).length > 0) {
  options.rowLabelStyle = rowLabelStyle;
}


// Render SVG and write to file
try {
  const svg = renderHeatmap(dataPoints, options);
  fs.writeFileSync(outFile, svg);
  console.log(`Successfully wrote SVG to: ${outFile}`);
} catch (err) {
  console.error('Failed to render heatmap:', err.message);
  process.exit(1);
}
