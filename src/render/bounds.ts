/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { HeatmapDataPoint, HeightGridOptions, HeatmapShape } from '../data/types';
import { GeometryConfig, getGridIntersection, getBarVertices, getRibbonPoints } from './geometry';

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function calculateBounds(params: {
  cols: number;
  rows: number;
  minValue: number;
  maxAbsValue: number;
  maxHeight: number;
  shape: HeatmapShape | HeatmapShape[] | ((row: number) => HeatmapShape);
  renderFlatZero: boolean;
  colLabels?: string[];
  rowLabels?: string[];
  colLabelInterval: number;
  rowLabelInterval: number;
  labelPosition: 'behind' | 'front';
  geometryConfig: GeometryConfig;
  getPoint: (col: number, row: number) => HeatmapDataPoint;
  heightGrid?: HeightGridOptions;
}): Bounds {
  const {
    cols,
    rows,
    minValue,
    maxAbsValue,
    maxHeight,
    shape,
    renderFlatZero,
    colLabels,
    rowLabels,
    colLabelInterval,
    rowLabelInterval,
    labelPosition,
    geometryConfig,
    getPoint,
    heightGrid
  } = params;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  // Inline-Funktion für Performance leicht optimiert (Vermeidung von Overhead)
  function updateBounds(x: number, y: number) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const getShapeForRow = (rowIdx: number): HeatmapShape => {
    if (typeof shape === 'function') {
      return shape(rowIdx);
    }
    if (Array.isArray(shape)) {
      return shape[rowIdx] ?? 'prism';
    }
    return shape ?? 'prism';
  };

  // Vorberechnete Konstanten auslagern
  const hasMaxAbsValue = maxAbsValue > 0;
  const invMaxAbsValue = hasMaxAbsValue ? 1 / maxAbsValue : 0;
  const thickness = Math.max(3, maxHeight * 0.1);

  // 1. Grid intersection bounds
  for (let c = 0; c <= cols; c++) {
    for (let r = 0; r <= rows; r++) {
      const pt = getGridIntersection(c, r, geometryConfig);
      updateBounds(pt.x, pt.y);
    }
  }

  // 2. Bar height bounds
  for (let r = 0; r < rows; r++) {
    const rShape = getShapeForRow(r);
    const isRibbonShape = rShape === 'ribbon' || rShape === 'flatribbon';
    const isMeshShape = rShape === 'mesh';
    const isFlatBand = rShape === 'flatribbon';

    // Zeilenweises Caching der Werte, um mehrfache getPoint-Aufrufe bei Ribbons zu verhindern
    const rowValues: (number | null)[] = new Array(cols);
    for (let c = 0; c < cols; c++) {
      rowValues[c] = getPoint(c, r).value;
    }

    for (let c = 0; c < cols; c++) {
      const val = rowValues[c];
      if (val === null) continue;

      const h = hasMaxAbsValue ? (val * invMaxAbsValue) * maxHeight : 0;
      if (h === 0 && !renderFlatZero) continue;

      if (isMeshShape) {
        const px = (c * geometryConfig.gridSize - r * geometryConfig.gridSize) * geometryConfig.cosAngle;
        const py = (c * geometryConfig.gridSize + r * geometryConfig.gridSize) * geometryConfig.sinAngle - h;
        updateBounds(px, py);
      } else if (isRibbonShape) {
        if (h !== 0) {
          // Nutzen des Zeilen-Caches statt erneuter getPoint-Aufrufe
          const vPrev = c > 0 ? rowValues[c - 1] : 0;
          const vNext = c < cols - 1 ? rowValues[c + 1] : 0;

          const hPrev = vPrev === null ? 0 : vPrev;
          const hNext = vNext === null ? 0 : vNext;

          const valPrev = hPrev !== 0 && hasMaxAbsValue ? (hPrev * invMaxAbsValue) * maxHeight : 0;
          const valNext = hNext !== 0 && hasMaxAbsValue ? (hNext * invMaxAbsValue) * maxHeight : 0;

          const h_start = valPrev !== 0 ? (valPrev + h) * 0.5 : 0;
          const h_end = valNext !== 0 ? (h + valNext) * 0.5 : 0;

          // Punkte für Oberseite berechnen
          const ptsStart = getRibbonPoints(c, r, h_start, geometryConfig);
          const ptsMid = getRibbonPoints(c + 0.5, r, h, geometryConfig);
          const ptsEnd = getRibbonPoints(c + 1, r, h_end, geometryConfig);

          updateBounds(ptsStart.back.x, ptsStart.back.y);
          updateBounds(ptsStart.front.x, ptsStart.front.y);
          updateBounds(ptsMid.back.x, ptsMid.back.y);
          updateBounds(ptsMid.front.x, ptsMid.front.y);
          updateBounds(ptsEnd.back.x, ptsEnd.back.y);
          updateBounds(ptsEnd.front.x, ptsEnd.front.y);

          // Floor/Bottom bounds
          const h_start_bottom = isFlatBand ? (h_start - thickness) : 0;
          const h_mid_bottom = isFlatBand ? (h - thickness) : 0;
          const h_end_bottom = isFlatBand ? (h_end - thickness) : 0;

          const ptsStartFloor = getRibbonPoints(c, r, h_start_bottom, geometryConfig);
          const ptsMidFloor = getRibbonPoints(c + 0.5, r, h_mid_bottom, geometryConfig);
          const ptsEndFloor = getRibbonPoints(c + 1, r, h_end_bottom, geometryConfig);

          updateBounds(ptsStartFloor.back.x, ptsStartFloor.back.y);
          updateBounds(ptsStartFloor.front.x, ptsStartFloor.front.y);
          updateBounds(ptsMidFloor.back.x, ptsMidFloor.back.y);
          updateBounds(ptsMidFloor.front.x, ptsMidFloor.front.y);
          updateBounds(ptsEndFloor.back.x, ptsEndFloor.back.y);
          updateBounds(ptsEndFloor.front.x, ptsEndFloor.front.y);
        } else {
          const vertices = getBarVertices(c, r, 0, geometryConfig);
          updateBounds(vertices.top.x, vertices.top.y);
          updateBounds(vertices.left.x, vertices.left.y);
          updateBounds(vertices.front.x, vertices.front.y);
          updateBounds(vertices.right.x, vertices.right.y);
        }
      } else {
        const h_top = h > 0 ? h : 0;
        const h_bottom = h < 0 ? h : 0;
        const verticesTop = getBarVertices(c, r, h_top, geometryConfig);
        const verticesBottom = getBarVertices(c, r, h_bottom, geometryConfig);

        updateBounds(verticesTop.top.x, verticesTop.top.y);
        updateBounds(verticesTop.left.x, verticesTop.left.y);
        updateBounds(verticesTop.front.x, verticesTop.front.y);
        updateBounds(verticesTop.right.x, verticesTop.right.y);

        updateBounds(verticesBottom.left.x, verticesBottom.left.y);
        updateBounds(verticesBottom.front.x, verticesBottom.front.y);
        updateBounds(verticesBottom.right.x, verticesBottom.right.y);
      }
    }
  }

  // Gemeinsame Variablen für Labels vorbereiten
  const offset = geometryConfig.gap * 0.5;
  const cosA = geometryConfig.cosAngle;
  const sinA = geometryConfig.sinAngle;
  const gSize = geometryConfig.gridSize;

  // 3. Column labels bounds
  if (colLabels) {
    const rLabel = labelPosition === 'front' ? rows + 0.5 : -1.2;
    const yStart = rLabel * gSize + offset;
    for (let c = 0; c < cols; c += colLabelInterval) {
      if (colLabels[c]) {
        const xStart = c * gSize + offset;
        const x = (xStart - yStart) * cosA;
        const y = (xStart + yStart) * sinA;
        updateBounds(x - 20, y - 10);
        updateBounds(x + 20, y + 10);
      }
    }
  }

  // 4. Row labels bounds
  if (rowLabels) {
    const hasHeightGrid = heightGrid && heightGrid.ticks > 0;
    const cLabel = (labelPosition === 'front' || hasHeightGrid) ? cols + 0.5 : -1.2;
    const xStart = cLabel * gSize + offset;
    for (let r = 0; r < rows; r += rowLabelInterval) {
      if (rowLabels[r]) {
        const yStart = r * gSize + offset;
        const x = (xStart - yStart) * cosA;
        const y = (xStart + yStart) * sinA;
        updateBounds(x - 30, y - 10);
        updateBounds(x + 30, y + 10);
      }
    }
  }

  // 5. Height grid bounds
  if (heightGrid && heightGrid.ticks > 0) {
    const pt0_floor = getGridIntersection(0, 0, geometryConfig);
    const ptR_floor = getGridIntersection(0, rows, geometryConfig);
    const heightMin = minValue < 0 ? -maxHeight : 0;
    const heightMax = maxHeight;

    updateBounds(pt0_floor.x, pt0_floor.y - heightMax);
    updateBounds(ptR_floor.x, ptR_floor.y - heightMax);
    updateBounds(pt0_floor.x, pt0_floor.y - heightMin);
    updateBounds(ptR_floor.x, ptR_floor.y - heightMin);

    // Labels are on the left, offset by about 45px for safety
    updateBounds(ptR_floor.x - 45, ptR_floor.y - heightMax);
    updateBounds(ptR_floor.x - 45, ptR_floor.y - heightMin);
  }

  return { minX, maxX, minY, maxY };
}
