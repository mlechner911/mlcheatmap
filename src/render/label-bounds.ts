/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import type { LabelMode, RowLabelStyle } from '../data/types';
import type { GeometryConfig } from './geometry';
import { axisLabelAnchor, axisLabelCorners, estimateTextWidth, labelGridPoint, type LabelLines } from './label-layout';

// Half-extents of a (possibly rotated) label box around its anchor point
function labelMargins(textLen: number, fontSize: number, angleDeg: number | undefined, pad: number): [number, number] {
  const w = textLen * fontSize * 0.55 + pad;
  const h = fontSize + pad;
  const a = Math.abs(((angleDeg ?? 0) * Math.PI) / 180);
  const hw = Math.max(20, (w * Math.abs(Math.cos(a)) + h * Math.abs(Math.sin(a))) / 2 + 4);
  const hh = Math.max(10, (w * Math.abs(Math.sin(a)) + h * Math.abs(Math.cos(a))) / 2 + 4);
  return [hw, hh];
}

/** Reports the points the axis labels reach, so the picture can make room for them. */
export function visitLabelBounds(params: {
  cols: number;
  rows: number;
  colLabels?: string[];
  rowLabels?: string[];
  colLabelInterval: number;
  rowLabelInterval: number;
  showRowLabels?: boolean;
  rowLabelStyle?: RowLabelStyle;
  lines: LabelLines;
  labelMode: LabelMode;
  labelFontSize: number;
  geometryConfig: GeometryConfig;
  colLabelAngle?: number;
  rowLabelAngle?: number;
  labelLift?: number;
  visit: (x: number, y: number) => void;
}): void {
  const { cols, rows, colLabels, rowLabels, colLabelInterval, rowLabelInterval, showRowLabels, rowLabelStyle, lines, labelMode, labelFontSize, geometryConfig, colLabelAngle, rowLabelAngle, visit } = params;
  const lift = params.labelLift ?? 0;

  const visitAxisLabel = (axis: 'col' | 'row', index: number, angleDeg: number | undefined, width: number, height: number): void => {
    const anchor = axisLabelAnchor(axis, index, lines, geometryConfig);
    const corners = axisLabelCorners({
      x: anchor.x,
      y: anchor.y - lift,
      angleDeg: angleDeg ?? 0,
      textAnchor: anchor.textAnchor,
      width,
      height,
    });
    for (const corner of corners) {
      visit(corner.x, corner.y);
    }
  };

  if (colLabels) {
    for (let c = 0; c < cols; c += colLabelInterval) {
      const label = colLabels[c];
      if (!label) continue;
      if (labelMode === 'axis') {
        visitAxisLabel('col', c, colLabelAngle, estimateTextWidth(label, labelFontSize), labelFontSize);
        continue;
      }
      const point = labelGridPoint(c, lines.rLabel, geometryConfig);
      const y = point.y - lift;
      const [hw, hh] = labelMargins(label.length, labelFontSize, colLabelAngle, 0);
      visit(point.x - hw, y - hh);
      visit(point.x + hw, y + hh);
    }
  }

  if (rowLabels && showRowLabels !== false) {
    const styleFontSize = rowLabelStyle?.fontSize ?? labelFontSize;
    const padding = rowLabelStyle?.backgroundColor ? (rowLabelStyle.padding ?? 4) : 0;
    for (let r = 0; r < rows; r += rowLabelInterval) {
      const label = rowLabels[r];
      if (!label) continue;
      if (labelMode === 'axis') {
        visitAxisLabel('row', r, rowLabelAngle, estimateTextWidth(label, styleFontSize) + 2 * padding, styleFontSize + 2 * padding);
        continue;
      }
      const point = labelGridPoint(lines.cLabel, r, geometryConfig);
      const y = point.y - lift;
      // Approximate width based on font size and text length, then add padding and safety margins
      const [rotW, rotH] = labelMargins(label.length, styleFontSize, rowLabelAngle, padding);
      const horizontalMargin = Math.max(30, rotW);
      const verticalMargin = Math.max(10, rotH);
      visit(point.x - horizontalMargin, y - verticalMargin);
      visit(point.x + horizontalMargin, y + verticalMargin);
    }
  }
}
