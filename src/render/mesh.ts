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
  triangulateMesh?: boolean; // Decompose quad into planar triangles (default: true)
  useSvg2Mesh?: boolean;     // Experimental: use SVG 2.0 meshGradient (default: false)
}

/**
 * Renders a single quadrilateral surface mesh patch connecting 4 adjacent vertices.
 * Supports standard quad rendering, low-poly triangulation, and experimental SVG 2.0 meshGradients.
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
    inlineStyle,
    triangulateMesh = true,
    useSvg2Mesh = false
  } = params;

  const { gridSize } = geometryConfig;

  // 1. Project the 4 corners to 2D
  const p0 = projectVertex(c, r, h0, geometryConfig);         // Back (0)
  const p1 = projectVertex(c + 1, r, h1, geometryConfig);     // Right (1)
  const p2 = projectVertex(c + 1, r + 1, h2, geometryConfig); // Front (2)
  const p3 = projectVertex(c, r + 1, h3, geometryConfig);     // Left (3)

  const opacityAttr = opacity !== undefined && opacity < 1 ? ` opacity="${opacity}"` : '';

  // Normalized Light Vector L = (1, -1, 2)
  // L normalized = (1 / sqrt(6), -1 / sqrt(6), 2 / sqrt(6)) = (0.408, -0.408, 0.816)
  const lx = 0.408;
  const ly = -0.408;
  const lz = 0.816;

  // --- OPTION A: Experimental SVG 2.0 meshGradient ---
  if (useSvg2Mesh) {
    const avgVal = (v0 + v1 + v2 + v3) / 4;
    const baseColor = getColorForValue(avgVal, maxAbsValue, theme, negativeTheme, interpolateColors);

    // Compute surface normal for shading coefficient
    const dh1 = h1 - h0;
    const dh3 = h3 - h0;
    const nx = -gridSize * dh1;
    const ny = -gridSize * dh3;
    const nz = gridSize * gridSize;
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    const dot = (nx / length) * lx + (ny / length) * ly + (nz / length) * lz;
    const intensity = Math.max(-1, Math.min(1, dot));
    const shadowCoef = 0.85 + 0.25 * intensity;

    // Resolve individual corner colors and apply shadow
    const col0 = shadeHex(getColorForValue(v0, maxAbsValue, theme, negativeTheme, interpolateColors), shadowCoef);
    const col1 = shadeHex(getColorForValue(v1, maxAbsValue, theme, negativeTheme, interpolateColors), shadowCoef);
    const col2 = shadeHex(getColorForValue(v2, maxAbsValue, theme, negativeTheme, interpolateColors), shadowCoef);
    const col3 = shadeHex(getColorForValue(v3, maxAbsValue, theme, negativeTheme, interpolateColors), shadowCoef);

    const gradId = `mesh-grad-${c}-${r}`;
    
    // SVG 2.0 Mesh Gradient definition with linear paths connecting corners
    const meshDefs = `<defs>
  <meshGradient id="${gradId}" x="${p0.x.toFixed(1)}" y="${p0.y.toFixed(1)}">
    <meshRow>
      <meshPatch>
        <stop path="L ${p1.x.toFixed(1)},${p1.y.toFixed(1)}" stop-color="${col1}" />
        <stop path="L ${p2.x.toFixed(1)},${p2.y.toFixed(1)}" stop-color="${col2}" />
        <stop path="L ${p3.x.toFixed(1)},${p3.y.toFixed(1)}" stop-color="${col3}" />
        <stop path="Z" stop-color="${col0}" />
      </meshPatch>
    </meshRow>
  </meshGradient>
</defs>`;

    const pts = `${p0.x.toFixed(1)},${p0.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`;

    return `${meshDefs}
<polygon points="${pts}" fill="url(#${gradId})" stroke="url(#${gradId})"${opacityAttr}${inlineStyle}>${titleTag}</polygon>`;
  }

  // --- OPTION B: Decompose Quad into Planar Triangles (Low-Poly Shading) ---
  if (triangulateMesh) {
    // Triangle A: Back (0) -> Right (1) -> Front (2)
    const dh1_A = h1 - h0;
    const dh2_A = h2 - h0;
    const nx_A = -gridSize * dh1_A;
    const ny_A = -gridSize * (dh2_A - dh1_A);
    const nz_A = gridSize * gridSize;
    const len_A = Math.sqrt(nx_A * nx_A + ny_A * ny_A + nz_A * nz_A);
    const dot_A = (nx_A / len_A) * lx + (ny_A / len_A) * ly + (nz_A / len_A) * lz;
    const intensity_A = Math.max(-1, Math.min(1, dot_A));
    const shadowCoef_A = 0.85 + 0.25 * intensity_A;

    const avgVal_A = (v0 + v1 + v2) / 3;
    const baseColor_A = getColorForValue(avgVal_A, maxAbsValue, theme, negativeTheme, interpolateColors);
    const fill_A = shadeHex(baseColor_A, shadowCoef_A);
    const stroke_A = shadeHex(fill_A, 0.85);

    // Triangle B: Back (0) -> Front (2) -> Left (3)
    const dh2_B = h2 - h0;
    const dh3_B = h3 - h0;
    const nx_B = -gridSize * (dh2_B - dh3_B);
    const ny_B = -gridSize * dh3_B;
    const nz_B = gridSize * gridSize;
    const len_B = Math.sqrt(nx_B * nx_B + ny_B * ny_B + nz_B * nz_B);
    const dot_B = (nx_B / len_B) * lx + (ny_B / len_B) * ly + (nz_B / len_B) * lz;
    const intensity_B = Math.max(-1, Math.min(1, dot_B));
    const shadowCoef_B = 0.85 + 0.25 * intensity_B;

    const avgVal_B = (v0 + v2 + v3) / 3;
    const baseColor_B = getColorForValue(avgVal_B, maxAbsValue, theme, negativeTheme, interpolateColors);
    const fill_B = shadeHex(baseColor_B, shadowCoef_B);
    const stroke_B = shadeHex(fill_B, 0.85);

    const pts_A = `${p0.x.toFixed(1)},${p0.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    const pts_B = `${p0.x.toFixed(1)},${p0.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`;

    return `<polygon points="${pts_A}" fill="${fill_A}" stroke="${stroke_A}" stroke-width="0.3" stroke-linejoin="round"${opacityAttr}${inlineStyle}>${titleTag}</polygon>
<polygon points="${pts_B}" fill="${fill_B}" stroke="${stroke_B}" stroke-width="0.3" stroke-linejoin="round"${opacityAttr}${inlineStyle}>${titleTag}</polygon>`;
  }

  // --- OPTION C: Standard Flat-Shaded Quad ---
  const avgVal = (v0 + v1 + v2 + v3) / 4;
  const baseColor = getColorForValue(avgVal, maxAbsValue, theme, negativeTheme, interpolateColors);

  const dh1 = h1 - h0;
  const dh3 = h3 - h0;
  const nx = -gridSize * dh1;
  const ny = -gridSize * dh3;
  const nz = gridSize * gridSize;

  const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
  const dot = (nx / length) * lx + (ny / length) * ly + (nz / length) * lz;
  const intensity = Math.max(-1, Math.min(1, dot));
  const shadowCoef = 0.85 + 0.25 * intensity;
  const fill = shadeHex(baseColor, shadowCoef);
  const stroke = shadeHex(fill, 0.85);

  const pts = `${p0.x.toFixed(1)},${p0.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`;

  return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="0.5"${opacityAttr}${inlineStyle}>${titleTag}</polygon>`;
}
