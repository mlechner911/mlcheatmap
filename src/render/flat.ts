/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import type { CustomColorScheme, HeatmapDataPoint, HeatmapOptions } from '../data/types';
import { cellColor, cellTooltip } from './cell';
import { contrastingTextColor } from './color';
import type { GeometryConfig } from './geometry';
import { axisLabelCorners, estimateTextWidth, requiredLabelStep, thinLabels } from './label-layout';
import { renderAxisLabel } from './labels';
import { escapeHtml, renderDocument, renderFlatStyleTag } from './svg-document';

const CELL_RADIUS = 2;
const LABEL_GAP = 5; // Space between the grid or its axis ticks and the labels.
const AXIS_GAP = 2; // Space between the cells and the axis line.

/** Column labels above the grid are the rule for flat heatmaps, unlike 3D, where bars would hide them. */
const DEFAULT_LABEL_POSITION = 'behind';

export interface FlatHeatmapParams {
  options: HeatmapOptions;
  cols: number;
  rows: number;
  colLabels: string[] | undefined;
  rowLabels: string[] | undefined;
  title: string | undefined;
  getPoint: (col: number, row: number) => HeatmapDataPoint;
  maxAbsValue: number;
  theme: CustomColorScheme;
  negativeTheme: CustomColorScheme;
  gridColor: string;
  labelColor: string;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function extend(bounds: Bounds, points: readonly { x: number; y: number }[]): void {
  for (const { x, y } of points) {
    bounds.minX = Math.min(bounds.minX, x);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxY = Math.max(bounds.maxY, y);
  }
}

/** The labels to draw, with `'auto'` thinned so that neighbours keep clear of each other. */
function visibleLabels(params: {
  labels: string[] | undefined;
  interval: number | 'auto' | undefined;
  axis: 'col' | 'row';
  fontSize: number;
  padding: number;
  angleDeg: number;
  gridSize: number;
  gap: number;
}): { index: number; text: string }[] {
  const { labels, interval, axis, fontSize, padding, angleDeg, gridSize, gap } = params;
  if (!labels) return [];
  // A flat axis is a projection whose steps run straight along the screen.
  const straight: GeometryConfig = { gridSize, gap, cosAngle: axis === 'col' ? 1 : 0, sinAngle: axis === 'col' ? 0 : 1 };
  const thinned = interval === 'auto'
    ? thinLabels(labels, requiredLabelStep({ labels, axis, fontSize, padding, angleDeg, config: straight }))
    : labels;
  const every = typeof interval === 'number' ? interval : 1;
  return thinned
    .map((text, index) => ({ index, text }))
    .filter(({ index, text }) => text && index % every === 0);
}

function renderTile(pt: HeatmapDataPoint & { value: number }, size: number, params: FlatHeatmapParams): string {
  const { options } = params;
  const interactive = options.interactive ?? true;
  const animated = options.animated ?? true;
  const { gridSize = 16 } = options;
  const x = pt.col * gridSize;
  const y = pt.row * gridSize;
  const color = cellColor(pt, { options, maxAbsValue: params.maxAbsValue, theme: params.theme, negativeTheme: params.negativeTheme });
  const tooltip = interactive ? `<title>${escapeHtml(cellTooltip(pt, options))}</title>` : '';
  const delay = interactive && animated ? ` style="animation-delay: ${(pt.col + pt.row) * 15}ms;"` : '';
  const fontSize = gridSize * 0.38;
  const faceText = pt.faceText
    ? `<text class="iso-face-text" x="${x + size / 2}" y="${(y + size / 2 + fontSize * 0.35).toFixed(2)}" fill="${contrastingTextColor(color)}" font-size="${fontSize.toFixed(2)}" font-weight="600" font-family="sans-serif" text-anchor="middle">${escapeHtml(pt.faceText)}</text>`
    : '';
  return `<g class="iso-bar iso-flat" data-col="${pt.col}" data-row="${pt.row}" data-value="${pt.value}"${delay}>${tooltip}<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${CELL_RADIUS}" fill="${color}" opacity="${options.opacity ?? 1}" />${faceText}</g>`;
}

/** Renders a standard 2D heatmap: colored cells, row labels on the left, column labels above or below. */
export function renderFlatHeatmap(params: FlatHeatmapParams): string {
  const { options, cols, rows, title, getPoint, gridColor, labelColor } = params;
  const { gridSize = 16, gap = 2, padding = 20, showGrid = true, gridCells = 'all', renderFlatZero = true } = options;
  const labelFontSize = options.labelFontSize ?? 9;
  const below = (options.labelPosition ?? DEFAULT_LABEL_POSITION) === 'front';
  const size = gridSize - gap;
  const gridWidth = cols * gridSize - gap;
  const gridHeight = rows * gridSize - gap;
  const bounds: Bounds = { minX: 0, maxX: gridWidth, minY: 0, maxY: gridHeight };

  const cells: string[] = [];
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const pt = { ...getPoint(col, row), col, row };
      if (pt.value !== null && (pt.value !== 0 || renderFlatZero)) {
        cells.push(renderTile({ ...pt, value: pt.value }, size, params));
      } else if (showGrid && (gridCells === 'all' || pt.value !== null)) {
        cells.push(`<rect class="iso-grid-cell" x="${col * gridSize}" y="${row * gridSize}" width="${size}" height="${size}" rx="${CELL_RADIUS}" fill="none" stroke="${gridColor}" stroke-width="0.5" />`);
      }
    }
  }

  const axisColor = options.axisColor ?? labelColor;
  const axisWidth = options.axisWidth ?? 1;
  const tickLength = options.axisTickLength ?? 5;
  const clearance = options.showAxis ? AXIS_GAP + tickLength + LABEL_GAP : LABEL_GAP;

  const colAngle = options.colLabelAngle ?? 0;
  const colLabels = visibleLabels({ labels: params.colLabels, interval: options.colLabelInterval, axis: 'col', fontSize: labelFontSize, padding: 0, angleDeg: colAngle, gridSize, gap });
  const colOutward = below ? 1 : -1;
  const colEdge = below ? gridHeight : 0;
  const colSvg = colLabels.map(({ index, text }) => {
    const x = (index + 0.5) * gridSize - gap / 2;
    // Upright labels sit centered on their anchor, rotated ones start or end at it.
    const y = colEdge + colOutward * (clearance + (colAngle === 0 ? labelFontSize / 2 : 0));
    // Rotated text has to read away from the grid, whichever way it turns.
    const textAnchor = colAngle === 0 ? 'middle' : (colAngle < 0) === below ? 'end' : 'start';
    extend(bounds, axisLabelCorners({ x, y, angleDeg: colAngle, textAnchor, width: estimateTextWidth(text, labelFontSize), height: labelFontSize }));
    return renderAxisLabel({ x, y, angle: colAngle, textAnchor, text: escapeHtml(text), color: labelColor, fontSize: labelFontSize, fontFamily: 'sans-serif', background: '' });
  });

  const style = options.rowLabelStyle;
  const showRowLabels = options.showRowLabels ?? style?.show ?? true;
  const rowFontSize = style?.fontSize ?? labelFontSize;
  const pillPadding = style?.backgroundColor ? style.padding ?? 4 : 0;
  const rowAngle = options.rowLabelAngle ?? 0;
  const rowUpright = rowAngle !== 90 && rowAngle !== -90;
  const rowColor = style?.color ?? (style?.backgroundColor ? contrastingTextColor(style.backgroundColor) : labelColor);
  const rowLabels = visibleLabels({ labels: showRowLabels ? params.rowLabels : undefined, interval: options.rowLabelInterval, axis: 'row', fontSize: rowFontSize, padding: pillPadding, angleDeg: rowAngle, gridSize, gap });
  const rowSvg = rowLabels.map(({ index, text }) => {
    const textWidth = estimateTextWidth(text, rowFontSize);
    const x = -(clearance + pillPadding + (rowUpright ? 0 : rowFontSize / 2));
    const y = (index + 0.5) * gridSize - gap / 2;
    const textAnchor = rowUpright ? 'end' : 'middle';
    const width = textWidth + 2 * pillPadding;
    const height = rowFontSize + 2 * pillPadding;
    extend(bounds, axisLabelCorners({ x: rowUpright ? x + pillPadding : x, y, angleDeg: rowAngle, textAnchor, width, height }));
    const rectX = rowUpright ? -textWidth - pillPadding : -width / 2;
    const background = style?.backgroundColor
      ? `<rect x="${rectX.toFixed(2)}" y="${(-height / 2).toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" rx="${style.borderRadius ?? 2}" fill="${style.backgroundColor}" opacity="${style.backgroundOpacity ?? 0.8}" />`
      : '';
    return renderAxisLabel({ x, y, angle: rowAngle, textAnchor, text: escapeHtml(text), color: rowColor, fontSize: rowFontSize, fontFamily: style?.fontFamily ?? 'sans-serif', background });
  });

  const axisSvg: string[] = [];
  if (options.showAxis) {
    const line = (x1: number, y1: number, x2: number, y2: number): string =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${axisColor}" stroke-width="${axisWidth}" />`;
    const colLine = colEdge + colOutward * AXIS_GAP;
    axisSvg.push(line(0, colLine, gridWidth, colLine), line(-AXIS_GAP, 0, -AXIS_GAP, gridHeight));
    extend(bounds, [{ x: -AXIS_GAP, y: colLine }]);
    for (const { index } of colLabels) {
      const x = (index + 0.5) * gridSize - gap / 2;
      axisSvg.push(line(x, colLine, x, colLine + colOutward * tickLength));
    }
    for (const { index } of rowLabels) {
      const y = (index + 0.5) * gridSize - gap / 2;
      axisSvg.push(line(-AXIS_GAP, y, -AXIS_GAP - tickLength, y));
    }
  }

  const interactive = options.interactive ?? true;
  return renderDocument({
    bounds,
    padding,
    title,
    isDark: options.dark ?? false,
    styleTag: interactive ? renderFlatStyleTag(options.animated ?? true) : '',
    defs: '',
    body: [
      ...axisSvg,
      ...cells,
      `<g class="iso-col-labels">${colSvg.join('\n')}</g>`,
      `<g class="iso-row-labels">${rowSvg.join('\n')}</g>`
    ].join('\n'),
    wrapper: options.wrapper ?? 'svg',
    creator: options.creator,
    comment: options.generatorComment ?? 'Generated with MLC Heatmap Library',
    fallbackTitle: 'MLC Heatmap'
  });
}
