import { HeatmapDataPoint } from '../data/types';
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
  maxAbsValue: number;
  maxHeight: number;
  shape: 'prism' | 'cylinder' | 'ribbon';
  renderFlatZero: boolean;
  colLabels?: string[];
  rowLabels?: string[];
  colLabelInterval: number;
  rowLabelInterval: number;
  labelPosition: 'behind' | 'front';
  geometryConfig: GeometryConfig;
  getPoint: (col: number, row: number) => HeatmapDataPoint;
}): Bounds {
  const {
    cols,
    rows,
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
    getPoint
  } = params;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  function updateBounds(x: number, y: number) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // 1. Grid intersection bounds
  for (let c = 0; c <= cols; c++) {
    for (let r = 0; r <= rows; r++) {
      const pt = getGridIntersection(c, r, geometryConfig);
      updateBounds(pt.x, pt.y);
    }
  }

  // 2. Bar height bounds
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const pt = getPoint(c, r);
      if (pt.value === null) {
        continue;
      }
      const h = maxAbsValue > 0 ? (pt.value / maxAbsValue) * maxHeight : 0;
      if (h === 0 && !renderFlatZero) {
        continue;
      }

      if (shape === 'ribbon') {
        if (h !== 0) {
          const vPrev = c > 0 ? getPoint(c - 1, r).value : 0;
          const vNext = c < cols - 1 ? getPoint(c + 1, r).value : 0;

          const hPrev = vPrev === null ? 0 : vPrev;
          const hNext = vNext === null ? 0 : vNext;

          const valPrev = hPrev !== 0 && maxAbsValue > 0 ? (hPrev / maxAbsValue) * maxHeight : 0;
          const valNext = hNext !== 0 && maxAbsValue > 0 ? (hNext / maxAbsValue) * maxHeight : 0;

          const h_start = valPrev !== 0 ? (valPrev + h) / 2 : 0;
          const h_mid = h;
          const h_end = valNext !== 0 ? (h + valNext) / 2 : 0;

          const ptsStart = getRibbonPoints(c, r, h_start, geometryConfig);
          const ptsMid = getRibbonPoints(c + 0.5, r, h_mid, geometryConfig);
          const ptsEnd = getRibbonPoints(c + 1, r, h_end, geometryConfig);

          updateBounds(ptsStart.back.x, ptsStart.back.y);
          updateBounds(ptsStart.front.x, ptsStart.front.y);
          updateBounds(ptsMid.back.x, ptsMid.back.y);
          updateBounds(ptsMid.front.x, ptsMid.front.y);
          updateBounds(ptsEnd.back.x, ptsEnd.back.y);
          updateBounds(ptsEnd.front.x, ptsEnd.front.y);

          // Floor bounds
          const ptsStartFloor = getRibbonPoints(c, r, 0, geometryConfig);
          const ptsEndFloor = getRibbonPoints(c + 1, r, 0, geometryConfig);
          updateBounds(ptsStartFloor.back.x, ptsStartFloor.back.y);
          updateBounds(ptsStartFloor.front.x, ptsStartFloor.front.y);
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
        const h_top = Math.max(0, h);
        const h_bottom = Math.min(0, h);
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

  // 3. Column labels bounds
  const offset = geometryConfig.gap / 2;
  const rLabel = labelPosition === 'front' ? rows + 0.5 : -1.2;
  if (colLabels) {
    for (let c = 0; c < cols; c += colLabelInterval) {
      if (colLabels[c]) {
        const xStart = c * geometryConfig.gridSize + offset;
        const yStart = rLabel * geometryConfig.gridSize + offset;
        const x = (xStart - yStart) * geometryConfig.cosAngle;
        const y = (xStart + yStart) * geometryConfig.sinAngle;
        updateBounds(x - 20, y - 10);
        updateBounds(x + 20, y + 10);
      }
    }
  }

  // 4. Row labels bounds
  const cLabel = labelPosition === 'front' ? cols + 0.5 : -1.2;
  if (rowLabels) {
    for (let r = 0; r < rows; r += rowLabelInterval) {
      if (rowLabels[r]) {
        const xStart = cLabel * geometryConfig.gridSize + offset;
        const yStart = r * geometryConfig.gridSize + offset;
        const x = (xStart - yStart) * geometryConfig.cosAngle;
        const y = (xStart + yStart) * geometryConfig.sinAngle;
        updateBounds(x - 30, y - 10);
        updateBounds(x + 30, y + 10);
      }
    }
  }

  return { minX, maxX, minY, maxY };
}
