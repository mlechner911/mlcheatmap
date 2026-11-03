/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { HeatmapDataPoint, HeightGridOptions, HeatmapShape, RowLabelStyle } from '../data/types';
import { GeometryConfig, getGridIntersection, getBarVertices, getRibbonPoints, shapeForRow } from './geometry';
import type { LabelMode } from '../data/types';
import type { LabelLines } from './label-layout';
import { visitLabelBounds } from './label-bounds';

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
  showRowLabels?: boolean;
  rowLabelStyle?: RowLabelStyle;
  lines: LabelLines;
  labelMode: LabelMode;
  labelFontSize: number;
  gridCells: 'all' | 'data';
  geometryConfig: GeometryConfig;
  getPoint: (col: number, row: number) => HeatmapDataPoint;
  heightGrid?: HeightGridOptions;
  axisWallHeight?: number;
  colLabelAngle?: number;
  rowLabelAngle?: number;
  labelLift?: number;
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
    showRowLabels,
    rowLabelStyle,
    lines,
    labelMode,
    labelFontSize,
    gridCells,
    geometryConfig,
    getPoint,
    heightGrid,
    axisWallHeight,
    colLabelAngle,
    rowLabelAngle,
    labelLift
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

  function updateRibbon(...sections: { back: { x: number; y: number }; front: { x: number; y: number } }[]) {
    for (const { back, front } of sections) {
      updateBounds(back.x, back.y);
      updateBounds(front.x, front.y);
    }
  }

  // Vorberechnete Konstanten auslagern
  const hasMaxAbsValue = maxAbsValue > 0;
  const invMaxAbsValue = hasMaxAbsValue ? 1 / maxAbsValue : 0;
  const thickness = Math.max(3, maxHeight * 0.1);

  // 1. Grid intersection bounds
  // With floor lines only under data, an empty corner must not widen the picture.
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (gridCells === 'data' && getPoint(c, r).value === null) continue;
      for (const [dc, dr] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const pt = getGridIntersection(c + dc, r + dr, geometryConfig);
        updateBounds(pt.x, pt.y);
      }
    }
  }
  if (minX === Infinity) {
    updateBounds(0, 0);
  }

  // 2. Bar height bounds
  for (let r = 0; r < rows; r++) {
    const rShape = shapeForRow(shape, r);
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

          updateRibbon(ptsStart, ptsMid, ptsEnd);

          // Floor/Bottom bounds
          const h_start_bottom = isFlatBand ? (h_start - thickness) : 0;
          const h_mid_bottom = isFlatBand ? (h - thickness) : 0;
          const h_end_bottom = isFlatBand ? (h_end - thickness) : 0;

          const ptsStartFloor = getRibbonPoints(c, r, h_start_bottom, geometryConfig);
          const ptsMidFloor = getRibbonPoints(c + 0.5, r, h_mid_bottom, geometryConfig);
          const ptsEndFloor = getRibbonPoints(c + 1, r, h_end_bottom, geometryConfig);

          updateRibbon(ptsStartFloor, ptsMidFloor, ptsEndFloor);
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

  // 3. Label bounds
  visitLabelBounds({
    cols,
    rows,
    colLabels,
    rowLabels,
    colLabelInterval,
    rowLabelInterval,
    showRowLabels,
    rowLabelStyle,
    lines,
    labelMode,
    labelFontSize,
    geometryConfig,
    colLabelAngle,
    rowLabelAngle,
    labelLift,
    visit: updateBounds,
  });

  // 4. Height grid bounds
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

  // 5. Axis back walls (rise above the floor along both rear edges)
  if (axisWallHeight && axisWallHeight > 0) {
    const pt0 = getGridIntersection(0, 0, geometryConfig);
    const ptC = getGridIntersection(cols, 0, geometryConfig);
    const ptR = getGridIntersection(0, rows, geometryConfig);
    updateBounds(pt0.x, pt0.y - axisWallHeight);
    updateBounds(ptC.x, ptC.y - axisWallHeight);
    updateBounds(ptR.x, ptR.y - axisWallHeight);
  }

  return { minX, maxX, minY, maxY };
}
