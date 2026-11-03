#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { renderHeatmap } = require('../dist/index.umd.js');
const { presets } = require('../dist/presets.umd.js');
const {
  calendarMonthEvents,
  createRandom,
  forEachDay,
  gradient24hDemo,
  hourLabelsEvery6,
  meshTerrainDemo,
  monthMeshGrid,
  noisyWave,
  renderMonthBlocks,
  renderMultiMonth,
  sixMonthsDailyEvents,
  sixMonthsDualEvents,
  workweekDemo,
} = require('./shared.mjs');

const random = createRandom();

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
const positiveOnly = args.positive === true || args.positive === 'true' || args.positive === '1';
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

/** Composites build their own SVG, so they skip the single-grid path at the end. */
function writeCompositeAndExit(svg) {
  try {
    fs.writeFileSync(outFile, svg);
    console.log(`Successfully wrote composite SVG to: ${outFile}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to write composite SVG:', err.message);
    process.exit(1);
  }
}

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
      if (h === 10 || h === 15) val = Math.floor(random() * 20) + 10;
      else if (h % 3 === 0) val = Math.floor(random() * 8);
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
  const demo = gradient24hDemo();
  dataPoints = demo.data;
  options = {
    ...options,
    ...demo.options,
    gridSize: 22,
    gap: 3,
    maxHeight: 50,
    interpolateColors: true, // Force color interpolation/gradient on by default
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
  const colLabels = hourLabelsEvery6();
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
  const colLabels = hourLabelsEvery6();

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
  const colLabels = hourLabelsEvery6();

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
  const gridMonth = monthMeshGrid(presets);

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
  const year = 2026;
  const startMonth = 0; // Jan
  const mockSixMonths = sixMonthsDualEvents(random);
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
  writeCompositeAndExit(renderMultiMonth({ presets, options }));
} else if (presetType === 'sixmonths-split') {
  writeCompositeAndExit(renderMonthBlocks({
    presets,
    year: 2026,
    months: [0, 1, 2, 3, 4, 5],
    events: sixMonthsDailyEvents(random),
    options,
    title: 'Jan - Jun 2026 — 6-Month Split Timeline (1 Value/Day with Monthly Spacers)',
  }));
} else if (presetType === 'three-months') {
  // Sine mock events for the quarter (Apr 1 - Jun 30)
  const mockQuarter = [];
  forEachDay(new Date(2026, 3, 1), new Date(2026, 6, 0), (date, dayIndex) => {
    const angle = (dayIndex / 91) * 4 * Math.PI;
    // Positive only is the standard look: activity counts, single-hue colors
    const value = positiveOnly
      ? Math.max(0, Math.round(12 + Math.sin(angle) * 8 + random() * 6))
      : noisyWave(angle, random);
    mockQuarter.push({ date, value });
  });
  writeCompositeAndExit(renderMonthBlocks({
    presets,
    year: 2026,
    months: [3, 4, 5],
    events: mockQuarter,
    options,
    title: 'Apr - Jun 2026 — 3-Month Composite (Quarter View, One SVG)',
  }));
 } else if (presetType === 'mesh-terrain') {
  const demo = meshTerrainDemo();
  dataPoints = demo.data;
  options = {
    ...options,
    ...demo.options,
    gridSize: 18,
    gap: 0,
    maxHeight: 60,
    interpolateColors: true,
  };
} else if (presetType === 'loss-landscape') {
  // 10x10 ML loss landscape bowl: high rim (1.0) sloping to a global
  // minimum at the center (~0.0). Procedural quadratic falloff — the same
  // shape as a 100-line literal grid, in 5 lines.
  const cols = 10;
  const rows = 10;
  dataPoints = [];
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const dx = x - (cols - 1) / 2;
      const dy = y - (rows - 1) / 2;
      const raw = (dx * dx + dy * dy) / (2 * Math.pow((cols - 1) / 2, 2));
      const val = parseFloat(Math.min(1, Math.max(0, raw)).toFixed(3));
      dataPoints.push({
        col: x,
        row: y,
        value: val,
        label: `Loss [${x}, ${y}]: ${val.toFixed(3)}`
      });
    }
  }
  options = {
    ...options,
    cols,
    rows,
    colLabels: Array.from({ length: cols }, (_, i) => `x${i}`),
    rowLabels: Array.from({ length: rows }, (_, i) => `y${i}`),
    shape: 'mesh',
    gridSize: 22,
    gap: 0,
    maxHeight: 60,
    interpolateColors: true,
    showAxisWalls: true,
    axisWallHeight: 60,
    labelLift: 60, // labels ride above the high rim, tied down by wall ruling lines
    title: 'Loss Landscape Bowl (10x10 Mesh Terrain, Min at Center)'
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
  const demo = workweekDemo();
  dataPoints = demo.data;
  options = {
    ...options,
    ...demo.options,
    gridSize: 22,
    gap: 3,
    maxHeight: 40,
  };
} else if (presetType === 'calendar-month') {
  const p = presets.aggregateCalendarMonth(calendarMonthEvents(), {
    year: 2026,
    month: 9,
    locale: args.locale || undefined,
    weekLabel: args.locale === 'de-DE' ? (week) => `KW ${week}` : undefined,
  });
  dataPoints = p.data;
  options = {
    ...options,
    ...p.renderDefaults,
    cols: p.cols,
    rows: p.rows,
    colLabels: p.colLabels,
    rowLabels: p.rowLabels,
    title: p.title,
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
if (args['label-mode']) options.labelMode = args['label-mode'];
if (args['label-interval']) {
  const interval = args['label-interval'] === 'auto' ? 'auto' : parseInt(args['label-interval'], 10);
  options.colLabelInterval = interval;
  options.rowLabelInterval = interval;
}

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
