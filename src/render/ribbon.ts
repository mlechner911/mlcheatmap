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
  getRibbonPoints: (cFraction: number, r: number, h: number) => { back: { x: number; y: number }; front: { x: number; y: number } }
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

  const pts0 = getRibbonPoints(c, r, h_start);
  const ptsMid = getRibbonPoints(c + 0.5, r, h_mid);
  const pts1 = getRibbonPoints(c + 1, r, h_end);

  const pts0Floor = getRibbonPoints(c, r, 0);
  const ptsMidFloor = getRibbonPoints(c + 0.5, r, 0);
  const pts1Floor = getRibbonPoints(c + 1, r, 0);

  let capSvg = '';
  if (valPrev === 0) {
    const leftCapPoints = `${pts0.back.x.toFixed(2)},${pts0.back.y.toFixed(2)} ${pts0.front.x.toFixed(2)},${pts0.front.y.toFixed(2)} ${pts0Floor.front.x.toFixed(2)},${pts0Floor.front.y.toFixed(2)} ${pts0Floor.back.x.toFixed(2)},${pts0Floor.back.y.toFixed(2)}`;
    capSvg += `<polygon class="iso-face-left" points="${leftCapPoints}" fill="${colors.left}" stroke="${colors.left}" stroke-width="0.3" stroke-linejoin="round" fill-opacity="${opacity}" stroke-opacity="${opacity}" />`;
  }
  if (valNext === 0) {
    const rightCapPoints = `${pts1.back.x.toFixed(2)},${pts1.back.y.toFixed(2)} ${pts1.front.x.toFixed(2)},${pts1.front.y.toFixed(2)} ${pts1Floor.front.x.toFixed(2)},${pts1Floor.front.y.toFixed(2)} ${pts1Floor.back.x.toFixed(2)},${pts1Floor.back.y.toFixed(2)}`;
    capSvg += `<polygon class="iso-face-right" points="${rightCapPoints}" fill="${colors.right}" stroke="${colors.right}" stroke-width="0.3" stroke-linejoin="round" fill-opacity="${opacity}" stroke-opacity="${opacity}" />`;
  }

  // Curve interpolation
  const seg1TopPath = `M ${pts0.front.x.toFixed(2)},${pts0.front.y.toFixed(2)} C ${getRibbonPoints(c + 1/6, r, h_start + (h - valPrev !== 0 ? (h - valPrev) : 0) / 6).front.x.toFixed(2)},${getRibbonPoints(c + 1/6, r, h_start + (h - valPrev !== 0 ? (h - valPrev) : 0) / 6).front.y.toFixed(2)} ${getRibbonPoints(c + 1/3, r, h_mid).front.x.toFixed(2)},${getRibbonPoints(c + 1/3, r, h_mid).front.y.toFixed(2)} ${ptsMid.front.x.toFixed(2)},${ptsMid.front.y.toFixed(2)} L ${ptsMid.back.x.toFixed(2)},${ptsMid.back.y.toFixed(2)} C ${getRibbonPoints(c + 1/3, r, h_mid).back.x.toFixed(2)},${getRibbonPoints(c + 1/3, r, h_mid).back.y.toFixed(2)} ${getRibbonPoints(c + 1/6, r, h_start + (h - valPrev !== 0 ? (h - valPrev) : 0) / 6).back.x.toFixed(2)},${getRibbonPoints(c + 1/6, r, h_start + (h - valPrev !== 0 ? (h - valPrev) : 0) / 6).back.y.toFixed(2)} ${pts0.back.x.toFixed(2)},${pts0.back.y.toFixed(2)} Z`;
  const seg2TopPath = `M ${ptsMid.front.x.toFixed(2)},${ptsMid.front.y.toFixed(2)} C ${getRibbonPoints(c + 2/3, r, h_mid).front.x.toFixed(2)},${getRibbonPoints(c + 2/3, r, h_mid).front.y.toFixed(2)} ${getRibbonPoints(c + 5/6, r, h_end - (valNext - h !== 0 ? (valNext - h) : 0) / 6).front.x.toFixed(2)},${getRibbonPoints(c + 5/6, r, h_end - (valNext - h !== 0 ? (valNext - h) : 0) / 6).front.y.toFixed(2)} ${pts1.front.x.toFixed(2)},${pts1.front.y.toFixed(2)} L ${pts1.back.x.toFixed(2)},${pts1.back.y.toFixed(2)} C ${getRibbonPoints(c + 5/6, r, h_end - (valNext - h !== 0 ? (valNext - h) : 0) / 6).back.x.toFixed(2)},${getRibbonPoints(c + 5/6, r, h_end - (valNext - h !== 0 ? (valNext - h) : 0) / 6).back.y.toFixed(2)} ${getRibbonPoints(c + 2/3, r, h_mid).back.x.toFixed(2)},${getRibbonPoints(c + 2/3, r, h_mid).back.y.toFixed(2)} ${ptsMid.back.x.toFixed(2)},${ptsMid.back.y.toFixed(2)} Z`;

  if (h >= 0) {
    const seg1FrontPath = `M ${pts0Floor.front.x.toFixed(2)},${pts0Floor.front.y.toFixed(2)} L ${pts0.front.x.toFixed(2)},${pts0.front.y.toFixed(2)} C ${getRibbonPoints(c + 1/6, r, h_start + (h - valPrev !== 0 ? (h - valPrev) : 0) / 6).front.x.toFixed(2)},${getRibbonPoints(c + 1/6, r, h_start + (h - valPrev !== 0 ? (h - valPrev) : 0) / 6).front.y.toFixed(2)} ${getRibbonPoints(c + 1/3, r, h_mid).front.x.toFixed(2)},${getRibbonPoints(c + 1/3, r, h_mid).front.y.toFixed(2)} ${ptsMid.front.x.toFixed(2)},${ptsMid.front.y.toFixed(2)} L ${ptsMidFloor.front.x.toFixed(2)},${ptsMidFloor.front.y.toFixed(2)} Z`;
    const seg2FrontPath = `M ${ptsMidFloor.front.x.toFixed(2)},${ptsMidFloor.front.y.toFixed(2)} L ${ptsMid.front.x.toFixed(2)},${ptsMid.front.y.toFixed(2)} C ${getRibbonPoints(c + 2/3, r, h_mid).front.x.toFixed(2)},${getRibbonPoints(c + 2/3, r, h_mid).front.y.toFixed(2)} ${getRibbonPoints(c + 5/6, r, h_end - (valNext - h !== 0 ? (valNext - h) : 0) / 6).front.x.toFixed(2)},${getRibbonPoints(c + 5/6, r, h_end - (valNext - h !== 0 ? (valNext - h) : 0) / 6).front.y.toFixed(2)} ${pts1.front.x.toFixed(2)},${pts1.front.y.toFixed(2)} L ${pts1Floor.front.x.toFixed(2)},${pts1Floor.front.y.toFixed(2)} Z`;

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

    const seg1TopPathFloor = `M ${pts0Floor.front.x.toFixed(2)},${pts0Floor.front.y.toFixed(2)} C ${ptsC1_1_Floor.front.x.toFixed(2)},${ptsC1_1_Floor.front.y.toFixed(2)} ${ptsC2_1_Floor.front.x.toFixed(2)},${ptsC2_1_Floor.front.y.toFixed(2)} ${ptsMidFloor.front.x.toFixed(2)},${ptsMidFloor.front.y.toFixed(2)} L ${ptsMidFloor.back.x.toFixed(2)},${ptsMidFloor.back.y.toFixed(2)} C ${ptsC2_1_Floor.back.x.toFixed(2)},${ptsC2_1_Floor.back.y.toFixed(2)} ${ptsC1_1_Floor.back.x.toFixed(2)},${ptsC1_1_Floor.back.y.toFixed(2)} ${pts0Floor.back.x.toFixed(2)},${pts0Floor.back.y.toFixed(2)} Z`;
    const seg2TopPathFloor = `M ${ptsMidFloor.front.x.toFixed(2)},${ptsMidFloor.front.y.toFixed(2)} C ${ptsC1_2_Floor.front.x.toFixed(2)},${ptsC1_2_Floor.front.y.toFixed(2)} ${ptsC2_2_Floor.front.x.toFixed(2)},${ptsC2_2_Floor.front.y.toFixed(2)} ${pts1Floor.front.x.toFixed(2)},${pts1Floor.front.y.toFixed(2)} L ${pts1Floor.back.x.toFixed(2)},${pts1Floor.back.y.toFixed(2)} C ${ptsC2_2_Floor.back.x.toFixed(2)},${ptsC2_2_Floor.back.y.toFixed(2)} ${ptsC1_2_Floor.back.x.toFixed(2)},${ptsC1_2_Floor.back.y.toFixed(2)} ${ptsMidFloor.back.x.toFixed(2)},${ptsMidFloor.back.y.toFixed(2)} Z`;

    const seg1FrontPath = `M ${pts0Floor.front.x.toFixed(2)},${pts0Floor.front.y.toFixed(2)} L ${pts0.front.x.toFixed(2)},${pts0.front.y.toFixed(2)} C ${getRibbonPoints(c + 1/6, r, h_start + (h - valPrev !== 0 ? (h - valPrev) : 0) / 6).front.x.toFixed(2)},${getRibbonPoints(c + 1/6, r, h_start + (h - valPrev !== 0 ? (h - valPrev) : 0) / 6).front.y.toFixed(2)} ${getRibbonPoints(c + 1/3, r, h_mid).front.x.toFixed(2)},${getRibbonPoints(c + 1/3, r, h_mid).front.y.toFixed(2)} ${ptsMid.front.x.toFixed(2)},${ptsMid.front.y.toFixed(2)} L ${ptsMidFloor.front.x.toFixed(2)},${ptsMidFloor.front.y.toFixed(2)} Z`;
    const seg2FrontPath = `M ${ptsMidFloor.front.x.toFixed(2)},${ptsMidFloor.front.y.toFixed(2)} L ${ptsMid.front.x.toFixed(2)},${ptsMid.front.y.toFixed(2)} C ${getRibbonPoints(c + 2/3, r, h_mid).front.x.toFixed(2)},${getRibbonPoints(c + 2/3, r, h_mid).front.y.toFixed(2)} ${getRibbonPoints(c + 5/6, r, h_end - (valNext - h !== 0 ? (valNext - h) : 0) / 6).front.x.toFixed(2)},${getRibbonPoints(c + 5/6, r, h_end - (valNext - h !== 0 ? (valNext - h) : 0) / 6).front.y.toFixed(2)} ${pts1.front.x.toFixed(2)},${pts1.front.y.toFixed(2)} L ${pts1Floor.front.x.toFixed(2)},${pts1Floor.front.y.toFixed(2)} Z`;

    const seg1BackPath = `M ${pts0Floor.back.x.toFixed(2)},${pts0Floor.back.y.toFixed(2)} L ${pts0.back.x.toFixed(2)},${pts0.back.y.toFixed(2)} C ${getRibbonPoints(c + 1/6, r, h_start + (h - valPrev !== 0 ? (h - valPrev) : 0) / 6).back.x.toFixed(2)},${getRibbonPoints(c + 1/6, r, h_start + (h - valPrev !== 0 ? (h - valPrev) : 0) / 6).back.y.toFixed(2)} ${getRibbonPoints(c + 1/3, r, h_mid).back.x.toFixed(2)},${getRibbonPoints(c + 1/3, r, h_mid).back.y.toFixed(2)} ${ptsMid.back.x.toFixed(2)},${ptsMid.back.y.toFixed(2)} L ${ptsMidFloor.back.x.toFixed(2)},${ptsMidFloor.back.y.toFixed(2)} Z`;
    const seg2BackPath = `M ${ptsMidFloor.back.x.toFixed(2)},${ptsMidFloor.back.y.toFixed(2)} L ${ptsMid.back.x.toFixed(2)},${ptsMid.back.y.toFixed(2)} C ${getRibbonPoints(c + 2/3, r, h_mid).back.x.toFixed(2)},${getRibbonPoints(c + 2/3, r, h_mid).back.y.toFixed(2)} ${getRibbonPoints(c + 5/6, r, h_end - (valNext - h !== 0 ? (valNext - h) : 0) / 6).back.x.toFixed(2)},${getRibbonPoints(c + 5/6, r, h_end - (valNext - h !== 0 ? (valNext - h) : 0) / 6).back.y.toFixed(2)} ${pts1.back.x.toFixed(2)},${pts1.back.y.toFixed(2)} L ${pts1Floor.back.x.toFixed(2)},${pts1Floor.back.y.toFixed(2)} Z`;

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
