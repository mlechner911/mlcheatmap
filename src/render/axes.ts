/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import type { HeightGridOptions } from '../data/types';
import { type GeometryConfig, getGridIntersection } from './geometry';
import { labelGridPoint, type LabelLines } from './label-layout';

function point(p: { x: number; y: number }): string {
  return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
}

/**
 * Vertical reference wall along the back-left grid edge: optional fill, dashed
 * row guides, and horizontal scale lines with their data values.
 */
export function renderHeightGridWall(params: {
  heightGrid: HeightGridOptions;
  rows: number;
  minValue: number;
  maxHeight: number;
  maxAbsValue: number;
  wallFill: string;
  gridColor: string;
  labelColor: string;
  labelFontSize: number;
  geometryConfig: GeometryConfig;
}): string[] {
  const { heightGrid, rows, minValue, maxHeight, maxAbsValue, labelFontSize, geometryConfig } = params;
  const elements: string[] = [];
  const ticksCount = heightGrid.ticks;
  const wallColor = heightGrid.wallColor ?? params.wallFill;
  const wallGridColor = heightGrid.gridColor ?? params.gridColor;
  const wallLabelColor = heightGrid.labelColor ?? params.labelColor;

  const heightMin = minValue < 0 ? -maxHeight : 0;
  const heightMax = maxHeight;
  const floorStart = getGridIntersection(0, 0, geometryConfig);
  const floorEnd = getGridIntersection(0, rows, geometryConfig);
  const lifted = (p: { x: number; y: number }, h: number): { x: number; y: number } => ({ x: p.x, y: p.y - h });

  if (heightGrid.solid !== false) {
    const corners = [
      lifted(floorStart, heightMax),
      lifted(floorEnd, heightMax),
      lifted(floorEnd, heightMin),
      lifted(floorStart, heightMin)
    ].map(point).join(' ');
    elements.push(`<polygon points="${corners}" fill="${wallColor}" stroke="none" />`);
  }

  // Vertical grid lines standing on the back-left edge, aligned with the rows
  for (let r = 0; r <= rows; r++) {
    const pt = getGridIntersection(0, r, geometryConfig);
    elements.push(`<line x1="${pt.x.toFixed(2)}" y1="${(pt.y - heightMin).toFixed(2)}" x2="${pt.x.toFixed(2)}" y2="${(pt.y - heightMax).toFixed(2)}" stroke="${wallGridColor}" stroke-width="0.5" stroke-dasharray="2,2" />`);
  }

  // Horizontal grid lines and scale labels
  for (let i = 0; i < ticksCount; i++) {
    const t = ticksCount > 1 ? i / (ticksCount - 1) : 1;
    const h = heightMin + t * (heightMax - heightMin);
    const tickVal = maxAbsValue > 0 ? (h / maxHeight) * maxAbsValue : 0;
    const start = lifted(floorStart, h);
    const end = lifted(floorEnd, h);

    elements.push(`<line x1="${start.x.toFixed(2)}" y1="${start.y.toFixed(2)}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" stroke="${wallGridColor}" stroke-width="0.5" />`);
    elements.push(`<text x="${(end.x - 8).toFixed(2)}" y="${(end.y + 3).toFixed(2)}" fill="${wallLabelColor}" font-size="${labelFontSize}" font-family="sans-serif" text-anchor="end">${Number(tickVal.toFixed(2)).toString()}</text>`);
  }
  return elements;
}

/** Translucent walls along both rear floor edges: a calm backdrop for the axis labels. */
export function renderAxisWalls(params: {
  cols: number;
  rows: number;
  wallHeight: number;
  wallFill: string;
  ruleColor: string;
  colLabels?: string[];
  rowLabels?: string[];
  colLabelInterval: number;
  rowLabelInterval: number;
  geometryConfig: GeometryConfig;
}): string {
  const { cols, rows, wallHeight, wallFill, ruleColor, colLabels, rowLabels, colLabelInterval, rowLabelInterval, geometryConfig } = params;
  const origin = getGridIntersection(0, 0, geometryConfig);
  const wall = (end: { x: number; y: number }): string =>
    `<polygon class="iso-axis-wall" points="${point(origin)} ${point(end)} ${end.x.toFixed(2)},${(end.y - wallHeight).toFixed(2)} ${origin.x.toFixed(2)},${(origin.y - wallHeight).toFixed(2)}" fill="${wallFill}" stroke="none" />`;
  const rule = (gp: { x: number; y: number }): string =>
    `<line class="iso-axis-wall-rule" x1="${gp.x.toFixed(2)}" y1="${gp.y.toFixed(2)}" x2="${gp.x.toFixed(2)}" y2="${(gp.y - wallHeight).toFixed(2)}" stroke="${ruleColor}" stroke-width="0.5" />`;

  const rules: string[] = [];
  if (colLabels) {
    for (let c = 0; c < cols; c += colLabelInterval) {
      if (colLabels[c]) rules.push(rule(getGridIntersection(c, 0, geometryConfig)));
    }
  }
  if (rowLabels) {
    for (let r = 0; r < rows; r += rowLabelInterval) {
      if (rowLabels[r]) rules.push(rule(getGridIntersection(0, r, geometryConfig)));
    }
  }
  const wallBack = wall(getGridIntersection(cols, 0, geometryConfig));
  const wallLeft = wall(getGridIntersection(0, rows, geometryConfig));
  return `<g class="iso-axis-walls">${wallBack}\n${wallLeft}\n${rules.join('\n')}</g>`;
}

/** Baseline axis rules at floor level, with ticks pointing to the label of each labeled line. */
export function renderAxis(params: {
  cols: number;
  rows: number;
  axisColor: string;
  axisWidth: number;
  tickLength: number;
  colLabels?: string[];
  rowLabels?: string[];
  colLabelInterval: number;
  rowLabelInterval: number;
  lines: LabelLines;
  geometryConfig: GeometryConfig;
}): string {
  const { cols, rows, axisColor, axisWidth, tickLength, colLabels, rowLabels, colLabelInterval, rowLabelInterval, lines, geometryConfig } = params;
  const stroke = `stroke="${axisColor}" stroke-width="${axisWidth}"`;

  const origin = getGridIntersection(0, 0, geometryConfig);
  const parts = [getGridIntersection(cols, 0, geometryConfig), getGridIntersection(0, rows, geometryConfig)].map(end =>
    `<line class="iso-axis-rule" x1="${origin.x.toFixed(2)}" y1="${origin.y.toFixed(2)}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" ${stroke} />`
  );

  const tickTowards = (from: { x: number; y: number }, to: { x: number; y: number }): void => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) return;
    parts.push(`<line class="iso-axis-tick" x1="${from.x.toFixed(2)}" y1="${from.y.toFixed(2)}" x2="${(from.x + (dx / len) * tickLength).toFixed(2)}" y2="${(from.y + (dy / len) * tickLength).toFixed(2)}" ${stroke} />`);
  };

  if (colLabels) {
    for (let c = 0; c < cols; c += colLabelInterval) {
      if (colLabels[c]) tickTowards(getGridIntersection(c, 0, geometryConfig), labelGridPoint(c, lines.rLabel, geometryConfig));
    }
  }
  if (rowLabels) {
    for (let r = 0; r < rows; r += rowLabelInterval) {
      if (rowLabels[r]) tickTowards(getGridIntersection(0, r, geometryConfig), labelGridPoint(lines.cLabel, r, geometryConfig));
    }
  }
  return `<g class="iso-axis">${parts.join('\n')}</g>`;
}
