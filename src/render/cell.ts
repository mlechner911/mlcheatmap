/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import type { CustomColorScheme, HeatmapDataPoint, HeatmapOptions } from '../data/types';
import { contrastingTextColor, getColorForValue, shadeHex } from './color';
import { type GeometryConfig, getBarVertices, getRibbonPoints, shapeForRow } from './geometry';
import { renderFaceText } from './labels';
import { renderMeshQuad } from './mesh';
import { renderCylinder } from './cylinder';
import { renderFlatCell, renderPrism } from './prism';
import { renderRibbon } from './ribbon';
import { escapeHtml } from './svg-document';

export interface CellContext {
  options: HeatmapOptions;
  cols: number;
  rows: number;
  maxAbsValue: number;
  maxHeight: number;
  theme: CustomColorScheme;
  negativeTheme: CustomColorScheme;
  opacity: number;
  renderFlatZero: boolean;
  interactive: boolean;
  animated: boolean;
  geometryConfig: GeometryConfig;
  getPoint: (col: number, row: number) => HeatmapDataPoint;
  uniqueColors: Set<string>;
}

/** One mesh patch between this cell and its three neighbours; empty at the edge or next to a gap. */
function renderMeshCell(c: number, r: number, value: number, inlineStyle: string, ctx: CellContext): string {
  const { options, cols, rows, maxAbsValue, maxHeight, getPoint } = ctx;
  if (c >= cols - 1 || r >= rows - 1) {
    return '';
  }
  const pt1 = getPoint(c + 1, r);
  const pt2 = getPoint(c + 1, r + 1);
  const pt3 = getPoint(c, r + 1);
  if (pt1.value === null || pt2.value === null || pt3.value === null) {
    return '';
  }

  const toHeight = (v: number): number => (maxAbsValue > 0 ? (v / maxAbsValue) * maxHeight : 0);
  const avgVal = (value + pt1.value + pt2.value + pt3.value) / 4;
  const titleText = `Cols ${c}-${c + 1}, Rows ${r}-${r + 1}: Avg Value ${avgVal.toFixed(1)}`;
  const titleTag = ctx.interactive ? `<title>${escapeHtml(titleText)}</title>` : '';

  const quadPolygon = renderMeshQuad({
    c,
    r,
    h0: toHeight(value),
    h1: toHeight(pt1.value),
    h2: toHeight(pt2.value),
    h3: toHeight(pt3.value),
    v0: value,
    v1: pt1.value,
    v2: pt2.value,
    v3: pt3.value,
    maxAbsValue,
    theme: ctx.theme,
    negativeTheme: ctx.negativeTheme,
    interpolateColors: options.interpolateColors,
    geometryConfig: ctx.geometryConfig,
    opacity: ctx.opacity,
    titleTag: '',
    inlineStyle: '',
    triangulateMesh: options.triangulateMesh,
    useSvg2Mesh: options.useSvg2Mesh,
    shading: options.shading
  });

  return `<g class="iso-bar" data-col="${c}" data-row="${r}" data-value="${avgVal.toFixed(2)}"${inlineStyle}>
              ${titleTag}
              ${quadPolygon}
            </g>`;
}

/** The color a value shows in, unless the point brings its own. */
export function cellColor(
  pt: HeatmapDataPoint & { value: number },
  ctx: Pick<CellContext, 'options' | 'maxAbsValue' | 'theme' | 'negativeTheme'>
): string {
  const { options, maxAbsValue, theme, negativeTheme } = ctx;
  if (pt.color) return pt.color;
  if (pt.value === 0 && options.zeroColor) return options.zeroColor;
  return getColorForValue(pt.value, maxAbsValue, theme, negativeTheme, options.interpolateColors);
}

/** The tooltip of a cell: formatter first, then the label of the point. */
export function cellTooltip(pt: HeatmapDataPoint, options: HeatmapOptions): string {
  return options.tooltipFormatter?.(pt) ?? pt.label ?? `Col ${pt.col}, Row ${pt.row}: ${pt.value}`;
}

/** The bar, surface or band of one cell, or an empty string when it draws nothing. */
export function renderCell(pt: HeatmapDataPoint, c: number, r: number, ctx: CellContext): string {
  if (pt.value === null) {
    return '';
  }
  const { options, cols, maxAbsValue, maxHeight, opacity, renderFlatZero, interactive, animated, geometryConfig, getPoint, uniqueColors } = ctx;
  const { gridSize, gap, cosAngle, sinAngle } = geometryConfig;

  const h = maxAbsValue > 0 ? (pt.value / maxAbsValue) * maxHeight : 0;
  const hTop = Math.max(0, h);
  const verticesTop = getBarVertices(c, r, hTop, geometryConfig);
  const verticesBottom = getBarVertices(c, r, Math.min(0, h), geometryConfig);

  const baseColor = cellColor({ ...pt, value: pt.value }, ctx);
  const colors = {
    top: baseColor,
    left: shadeHex(baseColor, 0.85),
    right: shadeHex(baseColor, 0.70)
  };

  const titleText = cellTooltip({ ...pt, col: c, row: r }, options);
  const titleTag = interactive ? `<title>${escapeHtml(titleText)}</title>` : '';
  const delay = (c + r) * 15;
  const origin = pt.value < 0 ? 'top' : 'bottom';
  const inlineStyle = (interactive && animated) ? ` style="animation-delay: ${delay}ms; transform-origin: ${origin};"` : '';

  const shape = shapeForRow(options.shape, r);
  let barSvg = '';
  if (shape === 'mesh') {
    barSvg = renderMeshCell(c, r, pt.value, inlineStyle, ctx);
  } else if (shape === 'cylinder') {
    barSvg = renderCylinder(c, r, pt.value, h, baseColor, colors, verticesTop, verticesBottom, gridSize - gap, cosAngle, sinAngle, opacity, renderFlatZero, titleTag, inlineStyle, uniqueColors);
  } else if (shape === 'ribbon' || shape === 'flatribbon') {
    if (h !== 0) {
      barSvg = renderRibbon(c, r, pt.value, h, colors, opacity, titleTag, inlineStyle, cols, maxAbsValue, maxHeight, getPoint, (cFraction, row, height) => getRibbonPoints(cFraction, row, height, geometryConfig), shape === 'flatribbon');
    } else if (renderFlatZero) {
      barSvg = renderFlatCell(c, r, pt.value, colors.top, verticesTop, opacity, titleTag, inlineStyle);
    }
  } else {
    barSvg = renderPrism(c, r, pt.value, h, colors, verticesTop, verticesBottom, opacity, renderFlatZero, titleTag, inlineStyle);
  }

  if (barSvg && pt.faceText && (shape === 'prism' || shape === 'cylinder')) {
    const faceText = renderFaceText({
      c,
      r,
      h: hTop,
      text: pt.faceText,
      color: contrastingTextColor(baseColor),
      geometryConfig,
      escapeHtml
    });
    const groupEnd = barSvg.lastIndexOf('</g>');
    return barSvg.slice(0, groupEnd) + faceText + barSvg.slice(groupEnd);
  }
  return barSvg;
}
