/**
 * MLC Isometric Heatmap Library - Mock data and composites shared by the
 * browser demo (demo.ts) and the SVG generator (generator.js)
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

/** Every demo draws from this seed, so the mock data only changes when the code does. */
export const DEMO_SEED = 20260609;

/** Seeded pseudo-random generator (mulberry32) with the contract of Math.random. */
export function createRandom(seed = DEMO_SEED) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sine wave with noise, clamped to +/-20: the shape of most mock datasets. */
export function noisyWave(angle, random) {
  const val = Math.round(Math.sin(angle) * 15) + Math.floor(random() * 11) - 5;
  return Math.max(-20, Math.min(20, val));
}

/** Calls `visit(date, dayIndex)` with a fresh Date for every day of a range. */
export function forEachDay(start, end, visit) {
  const current = new Date(start);
  for (let dayIndex = 0; current <= end; dayIndex++) {
    visit(new Date(current), dayIndex);
    current.setDate(current.getDate() + 1);
  }
}

/** Two measurements per day, January to June 2026. */
export function sixMonthsDualEvents(random) {
  const events = [];
  forEachDay(new Date(2026, 0, 1), new Date(2026, 6, 0), (day, dayIndex) => {
    for (let m = 0; m < 2; m++) {
      const value = noisyWave((dayIndex / 181) * 6 * Math.PI + (m * Math.PI / 4), random);
      const date = new Date(day);
      date.setHours(m === 0 ? 8 : 16);
      events.push({ date, value, measurement: m });
    }
  });
  return events;
}

/** One value per day, January to June 2026. */
export function sixMonthsDailyEvents(random) {
  const events = [];
  forEachDay(new Date(2026, 0, 1), new Date(2026, 6, 0), (date, dayIndex) => {
    events.push({ date, value: noisyWave((dayIndex / 181) * 4 * Math.PI, random) });
  });
  return events;
}

/** Column labels 12AM, 6AM, 12PM, 6PM on a 24-hour axis. */
export function hourLabelsEvery6() {
  return Array.from({ length: 24 }, (_, i) => {
    if (i % 6 !== 0) return '';
    const suffix = i >= 12 ? 'PM' : 'AM';
    const hr = i % 12 === 0 ? 12 : i % 12;
    return `${hr}${suffix}`;
  });
}

/** One day as a smooth wave, once per shape, with empty rows between the shapes. */
export function gradient24hDemo() {
  const prefixes = { 0: 'Flat Ribbon', 2: 'Continuous Ribbon', 4: 'Cylinder', 6: 'Prism (Box)' };
  const data = [];
  for (const [row, prefix] of Object.entries(prefixes)) {
    for (let h = 0; h < 24; h++) {
      const angle = (h / 24) * 2 * Math.PI - Math.PI / 2;
      const value = parseFloat((Math.sin(angle) * 5 + 5).toFixed(1));
      data.push({ col: h, row: Number(row), value, label: `${prefix}, ${h.toString().padStart(2, '0')}:00 — Value: ${value}` });
    }
  }
  const shapes = { 0: 'flatribbon', 2: 'ribbon', 4: 'cylinder' };
  return {
    data,
    options: {
      cols: 24,
      rows: 7,
      colLabels: hourLabelsEvery6(),
      colLabelInterval: 1,
      rowLabels: ['Flat Ribbon', '', 'Continuous Ribbon', '', 'Cylinder', '', 'Prism (Box)'],
      rowLabelInterval: 1,
      shape: (row) => shapes[row] ?? 'prism',
      title: '24h Timeline Gradient Demo (4 Shapes, Values 0 to 10)',
    },
  };
}

/** June 2026 as a wave with an outage: a month grid with holes for the mesh shape. */
export function monthMeshGrid(presets) {
  const year = 2026;
  const month = 5;
  const events = [];
  for (let d = 1; d <= 30; d++) {
    events.push({ date: new Date(year, month, d), value: Math.round(12 + 10 * Math.sin((d / 30) * Math.PI * 2 - Math.PI / 2)) });
  }
  const grid = presets.aggregateMonth(events, { year, month, startOfWeek: 1 });
  const firstDayIndex = (new Date(year, month, 1).getDay() - 1 + 7) % 7;
  for (const d of [12, 13, 14, 24]) {
    const cellIndex = firstDayIndex + d - 1;
    grid.setCell(Math.floor(cellIndex / 7), cellIndex % 7, null, `2026-06-${d.toString().padStart(2, '0')} — No Data (Outage)`);
  }
  return grid;
}

function isoDate(d) {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

/** June 2026, Monday to Friday only, with the peaks on Tuesdays and Thursdays. */
export function workweekDemo() {
  const year = 2026;
  const month = 5;
  const lastDay = new Date(year, month + 1, 0);
  const mondayOfWeek = (d) => new Date(year, month, d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()));
  const startMonday = mondayOfWeek(new Date(year, month, 1));
  const cols = Math.round((mondayOfWeek(lastDay).getTime() - startMonday.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
  const rows = 5;

  const valueOf = (date) => {
    const day = date.getDay();
    const d = date.getDate();
    if (day === 0 || day === 6) return 0;
    if (day === 2 || day === 4) return d % 3 === 0 ? 18 : 12;
    return d % 2 === 0 ? 6 : 0;
  };

  const data = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cellDate = new Date(startMonday);
      cellDate.setDate(startMonday.getDate() + c * 7 + r);
      const inMonth = cellDate.getFullYear() === year && cellDate.getMonth() === month;
      const value = inMonth ? valueOf(cellDate) : 0;
      const label = inMonth ? `${isoDate(cellDate)} — ${value} units` : `${isoDate(cellDate)} (Outside Month) — 0 units`;
      data.push({ col: c, row: r, value, label });
    }
  }
  return {
    data,
    options: {
      cols,
      rows,
      colLabels: Array.from({ length: cols }, (_, i) => `W${i + 1}`),
      rowLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      title: 'June 2026 Workweek Activity\n(Mon-Fri Preset)',
    },
  };
}

/** Rolling hills with a lake of missing values. */
export function meshTerrainDemo() {
  const cols = 24;
  const rows = 24;
  const data = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cx = c - 11.5;
      const cy = r - 11.5;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const val = parseFloat((Math.sin(dist / 2.5) * 8 + Math.cos(cx / 3.0) * 4).toFixed(1));
      const isLake = Math.sqrt(Math.pow(c - 16, 2) + Math.pow(r - 8, 2)) < 3.5;
      data.push({ col: c, row: r, value: isLake ? null : val, label: `Terrain [${c}, ${r}]: ${isLake ? 'Lake (No Data)' : val.toFixed(1)}` });
    }
  }
  return {
    data,
    options: {
      cols,
      rows,
      colLabels: Array.from({ length: cols }, (_, i) => (i % 4 === 0 ? `C${i}` : '')),
      rowLabels: Array.from({ length: rows }, (_, i) => (i % 4 === 0 ? `R${i}` : '')),
      shape: 'mesh',
      title: '3D Contiguous Surface Mesh Terrain (Rolling Hills with Lake Hole)',
    },
  };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The options that make the blocks of a composite comparable and their labels readable. */
function compositeBlockOptions(options, values) {
  return {
    ...options,
    wrapper: 'g',
    // Without a shared domain each block would normalize to its own maximum and lie visually.
    valueDomain: { min: Math.min(...values), max: Math.max(...values) },
    showAxis: true,
    showAxisWalls: true,
    axisWallHeight: 28,
    labelLift: 28, // seat labels on the wall tops
    rowLabelAngle: -90, // vertical day labels: zero overlap
    rowLabelStyle: { backgroundColor: options.dark ? '#1f2937' : '#ffffff', backgroundOpacity: 0.85, padding: 3, borderRadius: 3 },
  };
}

function blockBounds(svg, dx, dy) {
  const match = svg.match(/data-min-x="([^"]+)" data-min-y="([^"]+)" data-width="([^"]+)" data-height="([^"]+)"/);
  const [minX, minY, width, height] = match.slice(1).map(parseFloat);
  return { minX: minX + dx, minY: minY + dy, maxX: minX + dx + width, maxY: minY + dy + height };
}

/** Wraps rendered blocks in one SVG whose viewBox covers them all. */
function compositeSvg(blocks, title, options) {
  const minX = Math.min(...blocks.map((b) => b.bounds.minX));
  const maxX = Math.max(...blocks.map((b) => b.bounds.maxX));
  const minY = Math.min(...blocks.map((b) => b.bounds.minY));
  const maxY = Math.max(...blocks.map((b) => b.bounds.maxY));
  const padding = options.padding ?? 20;
  const width = (maxX - minX) + 2 * padding;
  const height = (maxY - minY) + 2 * padding;
  const viewX = minX - padding;
  const viewY = minY - padding;
  const titleColor = options.dark ? '#f0f6fc' : '#24292f';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX.toFixed(2)} ${viewY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}" width="100%" height="100%">
    <text x="${(viewX + width / 2).toFixed(2)}" y="${(viewY + padding * 0.7).toFixed(2)}" fill="${titleColor}" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">${title}</text>
    ${blocks.map((b) => b.svg).join('\n')}
  </svg>`;
}

/**
 * Several months in a row in one SVG, on one value scale. Only the first block
 * shows the weekdays, and the month name replaces W1 as first column label.
 * NOTE: showRowLabels controls visibility; rowLabels: undefined would fall back
 * to the grid's own labels.
 */
export function renderMonthBlocks({ presets, year, months, events, options, title, startOfWeek = 1 }) {
  const blockOptions = compositeBlockOptions(options, events.map((ev) => ev.value));
  const spacerCols = 2; // extra air so back labels of block N+1 clear block N
  const gridSize = options.gridSize ?? 16;
  const gap = options.gap ?? 2;
  const rad = ((options.projectionAngle ?? 30) * Math.PI) / 180;
  const stepX = (gridSize + gap) * Math.cos(rad);
  const stepY = (gridSize + gap) * Math.sin(rad);

  let accumulatedCols = 0;
  const blocks = months.map((m, i) => {
    const grid = presets.aggregateMonth(events.filter((ev) => ev.date.getMonth() === m), { year, month: m, startOfWeek });
    const mSvg = grid.render({
      ...blockOptions,
      showRowLabels: i === 0,
      colLabels: grid.colLabels.map((w, ci) => (ci === 0 ? MONTH_NAMES[m] : w)),
      title: undefined,
    });
    const colOffset = accumulatedCols + i * spacerCols;
    const dx = colOffset * stepX;
    const dy = colOffset * stepY;
    accumulatedCols += grid.cols;
    return {
      bounds: blockBounds(mSvg, dx, dy),
      svg: `<g class="iso-month-block" data-month="${m}" transform="translate(${dx.toFixed(2)}, ${dy.toFixed(2)})">
      ${mSvg}
    </g>`,
    };
  });
  return compositeSvg(blocks, title, options);
}

/** May and June 2026 with mixed shapes per row: two grids nested as groups in one SVG. */
export function renderMultiMonth({ presets, options, startOfWeek = 1 }) {
  const year = 2026;
  const eventsOf = (month, days, valueOf) =>
    Array.from({ length: days }, (_, i) => ({ date: new Date(year, month, i + 1), value: valueOf(i + 1) }));
  const mockMay = eventsOf(4, 31, (d) => (d % 3 === 0 ? 15 : (d % 5 === 0 ? -10 : 5)));
  const mockJune = eventsOf(5, 30, (d) => (d % 4 === 0 ? 20 : (d % 3 === 0 ? -12 : 8)));
  const gridMay = presets.aggregateMonth(mockMay, { year, month: 4, startOfWeek });
  const gridJune = presets.aggregateMonth(mockJune, { year, month: 5, startOfWeek });

  const shapes = ['prism', 'cylinder', 'ribbon', 'flatribbon'];
  const blockOptions = {
    ...compositeBlockOptions(options, [...mockMay, ...mockJune].map((ev) => ev.value)),
    shape: (r) => shapes[r % shapes.length],
  };

  // NOTE: [] (not undefined) suppresses labels; undefined would fall back to the grid's own.
  const svgMay = gridMay.render({ ...blockOptions, showRowLabels: true, colLabels: [] });
  const svgJune = gridJune.render({
    ...blockOptions,
    showRowLabels: false,
    colLabels: gridJune.colLabels.map((w, ci) => (ci === 0 ? 'Jun' : w)),
  });

  const spacerCols = 1;
  const step = (gridMay.cols + spacerCols) * ((options.gridSize ?? 20) + (options.gap ?? 3));
  const rad = ((options.projectionAngle ?? 30) * Math.PI) / 180;
  const dx = step * Math.cos(rad);
  const dy = step * Math.sin(rad);

  return compositeSvg(
    [
      { bounds: blockBounds(svgMay, 0, 0), svg: svgMay },
      {
        bounds: blockBounds(svgJune, dx, dy),
        svg: `<g transform="translate(${dx.toFixed(2)}, ${dy.toFixed(2)})">
    ${svgJune}
  </g>`,
      },
    ],
    'May &amp; June 2026 — Mixed Shapes Composite',
    options
  );
}

/** One value per day of October 2026 for the calendar preset. */
export function calendarMonthEvents() {
  return Array.from({ length: 31 }, (_, i) => ({
    date: new Date(2026, 9, i + 1),
    value: 2 + (((i + 1) * 7) % 11),
  }));
}
