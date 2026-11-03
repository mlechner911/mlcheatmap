/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { renderHeatmap, ColorSchemeType } from '../src/index';
import { presets } from '../src/presets';
import {
  calendarMonthEvents,
  createRandom,
  forEachDay,
  gradient24hDemo,
  meshTerrainDemo,
  monthMeshGrid,
  noisyWave,
  renderMonthBlocks,
  renderMultiMonth,
  sixMonthsDailyEvents,
  sixMonthsDualEvents,
  workweekDemo,
} from './shared.mjs';

// ==========================================
// 1. Mock Data Generators
// ==========================================

function generate24hMockEvents() {
  const random = createRandom();
  const events = [];
  // One fixed week: with today's date the picture would change every day
  const lastDay = new Date(2026, 5, 9);
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() - dayOffset, hour, 15);
      events.push({ timestamp, value: noisyWave((hour / 24) * 2 * Math.PI, random) });
    }
  }
  return events;
}

function generateMonthMockEvents() {
  const random = createRandom();
  const events: { date: Date; value: number }[] = [];
  forEachDay(new Date(2026, 5, 1), new Date(2026, 5, 30), (date: Date, dayIndex: number) => {
    events.push({ date, value: noisyWave(((dayIndex + 1) / 30) * 2 * Math.PI, random) });
  });
  return events;
}

function generateYearMockEvents() {
  const random = createRandom();
  const events: { date: Date; value: number }[] = [];
  forEachDay(new Date(2026, 0, 1), new Date(2026, 11, 31), (date: Date, dayIndex: number) => {
    events.push({ date, value: noisyWave((dayIndex / 365) * 4 * Math.PI, random) });
  });
  return events;
}

// Generate static sets of mock data
const mockData24h = generate24hMockEvents();
const mockDataMonth = generateMonthMockEvents();
const mockDataYear = generateYearMockEvents();
const mockDataSixMonths = sixMonthsDualEvents(createRandom());
const mockDataSixMonthsSingle = sixMonthsDailyEvents(createRandom());
const mockDataCalendar = calendarMonthEvents();

// ==========================================
// 2. DOM Elements & State Management
// ==========================================

type DemoPreset = '24h' | 'month' | 'calendar' | 'year' | 'nulls' | 'sixmonths' | 'mixed' | 'sixmonths-split' | '24h-gradient' | 'mesh-terrain' | 'month-mesh' | 'month-workweek';

let activePreset: DemoPreset = '24h';

// Inputs
const colorSchemeSelect = document.getElementById('colorScheme') as HTMLSelectElement;
const darkModeSwitch = document.getElementById('darkModeSwitch') as HTMLInputElement;
const gridSizeInput = document.getElementById('gridSize') as HTMLInputElement;
const gapInput = document.getElementById('gap') as HTMLInputElement;
const maxHeightInput = document.getElementById('maxHeight') as HTMLInputElement;
const projectionAngleInput = document.getElementById('projectionAngle') as HTMLInputElement;
const labelPositionSelect = document.getElementById('labelPosition') as HTMLSelectElement;
const labelModeSelect = document.getElementById('labelMode') as HTMLSelectElement;
const shapeSelect = document.getElementById('shapeSelect') as HTMLSelectElement;
const opacityInput = document.getElementById('opacity') as HTMLInputElement;
const zeroColorSelect = document.getElementById('zeroColorSelect') as HTMLSelectElement;
const zeroColorPicker = document.getElementById('zeroColorPicker') as HTMLInputElement;
const showGridSwitch = document.getElementById('showGridSwitch') as HTMLInputElement;
const interactiveSwitch = document.getElementById('interactiveSwitch') as HTMLInputElement;
const animationSwitch = document.getElementById('animationSwitch') as HTMLInputElement;
const flatZeroSwitch = document.getElementById('flatZeroSwitch') as HTMLInputElement;
const interpolateColorsSwitch = document.getElementById('interpolateColorsSwitch') as HTMLInputElement;

const triangulateMeshSwitch = document.getElementById('triangulateMeshSwitch') as HTMLInputElement;
const useSvg2MeshSwitch = document.getElementById('useSvg2MeshSwitch') as HTMLInputElement;
const meshShadingSwitch = document.getElementById('meshShadingSwitch') as HTMLInputElement;
const meshOptionsGroup = document.getElementById('meshOptionsGroup') as HTMLDivElement;

const heightGridSwitch = document.getElementById('heightGridSwitch') as HTMLInputElement;
const heightGridOptionsGroup = document.getElementById('heightGridOptionsGroup') as HTMLDivElement;
const heightGridTicksInput = document.getElementById('heightGridTicks') as HTMLInputElement;
const heightGridSolidSwitch = document.getElementById('heightGridSolidSwitch') as HTMLInputElement;

// Row Labels inputs
const showRowLabelsSwitch = document.getElementById('showRowLabelsSwitch') as HTMLInputElement;
const rowLabelStyleGroup = document.getElementById('rowLabelStyleGroup') as HTMLDivElement;
const rowLabelFontSizeInput = document.getElementById('rowLabelFontSize') as HTMLInputElement;
const rowLabelFontSizeVal = document.getElementById('rowLabelFontSizeVal') as HTMLSpanElement;
const rowLabelBgSelect = document.getElementById('rowLabelBgSelect') as HTMLSelectElement;
const rowLabelColorSelect = document.getElementById('rowLabelColorSelect') as HTMLSelectElement;
const rowLabelPaddingInput = document.getElementById('rowLabelPadding') as HTMLInputElement;
const rowLabelPaddingVal = document.getElementById('rowLabelPaddingVal') as HTMLSpanElement;
const rowLabelRadiusInput = document.getElementById('rowLabelRadius') as HTMLInputElement;
const rowLabelRadiusVal = document.getElementById('rowLabelRadiusVal') as HTMLSpanElement;

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
  const labelMode = labelModeSelect.value as 'screen' | 'axis';
  const showGrid = showGridSwitch.checked;
  const interactive = interactiveSwitch.checked;
  const shape = shapeSelect.value as 'prism' | 'cylinder' | 'ribbon' | 'flatribbon' | 'mesh';
  const opacity = parseFloat(opacityInput.value);
  const animated = animationSwitch.checked;
  const renderFlatZero = flatZeroSwitch.checked;
  const interpolateColors = interpolateColorsSwitch.checked;
  const triangulateMesh = triangulateMeshSwitch.checked;
  const useSvg2Mesh = useSvg2MeshSwitch.checked;
  const shading = meshShadingSwitch.checked;

  meshOptionsGroup.style.display = (shape === 'mesh') ? 'block' : 'none';

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

  // Row Label Styles
  const showRowLabels = showRowLabelsSwitch.checked;
  rowLabelStyleGroup.style.display = showRowLabels ? 'block' : 'none';

  const rowLabelFontSize = parseInt(rowLabelFontSizeInput.value, 10);
  const rowLabelBg = rowLabelBgSelect.value || undefined;
  const rowLabelColor = rowLabelColorSelect.value || undefined;
  const rowLabelPadding = parseInt(rowLabelPaddingInput.value, 10);
  const rowLabelRadius = parseInt(rowLabelRadiusInput.value, 10);

  rowLabelFontSizeVal.textContent = `${rowLabelFontSize}px`;
  rowLabelPaddingVal.textContent = `${rowLabelPadding}px`;
  rowLabelRadiusVal.textContent = `${rowLabelRadius}px`;

  // Common Heatmap Options
  const commonOptions = {
    gridSize,
    gap,
    maxHeight,
    projectionAngle,
    labelPosition,
    labelMode,
    zeroColor,
    colorScheme,
    showGrid,
    interactive,
    dark: isDark,
    shape,
    opacity,
    animated,
    renderFlatZero,
    interpolateColors,
    triangulateMesh,
    useSvg2Mesh,
    shading,
    showRowLabels,
    rowLabelStyle: {
      fontSize: rowLabelFontSize,
      backgroundColor: rowLabelBg,
      color: rowLabelColor,
      padding: rowLabelPadding,
      borderRadius: rowLabelRadius
    },
    heightGrid: heightGridSwitch.checked ? {
      ticks: parseInt(heightGridTicksInput.value, 10) || 5,
      solid: heightGridSolidSwitch.checked
    } : undefined
  };


  // Aggregate and render based on active preset
  let svg = '';
  if (activePreset === '24h-gradient') {
    const demo = gradient24hDemo();
    dimensionsBadge.textContent = `24 cols × 7 rows`;
    svg = renderHeatmap(demo.data, { ...commonOptions, ...demo.options });
  } else if (activePreset === '24h') {
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
    dimensionsBadge.textContent = `${cols} cols (weeks) × ${rows} rows (days)`;
    svg = renderHeatmap(data, {
      ...commonOptions,
      cols,
      rows,
      colLabels,
      rowLabels,
      title: 'June 2026 — Calendar Activity Tracker',
    });
  } else if (activePreset === 'calendar') {
    const grid = presets.aggregateCalendarMonth(mockDataCalendar, { year: 2026, month: 9, startOfWeek: 1 });
    dimensionsBadge.textContent = `${grid.cols} cols (weekdays) × ${grid.rows} rows (weeks)`;
    svg = grid.render(commonOptions);
  } else if (activePreset === 'month-mesh') {
    const gridMonth = monthMeshGrid(presets);
    dimensionsBadge.textContent = `${gridMonth.cols} cols × ${gridMonth.rows} rows (Month Mesh)`;
    svg = gridMonth.render({
      ...commonOptions,
      shape: 'mesh',
      gap: 0,
      interpolateColors: true,
      title: 'June 2026 — 3D Surface Mesh Calendar (With Missing Data Holes)',
    });
  } else if (activePreset === 'month-workweek') {
    const demo = workweekDemo();
    dimensionsBadge.textContent = `${demo.options.cols} cols (weeks) × ${demo.options.rows} rows (Mon-Fri)`;
    svg = renderHeatmap(demo.data, { ...commonOptions, ...demo.options });
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
    svg = renderMultiMonth({ presets, options: commonOptions });
  } else if (activePreset === 'sixmonths-split') {
    dimensionsBadge.textContent = `6 groups (Months) × 7 rows (days)`;
    svg = renderMonthBlocks({
      presets,
      year: 2026,
      months: [0, 1, 2, 3, 4, 5],
      events: mockDataSixMonthsSingle,
      options: commonOptions,
      title: 'Jan - Jun 2026 — 6-Month Split Timeline (1 Value/Day with Monthly Spacers)',
    });
  } else if (activePreset === 'nulls') {
    const gridModel = presets.nullsExample8x8();
    dimensionsBadge.textContent = `${gridModel.cols} cols × ${gridModel.rows} rows`;
    svg = gridModel.render({
      ...commonOptions,
      title: '8x8 Grid with Explicit Null Values (No Data)',
    });
  } else if (activePreset === 'mesh-terrain') {
    const demo = meshTerrainDemo();
    dimensionsBadge.textContent = `${demo.options.cols} cols × ${demo.options.rows} rows (Terrain)`;
    svg = renderHeatmap(demo.data, { ...commonOptions, ...demo.options });
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
    activePreset = button.getAttribute('data-preset') as DemoPreset;

    labelModeSelect.value = 'screen';

    // Update geometry defaults depending on preset for best visual representation
    if (activePreset === 'calendar') {
      shapeSelect.value = 'prism';
      gridSizeInput.value = '34';
      gapInput.value = '3';
      maxHeightInput.value = '14';
      labelPositionSelect.value = 'front';
      labelModeSelect.value = 'axis';
      interpolateColorsSwitch.checked = false;
    } else if (activePreset === '24h-gradient') {
      gridSizeInput.value = '22';
      gapInput.value = '3';
      maxHeightInput.value = '50';
      interpolateColorsSwitch.checked = true; // Enable smooth gradients by default
    } else if (activePreset === '24h') {
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
      labelPositionSelect.value = 'behind'; // composites seat their labels on the walls
    } else if (activePreset === 'mixed') {
      gridSizeInput.value = '18';
      gapInput.value = '2';
      maxHeightInput.value = '35';
      labelPositionSelect.value = 'behind'; // composites seat their labels on the walls
    } else if (activePreset === 'year') {
      gridSizeInput.value = '13';
      gapInput.value = '2';
      maxHeightInput.value = '30';
    } else if (activePreset === 'nulls') {
      gridSizeInput.value = '24';
      gapInput.value = '3';
      maxHeightInput.value = '40';
    } else if (activePreset === 'mesh-terrain') {
      shapeSelect.value = 'mesh';
      gridSizeInput.value = '18';
      gapInput.value = '0';
      maxHeightInput.value = '60';
      interpolateColorsSwitch.checked = true;
    } else if (activePreset === 'month-mesh') {
      shapeSelect.value = 'mesh';
      gridSizeInput.value = '24';
      gapInput.value = '0';
      maxHeightInput.value = '50';
      interpolateColorsSwitch.checked = true;
    } else if (activePreset === 'month-workweek') {
      shapeSelect.value = 'prism';
      gridSizeInput.value = '24';
      gapInput.value = '3';
      maxHeightInput.value = '40';
      interpolateColorsSwitch.checked = false;
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
  labelModeSelect,
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
  interpolateColorsSwitch,
  triangulateMeshSwitch,
  useSvg2MeshSwitch,
  meshShadingSwitch,
  showRowLabelsSwitch,
  rowLabelFontSizeInput,
  rowLabelBgSelect,
  rowLabelColorSelect,
  rowLabelPaddingInput,
  rowLabelRadiusInput,
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
