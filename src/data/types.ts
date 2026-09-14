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

export interface RowLabelStyle {
  show?: boolean;            // Easily turn off (default: true)
  fontSize?: number;         // Font size in px (default: 9)
  fontFamily?: string;       // Font family (default: 'sans-serif')
  color?: string;            // Text color (default: theme labelColor)
  backgroundColor?: string;  // Background box color (optional)
  backgroundOpacity?: number;// Background box opacity (optional, default: 0.8)
  padding?: number;          // Padding around the text in px (optional, default: 4 when background present)
  borderRadius?: number;     // Border radius of the background box (optional, default: 2)
}

export interface ValueDomain {
  min: number; // Fixed data minimum for height/color scaling
  max: number; // Fixed data maximum for height/color scaling
}

export interface HeatmapOptions {
  cols: number;
  rows: number;
  gridSize?: number;       // Size of each grid cell in pixels (default: 16)
  gap?: number;            // Gap between cells in pixels (default: 2)
  maxHeight?: number;      // Maximum height of a bar for max value in pixels (default: 40)
  valueDomain?: ValueDomain; // Fixed value domain for height/color scaling. Overrides the per-grid data min/max — use this to keep several composite grids (e.g. monthly blocks) on a shared scale.
  colorScheme?: ColorSchemeType | CustomColorScheme; // Preset or custom colors
  showGrid?: boolean;      // Show isometric bottom grid lines (default: true)
  gridColor?: string;      // Color of grid lines (default: '#e1e4e8' or dark equivalent)
  showAxis?: boolean;      // Draw baseline axis rules with tick marks along the label edges (default: false)
  axisColor?: string;      // Color of axis rules and ticks (default: theme labelColor)
  axisWidth?: number;      // Stroke width of axis rules in px (default: 1)
  axisTickLength?: number; // Length of axis tick marks in px (default: 5)
  showAxisWalls?: boolean; // Translucent back walls along both rear floor edges as label backdrop (default: false)
  axisWallHeight?: number; // Wall height in px (default: maxHeight)
  axisWallColor?: string;  // Wall fill color (default: height-grid wall default)
  colLabels?: string[];    // Column labels (e.g. Months or Hours)
  colLabelInterval?: number; // Label interval for columns (default: 1)
  colLabelAngle?: number;  // Column label rotation in degrees about the anchor (default: 0). ~projectionAngle aligns labels with the column axis.
  rowLabels?: string[];    // Row labels (e.g. Days of the week)
  rowLabelInterval?: number; // Label interval for rows (default: 1)
  rowLabelAngle?: number;
  labelLift?: number;        // Vertical uplift in px for all axis labels (default: 0). Set to wall height to seat labels on top of axis walls.  // Row label rotation in degrees about the anchor (default: 0). ~-projectionAngle aligns labels with the row axis.
  showRowLabels?: boolean; // Toggle visibility of row labels (default: true). NOTE: pass false to hide labels inherited from a HeatmapGrid — passing rowLabels: undefined falls back to the grid's own labels.
  rowLabelStyle?: RowLabelStyle; // Styling options for row labels
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
  triangulateMesh?: boolean; // Triangulate the 3D mesh surface into planar triangles for accurate 3D shading (default: true)
  useSvg2Mesh?: boolean;    // Experimental: use SVG 2.0 meshGradient for smooth bilinear color shading (default: false)
  shading?: boolean;        // Toggle 3D light shading on the mesh terrain (default: true)
  creator?: string;        // Creator name for SVG RDF metadata (default: 'Michael Lechner')
  generatorComment?: string;// Custom XML generator comment string (default: 'Generated with MLC Isometric 3D Heatmap Library')
}
