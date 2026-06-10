/**
 * MLC Isometric Heatmap Library - 3D Contiguous Surface Mesh Renderer
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { GeometryConfig } from './geometry';
import { getColorForValue, shadeHex } from './color';

export interface MeshVertex {
  x: number;
  y: number;
}

/**
 * Projects a 3D vertex coordinate (col, row, height) into 2D isometric screen space.
 */
export function projectVertex(
  col: number,
  row: number,
  h: number,
  config: GeometryConfig
): MeshVertex {
  const { gridSize, cosAngle, sinAngle } = config;
  // Mesh vertices touch directly (no gap padding between polygons)
  const xStart = col * gridSize;
  const yStart = row * gridSize;

  return {
    x: (xStart - yStart) * cosAngle,
    y: (xStart + yStart) * sinAngle - h
  };
}

export interface RenderMeshParams {
  c: number;
  r: number;
  h0: number; // Back height
  h1: number; // Right height
  h2: number; // Front height
  h3: number; // Left height
  v0: number; // Back value
  v1: number; // Right value
  v2: number; // Front value
  v3: number; // Left value
  maxAbsValue: number;
  theme: any;
  negativeTheme: any;
  interpolateColors?: boolean;
  geometryConfig: GeometryConfig;
  opacity?: number;
  titleTag?: string;
  inlineStyle?: string;
}

/**
 * Renders a single quadrilateral surface mesh patch connecting 4 adjacent vertices.
 */
export function renderMeshQuad(params: RenderMeshParams): string {
  const {
    c,
    r,
    h0,
    h1,
    h2,
    h3,
    v0,
    v1,
    v2,
    v3,
    maxAbsValue,
    theme,
    negativeTheme,
    interpolateColors,
    geometryConfig,
    opacity,
    titleTag,
    inlineStyle
  } = params;

  const { gridSize } = geometryConfig;

  // 1. Project the 4 corners to 2D
  const p0 = projectVertex(c, r, h0, geometryConfig);         // Back
  const p1 = projectVertex(c + 1, r, h1, geometryConfig);     // Right
  const p2 = projectVertex(c + 1, r + 1, h2, geometryConfig); // Front
  const p3 = projectVertex(c, r + 1, h3, geometryConfig);     // Left

  // 2. Compute average value and resolve base color
  const avgVal = (v0 + v1 + v2 + v3) / 4;
  const baseColor = getColorForValue(avgVal, maxAbsValue, theme, negativeTheme, interpolateColors);

  // 3. Compute surface normals vector (cross product of U and V edges)
  // U = (gridSize, 0, h1 - h0)
  // V = (0, gridSize, h3 - h0)
  // N = U x V = (-gridSize * (h1 - h0), -gridSize * (h3 - h0), gridSize^2)
  const dh1 = h1 - h0;
  const dh3 = h3 - h0;
  
  const nx = -gridSize * dh1;
  const ny = -gridSize * dh3;
  const nz = gridSize * gridSize;

  // Normalize N
  const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
  const ux = nx / length;
  const uy = ny / length;
  const uz = nz / length;

  // 4. Compute Lambertian Shading relative to light vector L = (1, -1, 2)
  // L normalized = (1 / sqrt(6), -1 / sqrt(6), 2 / sqrt(6)) = (0.408, -0.408, 0.816)
  const lx = 0.408;
  const ly = -0.408;
  const lz = 0.816;

  const dot = ux * lx + uy * ly + uz * lz;
  const intensity = Math.max(-1, Math.min(1, dot));

  // Map intensity range [-1, 1] to shadow coefficient [0.6, 1.1]
  const shadowCoef = 0.85 + 0.25 * intensity;
  const fill = shadeHex(baseColor, shadowCoef);

  // 5. Generate SVG Polygon
  const stroke = shadeHex(fill, 0.85);
  const opacityAttr = opacity !== undefined && opacity < 1 ? ` opacity="${opacity}"` : '';

  const pts = `${p0.x.toFixed(1)},${p0.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`;

  return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="0.5"${opacityAttr}${inlineStyle}>${titleTag}</polygon>`;
}
