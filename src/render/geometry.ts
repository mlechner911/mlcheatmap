/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

export interface GeometryConfig {
  gridSize: number;
  gap: number;
  cosAngle: number;
  sinAngle: number;
}

/**
 * Calculates top face vertices for a rectangular bar.
 */
export function getBarVertices(
  c: number,
  r: number,
  h: number,
  config: GeometryConfig
) {
  const { gridSize, gap, cosAngle, sinAngle } = config;
  const barSize = gridSize - gap;
  const offset = gap / 2;

  const xStart = c * gridSize + offset;
  const yStart = r * gridSize + offset;

  // Base coordinate
  const x0 = (xStart - yStart) * cosAngle;
  const y0 = (xStart + yStart) * sinAngle - h;

  const x1 = x0 - barSize * cosAngle;
  const y1 = y0 + barSize * sinAngle;

  const x2 = x0;
  const y2 = y0 + 2 * barSize * sinAngle;

  const x3 = x0 + barSize * cosAngle;
  const y3 = y0 + barSize * sinAngle;

  return {
    top: { x: x0, y: y0 },
    left: { x: x1, y: y1 },
    front: { x: x2, y: y2 },
    right: { x: x3, y: y3 },
  };
}

/**
 * Calculates back and front vertices for ribbon coordinates.
 */
export function getRibbonPoints(
  cFraction: number,
  r: number,
  h: number,
  config: GeometryConfig
) {
  const { gridSize, gap, cosAngle, sinAngle } = config;
  const barSize = gridSize - gap;
  const offset = gap / 2;

  const xStart = cFraction * gridSize;
  const yBack = r * gridSize + offset;
  const yFront = yBack + barSize;

  const ptBack = {
    x: (xStart - yBack) * cosAngle,
    y: (xStart + yBack) * sinAngle - h
  };

  const ptFront = {
    x: (xStart - yFront) * cosAngle,
    y: (xStart + yFront) * sinAngle - h
  };

  return { back: ptBack, front: ptFront };
}

/**
 * Calculates grid intersection coordinates (for drawing grid floor lines).
 */
export function getGridIntersection(
  c: number,
  r: number,
  config: GeometryConfig
) {
  const { gridSize, cosAngle, sinAngle } = config;
  const xVal = c * gridSize;
  const yVal = r * gridSize;
  return {
    x: (xVal - yVal) * cosAngle,
    y: (xVal + yVal) * sinAngle,
  };
}
