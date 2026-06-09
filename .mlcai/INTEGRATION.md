# Integration Guide — Isometric SVG Heatmap

This document describes how to integrate and use the `mlc-isometric-heatmap` library in your projects.

## Installation

Install the library using npm or yarn:

```bash
npm install mlc-isometric-heatmap
```

## Basic Usage

The library outputs standard SVG strings, making it fully cross-compatible with React, Vue, Svelte, or plain JavaScript.

```typescript
import { renderHeatmap } from 'mlc-isometric-heatmap';

// Define options
const options = {
  cols: 12,
  rows: 7,
  gridSize: 15,
  gap: 2,
  maxHeight: 40,
  colorScheme: 'emerald', // 'emerald', 'sky', 'coral', 'amber', 'purple', 'github'
};

// Define data (col, row indices)
const data = [
  { col: 0, row: 0, value: 10, label: "Sunday Week 1: 10 points" },
  { col: 1, row: 3, value: 25, label: "Wednesday Week 2: 25 points" },
  // ...
];

// Generate SVG string
const svg = renderHeatmap(data, options);

// Insert into your container
document.getElementById('heatmap-container').innerHTML = svg;
```

## Presets (24h, Month, Year)

The library provides easy-to-use helpers to aggregate raw dates or values into grids:

### 1. 24h Daily/Weekly View

To show data distributed by hour of the day (0-23) over the days of the week (Mon-Sun):

```typescript
import { presets, renderHeatmap } from 'mlc-isometric-heatmap';

const events = [
  { timestamp: new Date('2026-06-09T08:30:00Z'), value: 5 },
  { timestamp: new Date('2026-06-09T08:45:00Z'), value: 12 },
  { timestamp: new Date('2026-06-10T14:10:00Z'), value: 8 },
];

// Aggregate events into a 24-hour (columns) x 7-day (rows) grid
const { data, cols, rows, colLabels, rowLabels } = presets.aggregate24h(events, {
  startOfWeek: 1, // 1 = Monday, 0 = Sunday
});

const svg = renderHeatmap(data, {
  cols,
  rows,
  colLabels,
  rowLabels,
  colorScheme: 'sky',
});
```

### 2. Month Calendar View

To show data for a single month:

```typescript
import { presets, renderHeatmap } from 'mlc-isometric-heatmap';

const events = [
  { date: '2026-06-01', value: 2 },
  { date: '2026-06-15', value: 15 },
];

const { data, cols, rows, colLabels, rowLabels } = presets.aggregateMonth(events, {
  year: 2026,
  month: 5, // June (0-indexed)
});

const svg = renderHeatmap(data, {
  cols,
  rows,
  colLabels,
  rowLabels,
  colorScheme: 'coral',
});
```

## Advanced Styling (3D Cylinder Columns and Transparency)

The library supports rendering custom shapes and transparent bars:

- **3D Cylinder columns**: Render columns with curved mantles instead of rectangular prisms. Set `shape` to `'cylinder'`.
- **3D Continuous Ribbons**: Connect adjacent active cells along columns in each row to render smooth wave-like ribbons, automatically interrupted for zero values. Set `shape` to `'ribbon'`.
- **Bar Opacity**: Adjust transparency of columns to view intersecting grid lines or overlapping bars. Set `opacity` between `0.1` and `1.0`.

### Example

```typescript
import { renderHeatmap } from 'mlc-isometric-heatmap';

const svg = renderHeatmap(data, {
  cols: 24,
  rows: 2,
  gridSize: 20,
  maxHeight: 50,
  colorScheme: 'sky',
  shape: 'cylinder',    // Render 3D cylinders
  opacity: 0.8,         // 80% opacity
  zeroColor: '#1e293b', // Custom dark color for zero-value columns
});
```

