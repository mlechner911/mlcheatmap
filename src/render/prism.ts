/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

interface Colors {
  top: string;
  left: string;
  right: string;
}

interface Vertices {
  top: { x: number; y: number };
  left: { x: number; y: number };
  front: { x: number; y: number };
  right: { x: number; y: number };
}

/**
 * Renders a 3D rectangular prism (or flat zero cell) for a cell.
 */
export function renderPrism(
  c: number,
  r: number,
  value: number,
  h: number,
  colors: Colors,
  verticesTop: Vertices,
  verticesBottom: Vertices,
  opacity: number,
  renderFlatZero: boolean,
  titleTag: string,
  inlineStyle: string
): string {
  if (h === 0) {
    if (!renderFlatZero) {
      return '';
    }
    const t = verticesTop.top;
    const l = verticesTop.left;
    const f = verticesTop.front;
    const rg = verticesTop.right;
    const points = `${t.x.toFixed(2)},${t.y.toFixed(2)} ${l.x.toFixed(2)},${l.y.toFixed(2)} ${f.x.toFixed(2)},${f.y.toFixed(2)} ${rg.x.toFixed(2)},${rg.y.toFixed(2)}`;

    return `<g class="iso-bar" data-col="${c}" data-row="${r}" data-value="${value}"${inlineStyle}>
        ${titleTag}
        <polygon points="${points}" fill="${colors.top}" stroke="${colors.top}" stroke-width="0.3" stroke-linejoin="round" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
      </g>`;
  }

  const t = verticesTop.top;
  const l = verticesTop.left;
  const f = verticesTop.front;
  const rg = verticesTop.right;

  const l_bot = verticesBottom.left;
  const f_bot = verticesBottom.front;
  const rg_bot = verticesBottom.right;

  const topPoints = `${t.x.toFixed(2)},${t.y.toFixed(2)} ${l.x.toFixed(2)},${l.y.toFixed(2)} ${f.x.toFixed(2)},${f.y.toFixed(2)} ${rg.x.toFixed(2)},${rg.y.toFixed(2)}`;
  const leftPoints = `${l.x.toFixed(2)},${l.y.toFixed(2)} ${f.x.toFixed(2)},${f.y.toFixed(2)} ${f_bot.x.toFixed(2)},${f_bot.y.toFixed(2)} ${l_bot.x.toFixed(2)},${l_bot.y.toFixed(2)}`;
  const rightPoints = `${f.x.toFixed(2)},${f.y.toFixed(2)} ${rg.x.toFixed(2)},${rg.y.toFixed(2)} ${rg_bot.x.toFixed(2)},${rg_bot.y.toFixed(2)} ${f_bot.x.toFixed(2)},${f_bot.y.toFixed(2)}`;

  return `<g class="iso-bar" data-col="${c}" data-row="${r}" data-value="${value}"${inlineStyle}>
      ${titleTag}
      <polygon class="iso-face-left" points="${leftPoints}" fill="${colors.left}" stroke="${colors.left}" stroke-width="0.3" stroke-linejoin="round" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
      <polygon class="iso-face-right" points="${rightPoints}" fill="${colors.right}" stroke="${colors.right}" stroke-width="0.3" stroke-linejoin="round" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
      <polygon class="iso-face-top" points="${topPoints}" fill="${colors.top}" stroke="${colors.top}" stroke-width="0.3" stroke-linejoin="round" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
    </g>`;
}
