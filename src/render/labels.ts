/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import type { GeometryConfig } from './geometry';
import type { LabelMode, RowLabelStyle } from '../data/types';
import { contrastingTextColor } from './color';
import { axisLabelAnchor, estimateTextWidth, labelGridPoint, type LabelLines } from './label-layout';

export interface ColLabelParams {
  colLabels: string[];
  colLabelInterval: number;
  cols: number;
  lines: LabelLines;
  labelMode: LabelMode;
  geometryConfig: GeometryConfig;
  labelColor: string;
  labelFontSize: number;
  escapeHtml: (str: string) => string;
  labelAngle?: number; // Rotation in degrees about the label anchor (default: 0). Positive = clockwise.
  labelLift?: number; // Vertical uplift in px for every label (default: 0). Wall height seats labels on the wall top.
}

interface AxisLabelParams {
  x: number;
  y: number;
  angle: number;
  textAnchor: 'start' | 'middle' | 'end';
  text: string;
  color: string;
  fontSize: number;
  fontFamily: string;
  background: string;
}

/** A label rotated about its anchor; `background` is drawn in the same rotated frame. */
export function renderAxisLabel(params: AxisLabelParams): string {
  const { x, y, angle, textAnchor, text, color, fontSize, fontFamily, background } = params;
  const baseline = (fontSize * 0.35).toFixed(2);
  return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle})">${background}<text x="0" y="${baseline}" fill="${color}" font-size="${fontSize}" font-family="${fontFamily}" text-anchor="${textAnchor}">${text}</text></g>`;
}

export function renderColLabels(params: ColLabelParams): string {
  const {
    colLabels,
    colLabelInterval,
    cols,
    lines,
    labelMode,
    geometryConfig,
    labelColor,
    labelFontSize,
    escapeHtml
  } = params;

  const colLabelsGroup: string[] = [];
  const colAngle = params.labelAngle ?? 0;
  const colLift = params.labelLift ?? 0;

  for (let c = 0; c < cols; c += colLabelInterval) {
    const label = colLabels[c];
    if (!label) continue;

    if (labelMode === 'axis') {
      const anchor = axisLabelAnchor('col', c, lines, geometryConfig);
      colLabelsGroup.push(renderAxisLabel({
        x: anchor.x,
        y: anchor.y - colLift,
        angle: colAngle,
        textAnchor: anchor.textAnchor,
        text: escapeHtml(label),
        color: labelColor,
        fontSize: labelFontSize,
        fontFamily: 'sans-serif',
        background: ''
      }));
      continue;
    }

    const { x, y } = labelGridPoint(c, lines.rLabel, geometryConfig);
    // Offset if front-side
    const adjustedY = (lines.rLabel > 0 ? y + 10 : y) - colLift;
    const rotate = colAngle !== 0 ? ` transform="rotate(${colAngle} ${x.toFixed(2)} ${adjustedY.toFixed(2)})"` : '';
    colLabelsGroup.push(
      `<text x="${x.toFixed(2)}" y="${adjustedY.toFixed(2)}" fill="${labelColor}" font-size="${labelFontSize}" font-family="sans-serif" text-anchor="middle"${rotate}>${escapeHtml(label)}</text>`
    );
  }

  return `<g class="iso-col-labels">${colLabelsGroup.join('\n')}</g>`;
}

export interface RowLabelParams {
  rowLabels: string[];
  rowLabelInterval: number;
  rows: number;
  lines: LabelLines;
  labelMode: LabelMode;
  geometryConfig: GeometryConfig;
  labelColor: string;
  labelFontSize: number;
  escapeHtml: (str: string) => string;
  rowLabelStyle?: RowLabelStyle;
  labelAngle?: number; // Rotation in degrees about the label anchor (default: 0). Positive = clockwise.
  labelLift?: number; // Vertical uplift in px for every label (default: 0). Wall height seats labels on the wall top.
}

export function renderRowLabels(params: RowLabelParams): string {
  const {
    rowLabels,
    rowLabelInterval,
    rows,
    lines,
    labelMode,
    geometryConfig,
    labelColor,
    labelFontSize,
    escapeHtml,
    rowLabelStyle
  } = params;

  const rowLabelsGroup: string[] = [];
  const rowAnchor = lines.rowSide === 'front' ? 'start' : 'end';
  const rowAngle = params.labelAngle ?? 0;
  const rowLift = params.labelLift ?? 0;
  // At +/-90 degrees the text runs perpendicular to the anchor direction, so an
  // end/start anchor would hang the whole string off the axis point. Center it
  // instead: the pill then straddles the iso edge line of its row.
  const verticalText = rowAngle === 90 || rowAngle === -90;
  const effectiveRowAnchor = verticalText ? 'middle' : rowAnchor;

  // Extract styling values or fallback to default
  const styleFontSize = rowLabelStyle?.fontSize ?? labelFontSize;
  const styleFontFamily = rowLabelStyle?.fontFamily ?? 'sans-serif';
  const padding = rowLabelStyle?.padding ?? 4;
  const rx = rowLabelStyle?.borderRadius ?? 2;
  const bgOpacity = rowLabelStyle?.backgroundOpacity ?? 0.8;

  let styleColor = rowLabelStyle?.color;
  if (!styleColor) {
    styleColor = rowLabelStyle?.backgroundColor
      ? contrastingTextColor(rowLabelStyle.backgroundColor)
      : labelColor;
  }

  for (let r = 0; r < rows; r += rowLabelInterval) {
    const label = rowLabels[r];
    if (!label) continue;

    const textWidth = estimateTextWidth(label, styleFontSize);
    const rectW = textWidth + 2 * padding;
    const rectH = styleFontSize + 2 * padding;

    if (labelMode === 'axis') {
      const anchor = axisLabelAnchor('row', r, lines, geometryConfig);
      const rectX = anchor.textAnchor === 'end' ? -textWidth - padding : -padding;
      const background = rowLabelStyle?.backgroundColor
        ? `<rect x="${rectX.toFixed(2)}" y="${(-rectH / 2).toFixed(2)}" width="${rectW.toFixed(2)}" height="${rectH.toFixed(2)}" rx="${rx}" fill="${rowLabelStyle.backgroundColor}" opacity="${bgOpacity}" />`
        : '';
      rowLabelsGroup.push(renderAxisLabel({
        x: anchor.x,
        y: anchor.y - rowLift,
        angle: rowAngle,
        textAnchor: anchor.textAnchor,
        text: escapeHtml(label),
        color: styleColor,
        fontSize: styleFontSize,
        fontFamily: styleFontFamily,
        background
      }));
      continue;
    }

    const { x, y } = labelGridPoint(lines.cLabel, r, geometryConfig);
    const adjustedX = lines.rowSide === 'front' ? x + 6 : x - 6;
    // Adjust alignment slightly for background boxes vs plain text
    const adjustedY = y + (styleFontSize * 0.3) - rowLift;

    const rowParts: string[] = [];
    if (rowLabelStyle?.backgroundColor) {
      const rectX = effectiveRowAnchor === 'middle' ? adjustedX - textWidth / 2 - padding : rowAnchor === 'end' ? adjustedX - textWidth - padding : adjustedX - padding;
      const rectY = adjustedY - styleFontSize + (styleFontSize * 0.1) - padding;
      rowParts.push(
        `<rect x="${rectX.toFixed(2)}" y="${rectY.toFixed(2)}" width="${rectW.toFixed(2)}" height="${rectH.toFixed(2)}" rx="${rx}" fill="${rowLabelStyle.backgroundColor}" opacity="${bgOpacity}" />`
      );
    }

    rowParts.push(
      `<text x="${adjustedX.toFixed(2)}" y="${adjustedY.toFixed(2)}" fill="${styleColor}" font-size="${styleFontSize}" font-family="${styleFontFamily}" text-anchor="${effectiveRowAnchor}">${escapeHtml(label)}</text>`
    );
    if (rowAngle !== 0) {
      rowLabelsGroup.push(
        `<g transform="rotate(${rowAngle} ${adjustedX.toFixed(2)} ${adjustedY.toFixed(2)})">${rowParts.join('')}</g>`
      );
    } else {
      rowLabelsGroup.push(rowParts.join(''));
    }
  }

  return `<g class="iso-row-labels">${rowLabelsGroup.join('\n')}</g>`;
}

/**
 * Text lying flat on a bar's top face, sheared into the floor plane. It belongs
 * inside the bar's group so taller bars in front paint over it like over the bar.
 */
export function renderFaceText(params: {
  c: number;
  r: number;
  h: number;
  text: string;
  color: string;
  geometryConfig: GeometryConfig;
  escapeHtml: (str: string) => string;
}): string {
  const { c, r, h, text, color, geometryConfig, escapeHtml } = params;
  const { gridSize, cosAngle, sinAngle } = geometryConfig;
  const x = (c - r) * gridSize * cosAngle;
  const y = (c + r + 1) * gridSize * sinAngle - h;
  const fontSize = gridSize * 0.38;
  const matrix = `matrix(${cosAngle.toFixed(4)} ${sinAngle.toFixed(4)} ${(-cosAngle).toFixed(4)} ${sinAngle.toFixed(4)} ${x.toFixed(2)} ${y.toFixed(2)})`;
  return `<text class="iso-face-text" transform="${matrix}" y="${(fontSize * 0.35).toFixed(2)}" fill="${color}" font-size="${fontSize.toFixed(2)}" font-weight="600" font-family="sans-serif" text-anchor="middle">${escapeHtml(text)}</text>`;
}
