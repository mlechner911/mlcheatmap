/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { GeometryConfig } from './geometry';

export interface ColLabelParams {
  colLabels: string[];
  colLabelInterval: number;
  cols: number;
  rLabel: number;
  geometryConfig: GeometryConfig;
  labelColor: string;
  labelFontSize: number;
  escapeHtml: (str: string) => string;
}

export function renderColLabels(params: ColLabelParams): string {
  const {
    colLabels,
    colLabelInterval,
    cols,
    rLabel,
    geometryConfig,
    labelColor,
    labelFontSize,
    escapeHtml
  } = params;

  const { gridSize, gap, cosAngle, sinAngle } = geometryConfig;
  const offset = gap / 2;
  const colLabelsGroup: string[] = [];
  const colAnchor = 'middle';

  for (let c = 0; c < cols; c += colLabelInterval) {
    const label = colLabels[c];
    if (label) {
      const xStart = c * gridSize + offset;
      const yStart = rLabel * gridSize + offset;
      const x = (xStart - yStart) * cosAngle;
      const y = (xStart + yStart) * sinAngle;

      const adjustedX = x;
      // Offset if front-side
      const adjustedY = rLabel > 0 ? y + 10 : y;

      colLabelsGroup.push(
        `<text x="${adjustedX.toFixed(2)}" y="${adjustedY.toFixed(2)}" fill="${labelColor}" font-size="${labelFontSize}" font-family="sans-serif" text-anchor="${colAnchor}">${escapeHtml(label)}</text>`
      );
    }
  }

  return `<g class="iso-col-labels">${colLabelsGroup.join('\n')}</g>`;
}

import { RowLabelStyle } from '../data/types';

function getContrastingColor(hex: string): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#1e293b' : '#ffffff';
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#1e293b' : '#ffffff';
  }
  return '#ffffff';
}

export interface RowLabelParams {
  rowLabels: string[];
  rowLabelInterval: number;
  rows: number;
  cLabel: number;
  geometryConfig: GeometryConfig;
  labelColor: string;
  labelFontSize: number;
  labelPosition: 'behind' | 'front';
  escapeHtml: (str: string) => string;
  rowLabelStyle?: RowLabelStyle;
}

export function renderRowLabels(params: RowLabelParams): string {
  const {
    rowLabels,
    rowLabelInterval,
    rows,
    cLabel,
    geometryConfig,
    labelColor,
    labelFontSize,
    labelPosition,
    escapeHtml,
    rowLabelStyle
  } = params;

  const { gridSize, gap, cosAngle, sinAngle } = geometryConfig;
  const offset = gap / 2;
  const rowLabelsGroup: string[] = [];
  const rowAnchor = labelPosition === 'front' ? 'start' : 'end';

  // Extract styling values or fallback to default
  const styleFontSize = rowLabelStyle?.fontSize ?? labelFontSize;
  const styleFontFamily = rowLabelStyle?.fontFamily ?? 'sans-serif';
  const padding = rowLabelStyle?.padding ?? 4;
  
  let styleColor = rowLabelStyle?.color;
  if (!styleColor) {
    if (rowLabelStyle?.backgroundColor) {
      styleColor = getContrastingColor(rowLabelStyle.backgroundColor);
    } else {
      styleColor = labelColor;
    }
  }

  for (let r = 0; r < rows; r += rowLabelInterval) {
    const label = rowLabels[r];
    if (label) {
      const xStart = cLabel * gridSize + offset;
      const yStart = r * gridSize + offset;
      const x = (xStart - yStart) * cosAngle;
      const y = (xStart + yStart) * sinAngle;

      const adjustedX = labelPosition === 'front' ? x + 6 : x - 6;
      // Adjust alignment slightly for background boxes vs plain text
      const adjustedY = y + (styleFontSize * 0.3);

      if (rowLabelStyle?.backgroundColor) {
        // Estimate text width
        const textWidth = label.length * styleFontSize * 0.55;
        const rectX = rowAnchor === 'end' ? adjustedX - textWidth - padding : adjustedX - padding;
        const rectY = adjustedY - styleFontSize + (styleFontSize * 0.1) - padding;
        const rectW = textWidth + 2 * padding;
        const rectH = styleFontSize + 2 * padding;
        const rx = rowLabelStyle.borderRadius ?? 2;
        const bgOpacity = rowLabelStyle.backgroundOpacity ?? 0.8;
        
        rowLabelsGroup.push(
          `<rect x="${rectX.toFixed(2)}" y="${rectY.toFixed(2)}" width="${rectW.toFixed(2)}" height="${rectH.toFixed(2)}" rx="${rx}" fill="${rowLabelStyle.backgroundColor}" opacity="${bgOpacity}" />`
        );
      }

      rowLabelsGroup.push(
        `<text x="${adjustedX.toFixed(2)}" y="${adjustedY.toFixed(2)}" fill="${styleColor}" font-size="${styleFontSize}" font-family="${styleFontFamily}" text-anchor="${rowAnchor}">${escapeHtml(label)}</text>`
      );
    }
  }

  return `<g class="iso-row-labels">${rowLabelsGroup.join('\n')}</g>`;
}

