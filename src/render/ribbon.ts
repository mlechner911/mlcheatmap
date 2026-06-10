/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { HeatmapDataPoint } from '../data/types';

interface Colors {
  top: string;
  left: string;
  right: string;
}

/**
 * Renders a 3D ribbon segment for a cell.
 */
export function renderRibbon(
  c: number,
  r: number,
  value: number,
  h: number,
  colors: Colors,
  opacity: number,
  titleTag: string,
  inlineStyle: string,
  cols: number,
  maxAbsValue: number,
  maxHeight: number,
  getPoint: (col: number, row: number) => HeatmapDataPoint,
  getRibbonPoints: (cFraction: number, r: number, h: number) => { back: { x: number; y: number }; front: { x: number; y: number } },
  isFlatBand: boolean = false
): string {
  const vPrev = c > 0 ? getPoint(c - 1, r).value : 0;
  const vNext = c < cols - 1 ? getPoint(c + 1, r).value : 0;

  const hPrev = vPrev === null ? 0 : vPrev;
  const hNext = vNext === null ? 0 : vNext;

  const valPrev = hPrev !== 0 && maxAbsValue > 0 ? (hPrev / maxAbsValue) * maxHeight : 0;
  const valNext = hNext !== 0 && maxAbsValue > 0 ? (hNext / maxAbsValue) * maxHeight : 0;

  const h_start = valPrev !== 0 ? (valPrev + h) / 2 : 0;
  const h_mid = h;
  const h_end = valNext !== 0 ? (h + valNext) / 2 : 0;

  const thickness = isFlatBand ? Math.max(4, maxHeight * 0.1) : 0;

  const h_cp1_seg1 = h_start + (h - valPrev !== 0 ? (h - valPrev) : 0) / 6;
  const h_cp2_seg1 = h_mid;
  const h_cp1_seg2 = h_mid;
  const h_cp2_seg2 = h_end - (valNext - h !== 0 ? (valNext - h) : 0) / 6;

  const h_start_bottom = isFlatBand ? h_start - thickness : 0;
  const h_mid_bottom = isFlatBand ? h_mid - thickness : 0;
  const h_end_bottom = isFlatBand ? h_end - thickness : 0;

  const h_cp1_seg1_bottom = isFlatBand ? h_cp1_seg1 - thickness : 0;
  const h_cp2_seg1_bottom = isFlatBand ? h_cp2_seg1 - thickness : 0;
  const h_cp1_seg2_bottom = isFlatBand ? h_cp1_seg2 - thickness : 0;
  const h_cp2_seg2_bottom = isFlatBand ? h_cp2_seg2 - thickness : 0;

  const pts0 = getRibbonPoints(c, r, h_start);
  const ptsMid = getRibbonPoints(c + 0.5, r, h_mid);
  const pts1 = getRibbonPoints(c + 1, r, h_end);

  const pts0Bottom = getRibbonPoints(c, r, h_start_bottom);
  const ptsMidBottom = getRibbonPoints(c + 0.5, r, h_mid_bottom);
  const pts1Bottom = getRibbonPoints(c + 1, r, h_end_bottom);

  let capSvg = '';
  if (valPrev === 0) {
    const leftCapPoints = `${pts0.back.x.toFixed(2)},${pts0.back.y.toFixed(2)} ${pts0.front.x.toFixed(2)},${pts0.front.y.toFixed(2)} ${pts0Bottom.front.x.toFixed(2)},${pts0Bottom.front.y.toFixed(2)} ${pts0Bottom.back.x.toFixed(2)},${pts0Bottom.back.y.toFixed(2)}`;
    capSvg += `<polygon class="iso-face-left" points="${leftCapPoints}" fill="${colors.left}" stroke="${colors.left}" stroke-width="0.3" stroke-linejoin="round" fill-opacity="${opacity}" stroke-opacity="${opacity}" />`;
  }
  if (valNext === 0) {
    const rightCapPoints = `${pts1.back.x.toFixed(2)},${pts1.back.y.toFixed(2)} ${pts1.front.x.toFixed(2)},${pts1.front.y.toFixed(2)} ${pts1Bottom.front.x.toFixed(2)},${pts1Bottom.front.y.toFixed(2)} ${pts1Bottom.back.x.toFixed(2)},${pts1Bottom.back.y.toFixed(2)}`;
    capSvg += `<polygon class="iso-face-right" points="${rightCapPoints}" fill="${colors.right}" stroke="${colors.right}" stroke-width="0.3" stroke-linejoin="round" fill-opacity="${opacity}" stroke-opacity="${opacity}" />`;
  }

  // Curve interpolation
  const seg1TopPath = `M ${pts0.front.x.toFixed(2)},${pts0.front.y.toFixed(2)} C ${getRibbonPoints(c + 1/6, r, h_cp1_seg1).front.x.toFixed(2)},${getRibbonPoints(c + 1/6, r, h_cp1_seg1).front.y.toFixed(2)} ${getRibbonPoints(c + 1/3, r, h_cp2_seg1).front.x.toFixed(2)},${getRibbonPoints(c + 1/3, r, h_cp2_seg1).front.y.toFixed(2)} ${ptsMid.front.x.toFixed(2)},${ptsMid.front.y.toFixed(2)} L ${ptsMid.back.x.toFixed(2)},${ptsMid.back.y.toFixed(2)} C ${getRibbonPoints(c + 1/3, r, h_cp2_seg1).back.x.toFixed(2)},${getRibbonPoints(c + 1/3, r, h_cp2_seg1).back.y.toFixed(2)} ${getRibbonPoints(c + 1/6, r, h_cp1_seg1).back.x.toFixed(2)},${getRibbonPoints(c + 1/6, r, h_cp1_seg1).back.y.toFixed(2)} ${pts0.back.x.toFixed(2)},${pts0.back.y.toFixed(2)} Z`;
  const seg2TopPath = `M ${ptsMid.front.x.toFixed(2)},${ptsMid.front.y.toFixed(2)} C ${getRibbonPoints(c + 2/3, r, h_cp1_seg2).front.x.toFixed(2)},${getRibbonPoints(c + 2/3, r, h_cp1_seg2).front.y.toFixed(2)} ${getRibbonPoints(c + 5/6, r, h_cp2_seg2).front.x.toFixed(2)},${getRibbonPoints(c + 5/6, r, h_cp2_seg2).front.y.toFixed(2)} ${pts1.front.x.toFixed(2)},${pts1.front.y.toFixed(2)} L ${pts1.back.x.toFixed(2)},${pts1.back.y.toFixed(2)} C ${getRibbonPoints(c + 5/6, r, h_cp2_seg2).back.x.toFixed(2)},${getRibbonPoints(c + 5/6, r, h_cp2_seg2).back.y.toFixed(2)} ${getRibbonPoints(c + 2/3, r, h_cp1_seg2).back.x.toFixed(2)},${getRibbonPoints(c + 2/3, r, h_cp1_seg2).back.y.toFixed(2)} ${ptsMid.back.x.toFixed(2)},${ptsMid.back.y.toFixed(2)} Z`;

  if (h >= 0 || isFlatBand) {
    const seg1FrontPath = `M ${pts0Bottom.front.x.toFixed(2)},${pts0Bottom.front.y.toFixed(2)} ` +
      `L ${pts0.front.x.toFixed(2)},${pts0.front.y.toFixed(2)} ` +
      `C ${getRibbonPoints(c + 1/6, r, h_cp1_seg1).front.x.toFixed(2)},${getRibbonPoints(c + 1/6, r, h_cp1_seg1).front.y.toFixed(2)} ` +
        `${getRibbonPoints(c + 1/3, r, h_cp2_seg1).front.x.toFixed(2)},${getRibbonPoints(c + 1/3, r, h_cp2_seg1).front.y.toFixed(2)} ` +
        `${ptsMid.front.x.toFixed(2)},${ptsMid.front.y.toFixed(2)} ` +
      `L ${ptsMidBottom.front.x.toFixed(2)},${ptsMidBottom.front.y.toFixed(2)} ` +
      `C ${getRibbonPoints(c + 1/3, r, h_cp2_seg1_bottom).front.x.toFixed(2)},${getRibbonPoints(c + 1/3, r, h_cp2_seg1_bottom).front.y.toFixed(2)} ` +
        `${getRibbonPoints(c + 1/6, r, h_cp1_seg1_bottom).front.x.toFixed(2)},${getRibbonPoints(c + 1/6, r, h_cp1_seg1_bottom).front.y.toFixed(2)} ` +
        `${pts0Bottom.front.x.toFixed(2)},${pts0Bottom.front.y.toFixed(2)} Z`;

    const seg2FrontPath = `M ${ptsMidBottom.front.x.toFixed(2)},${ptsMidBottom.front.y.toFixed(2)} ` +
      `L ${ptsMid.front.x.toFixed(2)},${ptsMid.front.y.toFixed(2)} ` +
      `C ${getRibbonPoints(c + 2/3, r, h_cp1_seg2).front.x.toFixed(2)},${getRibbonPoints(c + 2/3, r, h_cp1_seg2).front.y.toFixed(2)} ` +
        `${getRibbonPoints(c + 5/6, r, h_cp2_seg2).front.x.toFixed(2)},${getRibbonPoints(c + 5/6, r, h_cp2_seg2).front.y.toFixed(2)} ` +
        `${pts1.front.x.toFixed(2)},${pts1.front.y.toFixed(2)} ` +
      `L ${pts1Bottom.front.x.toFixed(2)},${pts1Bottom.front.y.toFixed(2)} ` +
      `C ${getRibbonPoints(c + 5/6, r, h_cp2_seg2_bottom).front.x.toFixed(2)},${getRibbonPoints(c + 5/6, r, h_cp2_seg2_bottom).front.y.toFixed(2)} ` +
        `${getRibbonPoints(c + 2/3, r, h_cp1_seg2_bottom).front.x.toFixed(2)},${getRibbonPoints(c + 2/3, r, h_cp1_seg2_bottom).front.y.toFixed(2)} ` +
        `${ptsMidBottom.front.x.toFixed(2)},${ptsMidBottom.front.y.toFixed(2)} Z`;

    return `<g class="iso-bar" data-col="${c}" data-row="${r}" data-value="${value}"${inlineStyle}>
        ${titleTag}
        ${capSvg}
        <path class="iso-face-top" d="${seg1TopPath}" fill="${colors.top}" stroke="${colors.top}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
        <path class="iso-face-right" d="${seg1FrontPath}" fill="${colors.right}" stroke="${colors.right}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
        <path class="iso-face-top" d="${seg2TopPath}" fill="${colors.top}" stroke="${colors.top}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
        <path class="iso-face-right" d="${seg2FrontPath}" fill="${colors.right}" stroke="${colors.right}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
      </g>`;
  } else {
    const ptsC1_1_Floor = getRibbonPoints(c + 1/6, r, 0);
    const ptsC2_1_Floor = getRibbonPoints(c + 1/3, r, 0);
    const ptsC1_2_Floor = getRibbonPoints(c + 2/3, r, 0);
    const ptsC2_2_Floor = getRibbonPoints(c + 5/6, r, 0);

    const seg1TopPathFloor = `M ${pts0Bottom.front.x.toFixed(2)},${pts0Bottom.front.y.toFixed(2)} C ${ptsC1_1_Floor.front.x.toFixed(2)},${ptsC1_1_Floor.front.y.toFixed(2)} ${ptsC2_1_Floor.front.x.toFixed(2)},${ptsC2_1_Floor.front.y.toFixed(2)} ${ptsMidBottom.front.x.toFixed(2)},${ptsMidBottom.front.y.toFixed(2)} L ${ptsMidBottom.back.x.toFixed(2)},${ptsMidBottom.back.y.toFixed(2)} C ${ptsC2_1_Floor.back.x.toFixed(2)},${ptsC2_1_Floor.back.y.toFixed(2)} ${ptsC1_1_Floor.back.x.toFixed(2)},${ptsC1_1_Floor.back.y.toFixed(2)} ${pts0Bottom.back.x.toFixed(2)},${pts0Bottom.back.y.toFixed(2)} Z`;
    const seg2TopPathFloor = `M ${ptsMidBottom.front.x.toFixed(2)},${ptsMidBottom.front.y.toFixed(2)} C ${ptsC1_2_Floor.front.x.toFixed(2)},${ptsC1_2_Floor.front.y.toFixed(2)} ${ptsC2_2_Floor.front.x.toFixed(2)},${ptsC2_2_Floor.front.y.toFixed(2)} ${pts1Bottom.front.x.toFixed(2)},${pts1Bottom.front.y.toFixed(2)} L ${pts1Bottom.back.x.toFixed(2)},${pts1Bottom.back.y.toFixed(2)} C ${ptsC2_2_Floor.back.x.toFixed(2)},${ptsC2_2_Floor.back.y.toFixed(2)} ${ptsC1_2_Floor.back.x.toFixed(2)},${ptsC1_2_Floor.back.y.toFixed(2)} ${ptsMidBottom.back.x.toFixed(2)},${ptsMidBottom.back.y.toFixed(2)} Z`;

    const seg1FrontPath = `M ${pts0Bottom.front.x.toFixed(2)},${pts0Bottom.front.y.toFixed(2)} L ${pts0.front.x.toFixed(2)},${pts0.front.y.toFixed(2)} C ${getRibbonPoints(c + 1/6, r, h_cp1_seg1).front.x.toFixed(2)},${getRibbonPoints(c + 1/6, r, h_cp1_seg1).front.y.toFixed(2)} ${getRibbonPoints(c + 1/3, r, h_cp2_seg1).front.x.toFixed(2)},${getRibbonPoints(c + 1/3, r, h_cp2_seg1).front.y.toFixed(2)} ${ptsMid.front.x.toFixed(2)},${ptsMid.front.y.toFixed(2)} L ${ptsMidBottom.front.x.toFixed(2)},${ptsMidBottom.front.y.toFixed(2)} Z`;
    const seg2FrontPath = `M ${ptsMidBottom.front.x.toFixed(2)},${ptsMidBottom.front.y.toFixed(2)} L ${ptsMid.front.x.toFixed(2)},${ptsMid.front.y.toFixed(2)} C ${getRibbonPoints(c + 2/3, r, h_cp1_seg2).front.x.toFixed(2)},${getRibbonPoints(c + 2/3, r, h_cp1_seg2).front.y.toFixed(2)} ${getRibbonPoints(c + 5/6, r, h_cp2_seg2).front.x.toFixed(2)},${getRibbonPoints(c + 5/6, r, h_cp2_seg2).front.y.toFixed(2)} ${pts1.front.x.toFixed(2)},${pts1.front.y.toFixed(2)} L ${pts1Bottom.front.x.toFixed(2)},${pts1Bottom.front.y.toFixed(2)} Z`;

    const seg1BackPath = `M ${pts0Bottom.back.x.toFixed(2)},${pts0Bottom.back.y.toFixed(2)} L ${pts0.back.x.toFixed(2)},${pts0.back.y.toFixed(2)} C ${getRibbonPoints(c + 1/6, r, h_cp1_seg1).back.x.toFixed(2)},${getRibbonPoints(c + 1/6, r, h_cp1_seg1).back.y.toFixed(2)} ${getRibbonPoints(c + 1/3, r, h_cp2_seg1).back.x.toFixed(2)},${getRibbonPoints(c + 1/3, r, h_cp2_seg1).back.y.toFixed(2)} ${ptsMid.back.x.toFixed(2)},${ptsMid.back.y.toFixed(2)} L ${ptsMidBottom.back.x.toFixed(2)},${ptsMidBottom.back.y.toFixed(2)} Z`;
    const seg2BackPath = `M ${ptsMidBottom.back.x.toFixed(2)},${ptsMidBottom.back.y.toFixed(2)} L ${ptsMid.back.x.toFixed(2)},${ptsMid.back.y.toFixed(2)} C ${getRibbonPoints(c + 2/3, r, h_cp1_seg2).back.x.toFixed(2)},${getRibbonPoints(c + 2/3, r, h_cp1_seg2).back.y.toFixed(2)} ${getRibbonPoints(c + 5/6, r, h_cp2_seg2).back.x.toFixed(2)},${getRibbonPoints(c + 5/6, r, h_cp2_seg2).back.y.toFixed(2)} ${pts1.back.x.toFixed(2)},${pts1.back.y.toFixed(2)} L ${pts1Bottom.back.x.toFixed(2)},${pts1Bottom.back.y.toFixed(2)} Z`;

    return `<g class="iso-bar" data-col="${c}" data-row="${r}" data-value="${value}"${inlineStyle}>
        ${titleTag}
        ${capSvg}
        <path class="iso-face-right" d="${seg1BackPath}" fill="${colors.right}" stroke="${colors.right}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
        <path class="iso-face-right" d="${seg2BackPath}" fill="${colors.right}" stroke="${colors.right}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
        <path class="iso-face-top" d="${seg1TopPath}" fill="${colors.top}" stroke="${colors.top}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
        <path class="iso-face-top" d="${seg2TopPath}" fill="${colors.top}" stroke="${colors.top}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
        <path class="iso-face-top" d="${seg1TopPathFloor}" fill="${colors.top}" stroke="${colors.top}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
        <path class="iso-face-top" d="${seg2TopPathFloor}" fill="${colors.top}" stroke="${colors.top}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
        <path class="iso-face-right" d="${seg1FrontPath}" fill="${colors.right}" stroke="${colors.right}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
        <path class="iso-face-right" d="${seg2FrontPath}" fill="${colors.right}" stroke="${colors.right}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
      </g>`;
  }
}

