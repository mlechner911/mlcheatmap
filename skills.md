# AI Coding Assistant Skills & API Reference (skills.md)

This file outlines the API surface, mathematical layout, presets, and integration recipes of the **MLC Isometric 3D Heatmap Library** to help LLMs and AI coding assistants write correct, idiomatic integration code.

---

## 1. Core Architecture & Modules

The library is split into a lightweight core rendering package and an optional calendar aggregation presets package.

### Core Entrypoint (`mlc-isometric-heatmap`)
Exports the core projection logic, functional renderer, and object-oriented grid model:
*   `HeatmapGrid`: The coordinate-space data model class.
*   `renderHeatmap(data, options)`: The underlying rendering function.
*   Types: `HeatmapDataPoint`, `HeatmapOptions`, `ColorSchemeType`, `CustomColorScheme`, `HeatmapShape`, `HeightGridOptions`.

### Presets Entrypoint (`mlc-isometric-heatmap/presets` / `dist/presets`)
An optional package for aggregating raw timeseries events into structured calendar grids:
*   `presets`: Grouping object containing calendar aggregators (`aggregate24h`, `aggregateMonth`, `aggregateYear`, `aggregateSixMonthsDouble`, `nullsExample8x8`).

---

## 2. API Reference & Interfaces

### `HeatmapDataPoint`
Represents an individual cell in the coordinate grid.
```typescript
interface HeatmapDataPoint {
  col: number;             // X-coordinate (0-indexed column)
  row: number;             // Y-coordinate (0-indexed row)
  value: number | null;    // Numeric magnitude (null = missing/transparent cell)
  label?: string;          // Optional custom text for title tag / interactivity tooltip
  color?: string;          // Optional CSS/hex color override for this specific cell
}
```

### `HeatmapOptions`
Global configuration passed to `renderHeatmap` or `HeatmapGrid.render`.
```typescript
interface HeatmapOptions {
  cols: number;                      // Number of grid columns
  rows: number;                      // Number of grid rows
  gridSize?: number;                 // Size of each grid cell in pixels (default: 16)
  gap?: number;                      // Gap between cells in pixels (default: 2)
  maxHeight?: number;                // Maximum 3D column height in pixels (default: 40)
  colorScheme?: ColorSchemeType | CustomColorScheme; // Theme preset or custom colors
  showGrid?: boolean;                // Show bottom grid lines (default: true)
  gridColor?: string;                // Custom grid line color (default: #e1e4e8)
  colLabels?: string[];              // Text labels for columns
  colLabelInterval?: number;         // Label rendering frequency for columns (default: 1)
  rowLabels?: string[];              // Text labels for rows
  rowLabelInterval?: number;         // Label rendering frequency for rows (default: 1)
  interactive?: boolean;             // Embed title tags and hover dataset hooks (default: true)
  dark?: boolean;                    // Enable dark-theme color mappings (default: false)
  padding?: number;                  // Padding around drawing boundaries (default: 20)
  title?: string;                    // Title placed in the SVG (default: none)
  projectionAngle?: number;          // Isometric camera slant in degrees: 10 to 60 (default: 30)
  labelPosition?: 'behind' | 'front';// Label rendering layer/location (default: 'behind')
  zeroColor?: string;                // Custom color override for zero value cells
  shape?: HeatmapShape | HeatmapShape[] | ((row: number) => HeatmapShape); // Shape type
  opacity?: number;                  // Elements opacity: 0.1 to 1.0 (default: 1.0)
  animated?: boolean;                // Staggered coordinate-delay transition (default: true)
  renderFlatZero?: boolean;          // Render a flat 2D tile for zero values (default: true)
  heightGrid?: HeightGridOptions;    // Reference vertical wall ticks (default: none)
  wrapper?: 'svg' | 'g';             // Output element tag: 'svg' or 'g' (default: 'svg')
  interpolateColors?: boolean;       // Enable continuous color gradients (default: false)
}
```

### `HeightGridOptions`
```typescript
interface HeightGridOptions {
  ticks: number;                     // Number of horizontal reference scale lines
  solid?: boolean;                   // Render a solid filled back wall (default: false)
  wallColor?: string;                // Wall background color (default: #f6f8fa or dark equivalent)
  gridColor?: string;                // Dashed line color (default: #e1e4e8)
  labelColor?: string;               // Text tick labels color (default: #586069)
}
```

### Supported Shapes (`HeatmapShape`)
1.  `'prism'`: Rectangular blocks.
2.  `'cylinder'`: Cylindrical columns with linear-gradient shading.
3.  `'ribbon'`: A continuous 3D surface generated using cubic splines running along the center of each row.
4.  `'flatribbon'`: A floating ribbon band of constant thickness ($T = \max(4, \text{maxHeight} \times 0.1)$) running parallel to the spline curve.

---

## 3. Core Coding Recipes

### Recipe A: Object-Oriented Grid Usage (Basic)
Instantiate a grid, set coordinates, and render it to a complete SVG.

```typescript
import { HeatmapGrid } from 'mlc-isometric-heatmap';

// 1. Initialize coordinate grid (cols = 12, rows = 4)
const grid = new HeatmapGrid(12, 4);

// 2. Set coordinate values
grid.setCell(0, 0, 10, 'January Week 1');
grid.setCell(1, 0, 15, 'January Week 2');
grid.setCell(2, 0, null); // transparent/no-data spacer cell

// 3. Define labels
grid.colLabels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
grid.rowLabels = ['Q1', 'Q2', 'Q3', 'Q4'];

// 4. Render to SVG
const svgString = grid.render({
  shape: 'cylinder',
  colorScheme: 'sunset',
  maxHeight: 50,
  interpolateColors: true, // Smooth gradients
  heightGrid: { ticks: 5, solid: true }
});
```

### Recipe B: Functional Low-level Rendering
Pass raw data arrays directly to `renderHeatmap`.

```typescript
import { renderHeatmap, HeatmapDataPoint } from 'mlc-isometric-heatmap';

const dataPoints: HeatmapDataPoint[] = [
  { col: 0, row: 0, value: 5, label: 'Cell A' },
  { col: 1, row: 0, value: 0, label: 'Zero Cell' },
  { col: 2, row: 0, value: -12, label: 'Negative Sinking Cell' }
];

const svgString = renderHeatmap(dataPoints, {
  cols: 3,
  rows: 1,
  shape: 'prism',
  colorScheme: 'emerald',
  zeroColor: '#1e293b' // Dark gray override for zero values
});
```

### Recipe C: Calendar Presets & Aggregation (Split Bundle)
Use calendar layout helper algorithms from the presets bundle.

```typescript
import { renderHeatmap } from 'mlc-isometric-heatmap';
import { presets } from 'mlc-isometric-heatmap/presets'; // ESM split import

const rawData = [
  { timestamp: '2026-06-09T08:30:00Z', value: 12 },
  { timestamp: '2026-06-09T18:45:00Z', value: 25 }
];

// Aggregate hourly events into a 24-column (hours) x 7-row (days) weekly calendar grid
const weeklyGrid = presets.aggregate24h(rawData, { startOfWeek: 1 });

const svg = weeklyGrid.render({
  colorScheme: 'sky',
  shape: 'flatribbon',
  interpolateColors: true
});
```

### Recipe D: Diverging Rows (Mixed Shapes per Series)
Define series-specific shapes by passing a mapper function to `options.shape`.

```typescript
import { HeatmapGrid } from 'mlc-isometric-heatmap';

const grid = new HeatmapGrid(24, 4);
// Populate ...

const svg = grid.render({
  shape: (row: number) => {
    switch (row) {
      case 0: return 'flatribbon';  // Floating 3D band
      case 1: return 'ribbon';      // Continuous ground ribbon
      case 2: return 'cylinder';    // Smooth cylinders
      default: return 'prism';      // Rectangular prisms
    }
  },
  rowLabels: ['Flat', 'Ribbon', 'Cylinder', 'Prism']
});
```

### Recipe E: Composite SVG Canvas (Group Wrapping & Transform translation)
Nest multiple grids inside `<g>` groups and translate them to compile large composite dashboards.

```typescript
import { presets } from 'mlc-isometric-heatmap/presets';

// 1. Render May as a <g> group
const gridMay = presets.aggregateMonth(mayEvents, { year: 2026, month: 4 });
const gMay = gridMay.render({ wrapper: 'g', rowLabels: gridMay.rowLabels });

// 2. Render June as a <g> group
const gridJune = presets.aggregateMonth(juneEvents, { year: 2026, month: 5 });
const gJune = gridJune.render({ wrapper: 'g', colLabels: gridJune.colLabels });

// 3. Compute Translation Offset (e.g. at 30-degree isometric skew)
const colsMay = gridMay.cols;
const step = 22 + 3; // gridSize + gap
const rad = (30 * Math.PI) / 180;
const dx = colsMay * step * Math.cos(rad);
const dy = colsMay * step * Math.sin(rad);

// 4. Package inside a single parent SVG
const compositeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="100%">
  ${gMay}
  <g transform="translate(${dx.toFixed(2)}, ${dy.toFixed(2)})">
    ${gJune}
  </g>
</svg>`;
```

---

## 4. Key Mathematical Constraints

*   **Isometric Slant Coordinates**: 
    The library projects 3D coordinates $(c, r, h)$ in column, row, and height space to screen 2D space $(x_{2D}, y_{2D})$ using:
    $$x_{2D} = (c \cdot G_S - r \cdot G_S) \cdot \cos(\theta)$$
    $$y_{2D} = (c \cdot G_S + r \cdot G_S) \cdot \sin(\theta) - h$$
    where $G_S$ is the `gridSize` and $\theta$ is the `projectionAngle` in radians.
*   **Depth Sorting (Back-to-Front Layering)**:
    Grid lines and shapes must be rendered cell-by-cell in a nested loops structure:
    ```typescript
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // 1. Draw floor lines for cell (c, r)
        // 2. Draw 3D shape elements for cell (c, r)
      }
    }
    ```
    This eliminates sorting violations when mixing positive, negative, and zero cells.
*   **Color Interpolation**:
    To compute smooth color transitions, the theme colors are concatenated: $\mathbf{C} = [ C_{\text{empty}}, C_{\text{step 0}}, \dots, C_{\text{step } N-1} ]$.
    The float color index is determined by $i = \min(1.0, |v| / V_{\max}) \cdot N$.
    Linear RGB interpolation is then calculated between stops $C[\lfloor i \rfloor]$ and $C[\lceil i \rceil]$.
