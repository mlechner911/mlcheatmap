import { renderHeatmap, presets, ColorSchemeType } from './index';

// ==========================================
// 1. Mock Data Generators
// ==========================================

function generate24hMockEvents() {
  const events = [];
  const now = new Date();
  // Generate events for the last 7 days to get a good distribution
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    for (let hour = 0; hour < 24; hour++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset, hour, 15);
      const angle = (hour / 24) * 2 * Math.PI;
      let val = Math.round(Math.sin(angle) * 15);
      val += Math.floor(Math.random() * 11) - 5;
      if (val < -20) val = -20;
      if (val > 20) val = 20;
      events.push({ timestamp: date, value: val });
    }
  }
  return events;
}

function generateMonthMockEvents() {
  const events = [];
  const year = 2026;
  const month = 5; // June (0-indexed: Jan=0, June=5)
  // Generate daily events for June 2026
  for (let d = 1; d <= 30; d++) {
    const date = new Date(year, month, d);
    const angle = (d / 30) * 2 * Math.PI;
    let val = Math.round(Math.sin(angle) * 15);
    val += Math.floor(Math.random() * 11) - 5;
    if (val < -20) val = -20;
    if (val > 20) val = 20;
    events.push({ date, value: val });
  }
  return events;
}

function generateYearMockEvents() {
  const events = [];
  const year = 2026;
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  // Iterate through all 365 days
  const current = new Date(start);
  let dayIndex = 0;
  while (current <= end) {
    const angle = (dayIndex / 365) * 4 * Math.PI;
    let val = Math.round(Math.sin(angle) * 15);
    val += Math.floor(Math.random() * 11) - 5;
    if (val < -20) val = -20;
    if (val > 20) val = 20;

    events.push({ date: new Date(current), value: val });
    current.setDate(current.getDate() + 1);
    dayIndex++;
  }
  return events;
}

function generateSixMonthsMockEvents() {
  const events = [];
  const year = 2026;
  const startMonth = 0; // January
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
      events.push({ date, value: val, measurement: m as 0 | 1 });
    }
    current.setDate(current.getDate() + 1);
    dayIndex++;
  }
  return events;
}

function renderCombinedMultiMonth(commonOptions: any): string {
  const year = 2026;
  const startOfWeek = 1;
  const isDark = commonOptions.dark;
  const titleColor = isDark ? '#f0f6fc' : '#24292f';

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
  const shapeFn = (r: number) => shapes[r % shapes.length] as any;

  const groupOptions = {
    ...commonOptions,
    shape: shapeFn,
    wrapper: 'g' as const,
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
  const rad = ((commonOptions.projectionAngle ?? 30) * Math.PI) / 180;
  const dx = colsMay * ((commonOptions.gridSize ?? 20) + (commonOptions.gap ?? 3)) * Math.cos(rad);
  const dy = colsMay * ((commonOptions.gridSize ?? 20) + (commonOptions.gap ?? 3)) * Math.sin(rad);

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

  const padding = commonOptions.padding ?? 20;
  const combinedWidth = (maxX - minX) + 2 * padding;
  const combinedHeight = (maxY - minY) + 2 * padding;
  const viewX = minX - padding;
  const viewY = minY - padding;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX.toFixed(2)} ${viewY.toFixed(2)} ${combinedWidth.toFixed(2)} ${combinedHeight.toFixed(2)}" width="100%" height="100%">
    <text x="${(viewX + combinedWidth / 2).toFixed(2)}" y="${(viewY + padding * 0.7).toFixed(2)}" fill="${titleColor}" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">May & June 2026 — Combined Multi-Month (Mixed Shapes & G-Group Integration)</text>
    ${svgMayG}
    ${translatedJune}
  </svg>`;
}

function generateSixMonthsSingleMockEvents() {
  const events = [];
  const year = 2026;
  const startMonth = 0; // January
  const D_start = new Date(year, startMonth, 1);
  const D_end = new Date(year, startMonth + 6, 0); // End of June

  const current = new Date(D_start);
  let dayIndex = 0;
  while (current <= D_end) {
    const angle = (dayIndex / 181) * 4 * Math.PI;
    let val = Math.round(Math.sin(angle) * 15);
    val += Math.floor(Math.random() * 11) - 5;
    if (val < -20) val = -20;
    if (val > 20) val = 20;

    events.push({ date: new Date(current), value: val });
    current.setDate(current.getDate() + 1);
    dayIndex++;
  }
  return events;
}

function renderSixMonthsSplit(commonOptions: any, events: any[]): string {
  const year = 2026;
  const startOfWeek = 1;
  const isDark = commonOptions.dark;
  const titleColor = isDark ? '#f0f6fc' : '#24292f';

  const months = [0, 1, 2, 3, 4, 5]; // Jan to Jun
  const groups: string[] = [];
  
  let accumulatedCols = 0;
  const spacerCols = 1;

  const gridSize = commonOptions.gridSize ?? 11;
  const gap = commonOptions.gap ?? 1;
  const rad = ((commonOptions.projectionAngle ?? 30) * Math.PI) / 180;
  const stepX = (gridSize + gap) * Math.cos(rad);
  const stepY = (gridSize + gap) * Math.sin(rad);

  let overallMinX = Infinity;
  let overallMaxX = -Infinity;
  let overallMinY = Infinity;
  let overallMaxY = -Infinity;

  for (let i = 0; i < months.length; i++) {
    const m = months[i];
    // Filter events for this month
    const mEvents = events.filter(ev => {
      const d = typeof ev.date === 'string' ? new Date(ev.date) : ev.date;
      return d.getFullYear() === year && d.getMonth() === m;
    });

    const gridModel = presets.aggregateMonth(mEvents, { year, month: m, startOfWeek });
    
    // Only the first month gets row labels
    const rowLabels = i === 0 ? gridModel.rowLabels : undefined;
    const colLabels = gridModel.colLabels;

    const mSvg = gridModel.render({
      ...commonOptions,
      wrapper: 'g',
      rowLabels,
      colLabels,
      title: undefined, // no individual title
    });

    const colOffset = accumulatedCols + i * spacerCols;
    const dx = colOffset * stepX;
    const dy = colOffset * stepY;

    // Wrap in translated group
    const groupElement = `<g class="iso-month-block" data-month="${m}" transform="translate(${dx.toFixed(2)}, ${dy.toFixed(2)})">
      ${mSvg}
    </g>`;
    groups.push(groupElement);

    // Parse bounds to compute combined viewBox
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

  const padding = commonOptions.padding ?? 20;
  const combinedWidth = (overallMaxX - overallMinX) + 2 * padding;
  const combinedHeight = (overallMaxY - overallMinY) + 2 * padding;
  const viewX = overallMinX - padding;
  const viewY = overallMinY - padding;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX.toFixed(2)} ${viewY.toFixed(2)} ${combinedWidth.toFixed(2)} ${combinedHeight.toFixed(2)}" width="100%" height="100%">
    <text x="${(viewX + combinedWidth / 2).toFixed(2)}" y="${(viewY + padding * 0.7).toFixed(2)}" fill="${titleColor}" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">Jan - Jun 2026 — 6-Month Split Timeline (1 Value/Day with Monthly Spacers)</text>
    ${groups.join('\n')}
  </svg>`;
}

// Generate static sets of mock data
const mockData24h = generate24hMockEvents();
const mockDataMonth = generateMonthMockEvents();
const mockDataYear = generateYearMockEvents();
const mockDataSixMonths = generateSixMonthsMockEvents();
const mockDataSixMonthsSingle = generateSixMonthsSingleMockEvents();

// ==========================================
// 2. DOM Elements & State Management
// ==========================================

let activePreset: '24h' | 'month' | 'year' | 'nulls' | 'sixmonths' | 'mixed' | 'sixmonths-split' = '24h';

// Inputs
const colorSchemeSelect = document.getElementById('colorScheme') as HTMLSelectElement;
const darkModeSwitch = document.getElementById('darkModeSwitch') as HTMLInputElement;
const gridSizeInput = document.getElementById('gridSize') as HTMLInputElement;
const gapInput = document.getElementById('gap') as HTMLInputElement;
const maxHeightInput = document.getElementById('maxHeight') as HTMLInputElement;
const projectionAngleInput = document.getElementById('projectionAngle') as HTMLInputElement;
const labelPositionSelect = document.getElementById('labelPosition') as HTMLSelectElement;
const shapeSelect = document.getElementById('shapeSelect') as HTMLSelectElement;
const opacityInput = document.getElementById('opacity') as HTMLInputElement;
const zeroColorSelect = document.getElementById('zeroColorSelect') as HTMLSelectElement;
const zeroColorPicker = document.getElementById('zeroColorPicker') as HTMLInputElement;
const showGridSwitch = document.getElementById('showGridSwitch') as HTMLInputElement;
const interactiveSwitch = document.getElementById('interactiveSwitch') as HTMLInputElement;
const animationSwitch = document.getElementById('animationSwitch') as HTMLInputElement;
const flatZeroSwitch = document.getElementById('flatZeroSwitch') as HTMLInputElement;

const heightGridSwitch = document.getElementById('heightGridSwitch') as HTMLInputElement;
const heightGridOptionsGroup = document.getElementById('heightGridOptionsGroup') as HTMLDivElement;
const heightGridTicksInput = document.getElementById('heightGridTicks') as HTMLInputElement;
const heightGridSolidSwitch = document.getElementById('heightGridSolidSwitch') as HTMLInputElement;

const hoverInfoDefault = document.getElementById('hoverInfoDefault') as HTMLDivElement;
const hoverInfoData = document.getElementById('hoverInfoData') as HTMLDivElement;
const hoverInfoPos = document.getElementById('hoverInfoPos') as HTMLSpanElement;
const hoverInfoValue = document.getElementById('hoverInfoValue') as HTMLSpanElement;

// Value indicators
const gridSizeVal = document.getElementById('gridSizeVal') as HTMLSpanElement;
const gapVal = document.getElementById('gapVal') as HTMLSpanElement;
const maxHeightVal = document.getElementById('maxHeightVal') as HTMLSpanElement;
const projectionAngleVal = document.getElementById('projectionAngleVal') as HTMLSpanElement;
const opacityVal = document.getElementById('opacityVal') as HTMLSpanElement;

// Output Containers
const previewContainer = document.getElementById('heatmap-preview-container') as HTMLDivElement;
const svgCodeOutput = document.getElementById('svg-code-output') as HTMLTextAreaElement;
const dimensionsBadge = document.getElementById('grid-dimensions-badge') as HTMLSpanElement;
const copySvgBtn = document.getElementById('copySvgBtn') as HTMLButtonElement;

// Preset Tabs
const presetTabs = document.querySelectorAll('#presetTabs button');

// ==========================================
// 3. Render Heatmap Function
// ==========================================

function updateHeatmap() {
  // Read control values
  const colorScheme = colorSchemeSelect.value as ColorSchemeType;
  const isDark = darkModeSwitch.checked;
  const gridSize = parseInt(gridSizeInput.value, 10);
  const gap = parseInt(gapInput.value, 10);
  const maxHeight = parseInt(maxHeightInput.value, 10);
  const projectionAngle = parseInt(projectionAngleInput.value, 10);
  const labelPosition = labelPositionSelect.value as 'behind' | 'front';
  const showGrid = showGridSwitch.checked;
  const interactive = interactiveSwitch.checked;
  const shape = shapeSelect.value as 'prism' | 'cylinder' | 'ribbon' | 'flatribbon';
  const opacity = parseFloat(opacityInput.value);
  const animated = animationSwitch.checked;
  const renderFlatZero = flatZeroSwitch.checked;

  // Read zero color options
  let zeroColor: string | undefined = undefined;
  if (zeroColorSelect.value === 'custom') {
    zeroColor = zeroColorPicker.value;
  } else if (zeroColorSelect.value) {
    zeroColor = zeroColorSelect.value;
  }

  // Sync dark mode class
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  // Sync value displays
  gridSizeVal.textContent = `${gridSize}px`;
  gapVal.textContent = `${gap}px`;
  maxHeightVal.textContent = `${maxHeight}px`;
  projectionAngleVal.textContent = `${projectionAngle}°`;
  opacityVal.textContent = opacity.toFixed(2);

  // Common Heatmap Options
  const commonOptions = {
    gridSize,
    gap,
    maxHeight,
    projectionAngle,
    labelPosition,
    zeroColor,
    colorScheme,
    showGrid,
    interactive,
    dark: isDark,
    shape,
    opacity,
    animated,
    renderFlatZero,
    heightGrid: heightGridSwitch.checked ? {
      ticks: parseInt(heightGridTicksInput.value, 10) || 5,
      solid: heightGridSolidSwitch.checked
    } : undefined
  };

  // Aggregate and render based on active preset
  let svg = '';
  if (activePreset === '24h') {
    const { data, cols, rows, colLabels, rowLabels } = presets.aggregate24h(mockData24h, {
      startOfWeek: 1, // Start on Monday
    });
    dimensionsBadge.textContent = `${cols} cols (hours) × ${rows} rows (days)`;
    svg = renderHeatmap(data, {
      ...commonOptions,
      cols,
      rows,
      colLabels,
      colLabelInterval: 3, // Show label every 3 hours
      rowLabels,
      rowLabelInterval: 2, // Show label every other day
      title: 'Hourly User Events — Weekly Distribution',
    });
  } else if (activePreset === 'month') {
    const { data, cols, rows, colLabels, rowLabels } = presets.aggregateMonth(mockDataMonth, {
      year: 2026,
      month: 5, // June
      startOfWeek: 1,
    });
    dimensionsBadge.textContent = `${cols} cols (days) × ${rows} rows (weeks)`;
    svg = renderHeatmap(data, {
      ...commonOptions,
      cols,
      rows,
      colLabels,
      rowLabels,
      title: 'June 2026 — Calendar Activity Tracker',
    });
  } else if (activePreset === 'sixmonths') {
    const { data, cols, rows, colLabels, rowLabels } = presets.aggregateSixMonthsDouble(mockDataSixMonths, {
      year: 2026,
      startMonth: 0, // Jan
      startOfWeek: 1, // Mon
    });
    dimensionsBadge.textContent = `${cols} cols (weeks) × ${rows} rows (days × 2)`;
    svg = renderHeatmap(data, {
      ...commonOptions,
      cols,
      rows,
      colLabels,
      rowLabels,
      rowLabelInterval: 2, // Every 2 days
      title: 'Jan - Jun 2026 — 6-Month Dual Timeline (2 Measurements/Day)',
    });
  } else if (activePreset === 'mixed') {
    dimensionsBadge.textContent = `2 groups (May + June) × mixed shapes per row`;
    svg = renderCombinedMultiMonth(commonOptions);
  } else if (activePreset === 'sixmonths-split') {
    dimensionsBadge.textContent = `6 groups (Months) × 7 rows (days)`;
    svg = renderSixMonthsSplit(commonOptions, mockDataSixMonthsSingle);
  } else if (activePreset === 'nulls') {
    const gridModel = presets.nullsExample8x8();
    dimensionsBadge.textContent = `${gridModel.cols} cols × ${gridModel.rows} rows`;
    svg = gridModel.render({
      ...commonOptions,
      title: '8x8 Grid with Explicit Null Values (No Data)',
    });
  } else {
    // Year
    const { data, cols, rows, colLabels, rowLabels } = presets.aggregateYear(mockDataYear, {
      year: 2026,
      startOfWeek: 1,
    });
    dimensionsBadge.textContent = `${cols} cols (weeks) × ${rows} rows (days)`;
    svg = renderHeatmap(data, {
      ...commonOptions,
      cols,
      rows,
      colLabels,
      rowLabels,
      rowLabelInterval: 2, // Every 2 days
      title: 'GitHub Contributions — Calendar Year 2026',
    });
  }

  // Render to DOM
  previewContainer.innerHTML = svg;
  svgCodeOutput.value = svg;
}

// ==========================================
// 4. Event Listeners
// ==========================================

// Setup height grid options group visibility toggle
heightGridSwitch.addEventListener('change', () => {
  heightGridOptionsGroup.style.display = heightGridSwitch.checked ? 'block' : 'none';
});

// Setup Tab switching
presetTabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    // Remove active from all tabs
    presetTabs.forEach(t => t.classList.remove('active'));
    
    // Add active to clicked tab
    const button = e.currentTarget as HTMLButtonElement;
    button.classList.add('active');

    // Update preset state
    activePreset = button.getAttribute('data-preset') as '24h' | 'month' | 'year' | 'nulls' | 'sixmonths' | 'mixed' | 'sixmonths-split';

    // Update geometry defaults depending on preset for best visual representation
    if (activePreset === '24h') {
      gridSizeInput.value = '16';
      gapInput.value = '2';
      maxHeightInput.value = '40';
    } else if (activePreset === 'month') {
      gridSizeInput.value = '24';
      gapInput.value = '3';
      maxHeightInput.value = '50';
    } else if (activePreset === 'sixmonths') {
      gridSizeInput.value = '11';
      gapInput.value = '1';
      maxHeightInput.value = '25';
    } else if (activePreset === 'sixmonths-split') {
      gridSizeInput.value = '11';
      gapInput.value = '1';
      maxHeightInput.value = '25';
    } else if (activePreset === 'mixed') {
      gridSizeInput.value = '18';
      gapInput.value = '2';
      maxHeightInput.value = '35';
    } else if (activePreset === 'year') {
      gridSizeInput.value = '13';
      gapInput.value = '2';
      maxHeightInput.value = '30';
    } else if (activePreset === 'nulls') {
      gridSizeInput.value = '24';
      gapInput.value = '3';
      maxHeightInput.value = '40';
    }

    updateHeatmap();
  });
});

// Setup form controls event listeners
const controls = [
  colorSchemeSelect,
  darkModeSwitch,
  gridSizeInput,
  gapInput,
  maxHeightInput,
  projectionAngleInput,
  labelPositionSelect,
  shapeSelect,
  opacityInput,
  animationSwitch,
  flatZeroSwitch,
  zeroColorSelect,
  zeroColorPicker,
  showGridSwitch,
  interactiveSwitch,
  heightGridSwitch,
  heightGridTicksInput,
  heightGridSolidSwitch,
];

controls.forEach(control => {
  control.addEventListener('input', updateHeatmap);
  control.addEventListener('change', updateHeatmap);
});

// Event delegation for displaying details in HTML mode on hover
previewContainer.addEventListener('mouseover', (e) => {
  const target = e.target as HTMLElement;
  const bar = target.closest('.iso-bar');
  if (bar) {
    const col = bar.getAttribute('data-col');
    const row = bar.getAttribute('data-row');
    const value = bar.getAttribute('data-value');
    
    if (col !== null && row !== null && value !== null) {
      hoverInfoDefault.classList.add('d-none');
      hoverInfoData.classList.remove('d-none');
      hoverInfoData.classList.add('d-flex');
      hoverInfoPos.textContent = `Column ${col}, Row ${row}`;
      hoverInfoValue.textContent = value === 'null' ? 'No Data' : value;
    }
  }
});

previewContainer.addEventListener('mouseout', (e) => {
  const target = e.target as HTMLElement;
  const bar = target.closest('.iso-bar');
  if (bar) {
    hoverInfoDefault.classList.remove('d-none');
    hoverInfoData.classList.add('d-none');
    hoverInfoData.classList.remove('d-flex');
  }
});

// Copy button
copySvgBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(svgCodeOutput.value);
    const originalText = copySvgBtn.textContent;
    copySvgBtn.textContent = 'Copied!';
    copySvgBtn.classList.remove('btn-outline-primary');
    copySvgBtn.classList.add('btn-success');
    
    setTimeout(() => {
      copySvgBtn.textContent = originalText;
      copySvgBtn.classList.remove('btn-success');
      copySvgBtn.classList.add('btn-outline-primary');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy SVG: ', err);
  }
});

// Initialize on page load
updateHeatmap();
