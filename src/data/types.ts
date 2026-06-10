/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

export interface HeatmapDataPoint {
  col: number;
  row: number;
  value: number | null;
  label?: string;
  color?: string; // Optional specific color override for this data point
}

export type ColorSchemeType =
  | 'github'
  | 'emerald'
  | 'sky'
  | 'coral'
  | 'amber'
  | 'purple'
  | 'sunset'
  | 'grayscale';

export type HeatmapShape = 'prism' | 'cylinder' | 'ribbon' | 'flatribbon' | 'mesh';

export interface CustomColorScheme {
  empty: string; // Color for zero value
  steps: string[]; // Progression of colors from low to high
}

export interface HeightGridOptions {
  ticks: number;
  solid?: boolean;
  wallColor?: string;
  gridColor?: string;
  labelColor?: string;
}

export interface HeatmapOptions {
  cols: number;
  rows: number;
  gridSize?: number;       // Size of each grid cell in pixels (default: 16)
  gap?: number;            // Gap between cells in pixels (default: 2)
  maxHeight?: number;      // Maximum height of a bar for max value in pixels (default: 40)
  colorScheme?: ColorSchemeType | CustomColorScheme; // Preset or custom colors
  showGrid?: boolean;      // Show isometric bottom grid lines (default: true)
  gridColor?: string;      // Color of grid lines (default: '#e1e4e8' or dark equivalent)
  colLabels?: string[];    // Column labels (e.g. Months or Hours)
  colLabelInterval?: number; // Label interval for columns (default: 1)
  rowLabels?: string[];    // Row labels (e.g. Days of the week)
  rowLabelInterval?: number; // Label interval for rows (default: 1)
  interactive?: boolean;   // Enable SVG hover effects & tooltips (default: true)
  dark?: boolean;          // Toggle dark mode presets (default: false)
  padding?: number;        // Padding around the drawing (default: 20)
  title?: string;          // Optional title for the heatmap
  tooltipFormatter?: (point: HeatmapDataPoint) => string;
  projectionAngle?: number; // Projection angle in degrees (default: 30)
  labelPosition?: 'behind' | 'front'; // Position of axis labels relative to the grid (default: 'behind')
  zeroColor?: string;      // Custom color for zero value elements
  shape?: HeatmapShape | HeatmapShape[] | ((row: number) => HeatmapShape); // Shape of the 3D bars (default: 'prism')
  opacity?: number;        // Opacity of the 3D bars (default: 1.0)
  animated?: boolean;      // Enable staggered load animations (default: true)
  renderFlatZero?: boolean; // Render flat 2D cells for zero-value points (default: true)
  heightGrid?: HeightGridOptions;
  wrapper?: 'svg' | 'g';   // Output wrapper element ('svg' or 'g', default: 'svg')
  interpolateColors?: boolean; // Enable smooth color interpolation (default: false)
}
