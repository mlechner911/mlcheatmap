/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import type { GeometryConfig } from './geometry';
import type { LabelMode } from '../data/types';

export type LabelSide = 'behind' | 'front';

/** Width of one character as a share of the font size; SVG strings cannot be measured here. */
const CHAR_WIDTH_EM = 0.55;
/** Minimum free space between two neighbouring labels in px. */
const LABEL_CLEARANCE = 2;

/** The grid lines labels sit on, and the side of the grid they are on. */
export interface LabelLines {
  colSide: LabelSide;
  rowSide: LabelSide;
  rLabel: number;
  cLabel: number;
}

export function getLabelLines(params: {
  cols: number;
  rows: number;
  labelPosition: LabelSide;
  hasHeightGrid: boolean;
  labelMode: LabelMode;
}): LabelLines {
  const { cols, rows, labelPosition, hasHeightGrid, labelMode } = params;
  // Axis labels run away from the grid and can start right at its edge.
  const beyondEnd = labelMode === 'axis' ? 0.2 : 0.5;
  const beforeStart = labelMode === 'axis' ? -0.2 : -1.2;
  // The height grid wall occupies the rear row edge, so row labels move to the front.
  const rowSide: LabelSide = labelPosition === 'front' || hasHeightGrid ? 'front' : 'behind';
  return {
    colSide: labelPosition,
    rowSide,
    rLabel: labelPosition === 'front' ? rows + beyondEnd : beforeStart,
    cLabel: rowSide === 'front' ? cols + beyondEnd : beforeStart,
  };
}

/** Projects a (possibly fractional) grid position to the point labels are anchored to. */
export function labelGridPoint(
  c: number,
  r: number,
  config: GeometryConfig
): { x: number; y: number } {
  const { gridSize, gap, cosAngle, sinAngle } = config;
  const xStart = c * gridSize + gap / 2;
  const yStart = r * gridSize + gap / 2;
  return {
    x: (xStart - yStart) * cosAngle,
    y: (xStart + yStart) * sinAngle,
  };
}

/** Anchor of a label in `axis` mode: centered on its cell, reading away from the grid or towards it. */
export function axisLabelAnchor(
  axis: 'col' | 'row',
  index: number,
  lines: LabelLines,
  config: GeometryConfig
): { x: number; y: number; textAnchor: 'start' | 'end' } {
  if (axis === 'col') {
    return {
      ...labelGridPoint(index + 0.5, lines.rLabel, config),
      // Text rises to the right, so on the front edge it ends at the grid.
      textAnchor: lines.colSide === 'front' ? 'end' : 'start',
    };
  }
  return {
    ...labelGridPoint(lines.cLabel, index + 0.5, config),
    // Text falls to the right, so on the front edge it starts at the grid.
    textAnchor: lines.rowSide === 'front' ? 'start' : 'end',
  };
}

export function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * CHAR_WIDTH_EM;
}

/** Screen-space corners of a rotated label box around its anchor. */
export function axisLabelCorners(params: {
  x: number;
  y: number;
  angleDeg: number;
  textAnchor: 'start' | 'middle' | 'end';
  width: number;
  height: number;
}): { x: number; y: number }[] {
  const { x, y, angleDeg, textAnchor, width, height } = params;
  const a = (angleDeg * Math.PI) / 180;
  const left = textAnchor === 'end' ? -width : textAnchor === 'middle' ? -width / 2 : 0;
  const localCorners = [
    [left, -height / 2],
    [left + width, -height / 2],
    [left + width, height / 2],
    [left, height / 2],
  ];
  return localCorners.map(([u, v]) => ({
    x: x + u * Math.cos(a) - v * Math.sin(a),
    y: y + u * Math.sin(a) + v * Math.cos(a),
  }));
}

/**
 * Smallest label step (in cells) that keeps neighbouring labels apart.
 * Two equal, parallel boxes are clear of each other once their offset exceeds
 * the box along the reading direction or across it, so one of both suffices.
 */
export function requiredLabelStep(params: {
  labels: readonly string[];
  axis: 'col' | 'row';
  fontSize: number;
  padding: number;
  angleDeg: number;
  config: GeometryConfig;
}): number {
  const { labels, axis, fontSize, padding, angleDeg, config } = params;
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 0);
  const width = longest * fontSize * CHAR_WIDTH_EM + 2 * padding + LABEL_CLEARANCE;
  const height = fontSize + 2 * padding + LABEL_CLEARANCE;

  const a = (angleDeg * Math.PI) / 180;
  const dx = config.gridSize * config.cosAngle * (axis === 'col' ? 1 : -1);
  const dy = config.gridSize * config.sinAngle;
  const along = Math.abs(dx * Math.cos(a) + dy * Math.sin(a));
  const across = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));

  const stepAlong = along > 0 ? Math.ceil(width / along) : Infinity;
  const stepAcross = across > 0 ? Math.ceil(height / across) : Infinity;
  return Math.max(1, Math.min(stepAlong, stepAcross));
}

/** Blanks labels that are closer than `step` cells to the previously kept one. */
export function thinLabels(labels: readonly string[], step: number): string[] {
  let nextFree = 0;
  return labels.map((label, index) => {
    if (!label || index < nextFree) return '';
    nextFree = index + step;
    return label;
  });
}
