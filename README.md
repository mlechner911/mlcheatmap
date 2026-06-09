# MLC Isometric 3D Heatmap Library

A lightweight, reusable TypeScript library to render high-quality, interactive 3D isometric heatmaps as pure vector SVG graphics. 

Unlike traditional 2D grid heatmaps, this library projects data points into isometric space using customizable 3D shapes (Prisms, Cylinders, and Continuous Ribbons), supporting load animations, diverging color schemes, negative sinking values, and transparent representation of null (missing) data.

---

## Features

*   **Pure Vector Graphics (SVG)**: Renders directly as SVG code. Fully responsive, lightweight, scalable, and easy to embed or style.
*   **Multiple 3D Shapes**:
    *   `prism`: Sharp 3D rectangular columns.
    *   `cylinder`: Smooth 3D cylindrical pillars with shading gradients.
    *   `ribbon`: Continuous flowing 3D bands (curves) using cubic splines, with closed side-caps.
*   **Model-View Separation**: Clean OOP coordinate space data model (`HeatmapGrid`) separate from the rendering engine.
*   **Flexible Axis Labels**: Automatic centering, alignment, and spacing of row/column labels with support for front/back positioning.
*   **Negative Values (Valleys & Trenches)**: Full projection support for negative heights sinking below the grid floor with diverging color themes.
*   **Null Value Concept**: Transparent/empty rendering for `null` cells, showing only grid floor lines, with smooth boundary slope-downs for continuous ribbons.
*   **Interactive Features**: Built-in CSS load animations (staggered delay transitions) and hover title/tooltip hooks.

---

## Installation

Install via npm:

```bash
npm install mlc-isometric-heatmap
```

---

## Getting Started

### 1. Basic Usage (OOP Grid Model)

The recommended approach is to use the `HeatmapGrid` class to define grid dimensions, insert data points (including `null` values), and render the SVG:

```typescript
import { HeatmapGrid } from 'mlc-isometric-heatmap';

// Create an 8x8 coordinate grid
const grid = new HeatmapGrid(8, 8);

// Populate grid cells
grid.setCell(0, 0, 15, 'Monday morning activity');
grid.setCell(1, 1, -10, 'Tuesday dip');
grid.setCell(2, 2, null, 'No recorded data (renders transparent)');

// Set labels
grid.colLabels = ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'];
grid.rowLabels = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];

// Render to SVG string
const svg = grid.render({
  shape: 'prism',          // 'prism' | 'cylinder' | 'ribbon'
  colorScheme: 'emerald',  // Preset theme name or custom color scheme object
  dark: false,             // Dark mode colors
  showGrid: true,          // Draw grid cell lines
  opacity: 1.0,            // Bar opacity (0.1 to 1.0)
});
```

### 2. Using Predefined Layout Aggregators

We provide several built-in presets to automatically aggregate list events into calendar structures:

```typescript
import { presets, renderHeatmap } from 'mlc-isometric-heatmap';

// 1. Weekly 24h Grid (24 columns x 7 days)
const events = [
  { timestamp: new Date('2026-06-09T10:15:00Z'), value: 5 },
  { timestamp: new Date('2026-06-09T15:30:00Z'), value: 20 }
];
const weeklyGrid = presets.aggregate24h(events, { startOfWeek: 1 });
const weeklySvg = weeklyGrid.render({ colorScheme: 'sky' });

// 2. Monthly Calendar Grid (5 columns of weeks x 7 days of week)
const monthlyGrid = presets.aggregateMonth(events, { year: 2026, month: 5 }); // June

// 3. GitHub Contribution Grid (53 columns of weeks x 7 days of week)
const yearlyGrid = presets.aggregateYear(events, { year: 2026 });
```

---

## Render Options

Configure the output by passing these settings to `.render()` or `renderHeatmap()`:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `gridSize` | `number` | `16` | Cell spacing/size in pixels. |
| `gap` | `number` | `2` | Spacing gap between adjacent 3D columns. |
| `maxHeight` | `number` | `40` | Maximum height of a 3D bar (for max value) in pixels. |
| `colorScheme`| `string \| CustomColorScheme` | `'github'` | Presets: `'github'`, `'emerald'`, `'sky'`, `'coral'`, `'amber'`, `'purple'`, `'sunset'`, `'grayscale'`. |
| `dark` | `boolean` | `false` | Enable dark theme color schemes. |
| `shape` | `'prism' \| 'cylinder' \| 'ribbon'` | `'prism'` | Visual layout style. |
| `opacity` | `number` | `1.0` | Opacity value from `0.1` to `1.0`. |
| `showGrid` | `boolean` | `true` | Show isometric grid floor layout lines. |
| `zeroColor` | `string` | `undefined` | Override color of zero-value cells. |
| `renderFlatZero` | `boolean` | `true` | Renders a flat 2D plate for zero values instead of a blank space. |
| `interactive` | `boolean` | `true` | Embed interactive tooltips and hover scaling. |
| `animated` | `boolean` | `true` | Enables staggered load animations. |
| `projectionAngle` | `number` | `30` | Isometric camera angle in degrees (10° to 60°). |
| `labelPosition` | `'behind' \| 'front'` | `'behind'` | Render row/column labels at the back or front of the grid projection. |

---

## License

MIT License. Created by MLC.
