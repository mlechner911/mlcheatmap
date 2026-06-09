import { shadeHex } from './color';

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
 * Renders a 3D cylinder (or flat zero ellipse) for a cell.
 */
export function renderCylinder(
  c: number,
  r: number,
  value: number,
  h: number,
  baseColor: string,
  colors: Colors,
  verticesTop: Vertices,
  verticesBottom: Vertices,
  barSize: number,
  cosAngle: number,
  sinAngle: number,
  opacity: number,
  renderFlatZero: boolean,
  titleTag: string,
  inlineStyle: string,
  uniqueColors: Set<string>
): string {
  const rx = (barSize / 2) * cosAngle;
  const ry = (barSize / 2) * sinAngle;

  if (h === 0) {
    if (!renderFlatZero) {
      return '';
    }
    const t = verticesTop.top;
    const xcb = t.x;
    const ycb = t.y + barSize * sinAngle;

    return `<g class="iso-bar" data-col="${c}" data-row="${r}" data-value="${value}"${inlineStyle}>
        ${titleTag}
        <ellipse cx="${xcb.toFixed(2)}" cy="${ycb.toFixed(2)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="${colors.top}" stroke="${colors.top}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
      </g>`;
  }

  // 3D Cylinder (mantle + top ellipse)
  const xct = verticesTop.top.x;
  const yct = verticesTop.top.y + barSize * sinAngle;
  const xcb = verticesBottom.top.x;
  const ycb = verticesBottom.top.y + barSize * sinAngle;

  const sideBorderColor = shadeHex(baseColor, 0.75);
  const gradId = 'cyl-grad-' + baseColor.replace('#', '');
  uniqueColors.add(baseColor);

  const pathD = `M ${(xct - rx).toFixed(2)},${yct.toFixed(2)} L ${(xcb - rx).toFixed(2)},${ycb.toFixed(2)} A ${rx.toFixed(2)},${ry.toFixed(2)} 0 0,0 ${(xcb + rx).toFixed(2)},${ycb.toFixed(2)} L ${(xct + rx).toFixed(2)},${yct.toFixed(2)} A ${rx.toFixed(2)},${ry.toFixed(2)} 0 0,1 ${(xct - rx).toFixed(2)},${yct.toFixed(2)} Z`;

  return `<g class="iso-bar" data-col="${c}" data-row="${r}" data-value="${value}"${inlineStyle}>
      ${titleTag}
      <path d="${pathD}" fill="url(#${gradId})" stroke="${sideBorderColor}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
      <ellipse cx="${xct.toFixed(2)}" cy="${yct.toFixed(2)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="${colors.top}" stroke="${colors.top}" stroke-width="0.3" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
    </g>`;
}
