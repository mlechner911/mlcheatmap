/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import type { HeatmapDataPoint, HeatmapOptions, CustomColorScheme, RenderDefaults } from '../data/types';
import { LIGHT_THEMES, DARK_THEMES, NEGATIVE_LIGHT_THEMES, NEGATIVE_DARK_THEMES, rotateHue } from './color';
import { type GeometryConfig, getGridIntersection, shapeForRow } from './geometry';
import { calculateBounds } from './bounds';
import { renderColLabels, renderRowLabels } from './labels';
import { getLabelLines, requiredLabelStep, thinLabels } from './label-layout';
import { renderAxis, renderAxisWalls, renderHeightGridWall } from './axes';
import { renderCell } from './cell';
import { renderFlatHeatmap } from './flat';
import { escapeHtml, renderCylinderDefs, renderDocument, renderStyleTag, viewClass } from './svg-document';

/** A grid model that brings its own points, size and labels. */
interface GridModel {
  getData(): HeatmapDataPoint[];
  cols: number;
  rows: number;
  colLabels?: string[];
  rowLabels?: string[];
  title?: string;
  renderDefaults?: RenderDefaults;
}

const WALL_FILL_DARK = 'rgba(30, 41, 59, 0.7)';
const WALL_FILL_LIGHT = 'rgba(241, 245, 249, 0.7)';

function isGridModel(data: HeatmapDataPoint[] | GridModel): data is GridModel {
  return !Array.isArray(data) && typeof data?.getData === 'function';
}

function resolveThemes(options: HeatmapOptions, isDark: boolean): { theme: CustomColorScheme; negativeTheme: CustomColorScheme } {
  if (typeof options.colorScheme === 'object') {
    const theme = options.colorScheme;
    return {
      theme,
      negativeTheme: {
        empty: theme.empty,
        steps: theme.steps.map(step => rotateHue(step, 150))
      }
    };
  }
  const themes = isDark ? DARK_THEMES : LIGHT_THEMES;
  const negThemes = isDark ? NEGATIVE_DARK_THEMES : NEGATIVE_LIGHT_THEMES;
  const schemeKey = options.colorScheme ?? 'github';
  return {
    theme: themes[schemeKey] || themes.github,
    negativeTheme: negThemes[schemeKey] || negThemes.github
  };
}

/**
 * Renders an isometric heatmap SVG.
 * @param data Array of data points or a HeatmapGrid instance.
 * @param options Styling and layout options.
 * @returns SVG string
 */
export function renderHeatmap(
  data: HeatmapDataPoint[] | GridModel,
  options: HeatmapOptions
): string {
  // 1. Resolve parameters from data model vs raw options
  let points: HeatmapDataPoint[];
  let cols = options.cols;
  let rows = options.rows;
  let colLabels = options.colLabels;
  let rowLabels = options.rowLabels;
  let title = options.title;

  if (isGridModel(data)) {
    options = { ...data.renderDefaults, ...options };
    points = data.getData();
    cols = cols ?? data.cols;
    rows = rows ?? data.rows;
    colLabels = options.colLabels ?? data.colLabels;
    rowLabels = options.rowLabels ?? data.rowLabels;
    title = options.title ?? data.title;
  } else {
    points = data;
  }

  // 2. Resolve default options
  const gridSize = options.gridSize ?? 16;
  const gap = options.gap ?? 2;
  const maxHeight = options.maxHeight ?? 40;
  const showGrid = options.showGrid ?? true;
  const interactive = options.interactive ?? true;
  const isDark = options.dark ?? false;
  const padding = options.padding ?? 20;
  const projectionAngle = options.projectionAngle ?? 30;
  const labelPosition = options.labelPosition ?? 'front';
  const labelMode = options.labelMode ?? 'screen';
  const gridCells = options.gridCells ?? 'all';
  const opacity = options.opacity ?? 1.0;
  const animated = options.animated ?? true;
  const renderFlatZero = options.renderFlatZero ?? true;
  const labelLift = options.labelLift ?? 0;

  // Calculate angle constants dynamically
  const rad = (projectionAngle * Math.PI) / 180;
  const cosAngle = Math.cos(rad);
  const sinAngle = Math.sin(rad);

  const { theme, negativeTheme } = resolveThemes(options, isDark);
  const gridColor = options.gridColor ?? (isDark ? '#2f3542' : '#e1e4e8');
  const labelColor = isDark ? '#8b949e' : '#57606a';
  const labelFontSize = options.labelFontSize ?? 9;
  const wallFill = isDark ? WALL_FILL_DARK : WALL_FILL_LIGHT;

  // Find max value for height and color scaling
  let maxValue = 0;
  let minValue = 0;
  // Create a fast lookup map for coordinates
  const dataMap = new Map<string, HeatmapDataPoint>();
  for (const p of points) {
    dataMap.set(`${p.col},${p.row}`, p);
    if (p.value !== null) {
      if (p.value > maxValue) {
        maxValue = p.value;
      }
      if (p.value < minValue) {
        minValue = p.value;
      }
    }
  }
  // Fixed value domain overrides the per-grid data min/max so that
  // composite grids (e.g. monthly blocks in one SVG) share one scale.
  if (options.valueDomain) {
    maxValue = options.valueDomain.max;
    minValue = options.valueDomain.min;
  }
  const maxAbsValue = Math.max(Math.abs(maxValue), Math.abs(minValue));

  const getPoint = (col: number, row: number): HeatmapDataPoint => {
    return dataMap.get(`${col},${row}`) ?? { col, row, value: null };
  };

  if (options.view === 'flat') {
    return renderFlatHeatmap({
      options,
      cols,
      rows,
      colLabels,
      rowLabels,
      title,
      getPoint,
      maxAbsValue,
      theme,
      negativeTheme,
      gridColor,
      labelColor
    });
  }

  const geometryConfig: GeometryConfig = { gridSize, gap, cosAngle, sinAngle };

  const showRowLabels = options.showRowLabels ?? options.rowLabelStyle?.show ?? true;
  const rowLabelStyle = options.rowLabelStyle;
  const hasHeightGrid = (options.heightGrid?.ticks ?? 0) > 0;
  const labelLines = getLabelLines({ cols, rows, labelPosition, hasHeightGrid, labelMode });
  const colLabelAngle = labelMode === 'axis' ? -projectionAngle : options.colLabelAngle ?? 0;
  const rowLabelAngle = labelMode === 'axis' ? projectionAngle : options.rowLabelAngle ?? 0;

  // 'auto' thins the labels themselves; every later pass then visits all cells and skips blanks.
  if (colLabels && options.colLabelInterval === 'auto') {
    colLabels = thinLabels(colLabels, requiredLabelStep({
      labels: colLabels,
      axis: 'col',
      fontSize: labelFontSize,
      padding: 0,
      angleDeg: colLabelAngle,
      config: geometryConfig
    }));
  }
  if (rowLabels && options.rowLabelInterval === 'auto') {
    rowLabels = thinLabels(rowLabels, requiredLabelStep({
      labels: rowLabels,
      axis: 'row',
      fontSize: rowLabelStyle?.fontSize ?? labelFontSize,
      padding: rowLabelStyle?.backgroundColor ? rowLabelStyle.padding ?? 4 : 0,
      angleDeg: rowLabelAngle,
      config: geometryConfig
    }));
  }
  const colLabelInterval = typeof options.colLabelInterval === 'number' ? options.colLabelInterval : 1;
  const rowLabelInterval = typeof options.rowLabelInterval === 'number' ? options.rowLabelInterval : 1;
  const visibleRowLabels = showRowLabels !== false ? rowLabels : undefined;

  // Pre-calculate bounds
  const showAxisWalls = options.showAxisWalls ?? false;
  const bounds = calculateBounds({
    cols,
    rows,
    minValue,
    maxAbsValue,
    maxHeight,
    shape: options.shape ?? 'prism',
    renderFlatZero,
    colLabels,
    rowLabels,
    colLabelInterval,
    rowLabelInterval,
    showRowLabels,
    rowLabelStyle,
    lines: labelLines,
    labelMode,
    labelFontSize,
    gridCells,
    geometryConfig,
    getPoint,
    heightGrid: options.heightGrid,
    axisWallHeight: showAxisWalls ? (options.axisWallHeight ?? maxHeight) : undefined,
    colLabelAngle,
    rowLabelAngle,
    labelLift
  });

  // Generate SVG elements cell-by-cell
  const backgroundElements: string[] = [];
  const elements: string[] = [];
  const foregroundElements: string[] = [];

  if (options.heightGrid && hasHeightGrid) {
    backgroundElements.push(...renderHeightGridWall({
      heightGrid: options.heightGrid,
      rows,
      minValue,
      maxHeight,
      maxAbsValue,
      wallFill,
      gridColor,
      labelColor,
      labelFontSize,
      geometryConfig
    }));
  }

  // Track unique colors for cylinder gradients
  const uniqueColors = new Set<string>();
  const cellContext = {
    options,
    cols,
    rows,
    maxAbsValue,
    maxHeight,
    theme,
    negativeTheme,
    opacity,
    renderFlatZero,
    interactive,
    animated,
    geometryConfig,
    getPoint,
    uniqueColors
  };

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const pt = getPoint(c, r);
      if (showGrid && (gridCells === 'all' || pt.value !== null)) {
        const corners = [[c, r], [c, r + 1], [c + 1, r + 1], [c + 1, r]]
          .map(([gc, gr]) => getGridIntersection(gc, gr, geometryConfig))
          .map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
          .join(' ');
        elements.push(`<polygon class="iso-grid-cell" points="${corners}" fill="none" stroke="${gridColor}" stroke-width="0.5" />`);
      }
      const barSvg = renderCell(pt, c, r, cellContext);
      if (barSvg) {
        elements.push(barSvg);
      }
    }
  }

  if (showAxisWalls) {
    backgroundElements.push(renderAxisWalls({
      cols,
      rows,
      wallHeight: options.axisWallHeight ?? maxHeight,
      wallFill: options.axisWallColor ?? wallFill,
      ruleColor: options.axisColor ?? labelColor,
      colLabels,
      rowLabels: visibleRowLabels,
      colLabelInterval,
      rowLabelInterval,
      geometryConfig
    }));
  }

  if (colLabels) {
    const colLabelsSvg = renderColLabels({
      colLabels,
      colLabelInterval,
      cols,
      lines: labelLines,
      labelMode,
      geometryConfig,
      labelColor,
      labelFontSize,
      escapeHtml,
      labelAngle: colLabelAngle,
      labelLift
    });
    const target = labelPosition === 'front' || showAxisWalls ? foregroundElements : backgroundElements;
    target.push(colLabelsSvg);
  }

  if (visibleRowLabels) {
    const rowLabelsSvg = renderRowLabels({
      rowLabels: visibleRowLabels,
      rowLabelInterval,
      rows,
      lines: labelLines,
      labelMode,
      geometryConfig,
      labelColor,
      labelFontSize,
      escapeHtml,
      rowLabelStyle,
      labelAngle: rowLabelAngle,
      labelLift
    });
    const target = labelPosition === 'front' || hasHeightGrid || showAxisWalls ? foregroundElements : backgroundElements;
    target.push(rowLabelsSvg);
  }

  if (options.showAxis) {
    backgroundElements.push(renderAxis({
      cols,
      rows,
      axisColor: options.axisColor ?? labelColor,
      axisWidth: options.axisWidth ?? 1,
      tickLength: options.axisTickLength ?? 5,
      colLabels,
      rowLabels: visibleRowLabels,
      colLabelInterval,
      rowLabelInterval,
      lines: labelLines,
      geometryConfig
    }));
  }

  const hasCylinder = Array.from({ length: rows }, (_, r) => shapeForRow(options.shape, r)).includes('cylinder');
  return renderDocument({
    bounds,
    padding,
    title,
    isDark,
    styleTag: interactive ? renderStyleTag(animated, cols + rows - 1) : '',
    rootClass: viewClass('3d', interactive, animated),
    // Set once here: nearly every face of every shape shares it.
    rootAttributes: ' stroke-width="0.3"',
    defs: hasCylinder ? renderCylinderDefs(uniqueColors, opacity) : '',
    body: [...backgroundElements, ...elements, ...foregroundElements].join('\n'),
    wrapper: options.wrapper ?? 'svg',
    creator: options.creator,
    comment: options.generatorComment ?? 'Generated with MLC Isometric 3D Heatmap Library',
    fallbackTitle: 'MLC Isometric 3D Heatmap'
  });
}
