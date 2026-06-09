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

// Generate static sets of mock data
const mockData24h = generate24hMockEvents();
const mockDataMonth = generateMonthMockEvents();
const mockDataYear = generateYearMockEvents();

// ==========================================
// 2. DOM Elements & State Management
// ==========================================

let activePreset: '24h' | 'month' | 'year' | 'nulls' = '24h';

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
  const shape = shapeSelect.value as 'prism' | 'cylinder' | 'ribbon';
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

  // Aggregate and render based on active preset
  let svg = '';
  if (activePreset === '24h') {
    const { data, cols, rows, colLabels, rowLabels } = presets.aggregate24h(mockData24h, {
      startOfWeek: 1, // Start on Monday
    });
    dimensionsBadge.textContent = `${cols} cols (hours) × ${rows} rows (days)`;
    svg = renderHeatmap(data, {
      cols,
      rows,
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
      colLabels,
      colLabelInterval: 3, // Show label every 3 hours
      rowLabels,
      rowLabelInterval: 2, // Show label every other day
      title: 'Hourly User Events — Weekly Distribution',
      shape,
      opacity,
      animated,
      renderFlatZero,
    });
  } else if (activePreset === 'month') {
    const { data, cols, rows, colLabels, rowLabels } = presets.aggregateMonth(mockDataMonth, {
      year: 2026,
      month: 5, // June
      startOfWeek: 1,
    });
    dimensionsBadge.textContent = `${cols} cols (days) × ${rows} rows (weeks)`;
    svg = renderHeatmap(data, {
      cols,
      rows,
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
      colLabels,
      rowLabels,
      title: 'June 2026 — Calendar Activity Tracker',
      shape,
      opacity,
      animated,
      renderFlatZero,
    });
  } else if (activePreset === 'nulls') {
    const gridModel = presets.nullsExample8x8();
    dimensionsBadge.textContent = `${gridModel.cols} cols × ${gridModel.rows} rows`;
    svg = gridModel.render({
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
      title: '8x8 Grid with Explicit Null Values (No Data)',
      shape,
      opacity,
      animated,
      renderFlatZero,
    });
  } else {
    // Year
    const { data, cols, rows, colLabels, rowLabels } = presets.aggregateYear(mockDataYear, {
      year: 2026,
      startOfWeek: 1,
    });
    dimensionsBadge.textContent = `${cols} cols (weeks) × ${rows} rows (days)`;
    svg = renderHeatmap(data, {
      cols,
      rows,
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
      colLabels,
      rowLabels,
      rowLabelInterval: 2, // Every 2 days
      title: 'GitHub Contributions — Calendar Year 2026',
      shape,
      opacity,
      animated,
      renderFlatZero,
    });
  }

  // Render to DOM
  previewContainer.innerHTML = svg;
  svgCodeOutput.value = svg;
}

// ==========================================
// 4. Event Listeners
// ==========================================

// Setup Tab switching
presetTabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    // Remove active from all tabs
    presetTabs.forEach(t => t.classList.remove('active'));
    
    // Add active to clicked tab
    const button = e.currentTarget as HTMLButtonElement;
    button.classList.add('active');

    // Update preset state
    activePreset = button.getAttribute('data-preset') as '24h' | 'month' | 'year' | 'nulls';

    // Update geometry defaults depending on preset for best visual representation
    if (activePreset === '24h') {
      gridSizeInput.value = '16';
      gapInput.value = '2';
      maxHeightInput.value = '40';
    } else if (activePreset === 'month') {
      gridSizeInput.value = '24';
      gapInput.value = '3';
      maxHeightInput.value = '50';
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
];

controls.forEach(control => {
  control.addEventListener('input', updateHeatmap);
  control.addEventListener('change', updateHeatmap);
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
