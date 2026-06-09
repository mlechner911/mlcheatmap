import { HeatmapDataPoint, HeatmapOptions, CustomColorScheme } from './types';
import { LIGHT_THEMES, DARK_THEMES, NEGATIVE_LIGHT_THEMES, NEGATIVE_DARK_THEMES, getColorForValue, shadeHex, rotateHue } from './color';
import { renderPrism } from './renderer/prism';
import { renderCylinder } from './renderer/cylinder';
import { renderRibbon } from './renderer/ribbon';

/**
 * Renders an isometric heatmap SVG.
 * @param data Array of data points or a HeatmapGrid instance.
 * @param options Styling and layout options.
 * @returns SVG string
 */
export function renderHeatmap(
  data: HeatmapDataPoint[] | { getData(): HeatmapDataPoint[]; cols: number; rows: number; colLabels?: string[]; rowLabels?: string[]; title?: string },
  options: HeatmapOptions
): string {
  // 1. Resolve parameters from data model vs raw options
  let points: HeatmapDataPoint[];
  let cols = options.cols;
  let rows = options.rows;
  let colLabels = options.colLabels;
  let rowLabels = options.rowLabels;
  let title = options.title;

  if (data && typeof (data as any).getData === 'function') {
    const gridModel = data as any;
    points = gridModel.getData();
    cols = cols ?? gridModel.cols;
    rows = rows ?? gridModel.rows;
    colLabels = colLabels ?? gridModel.colLabels;
    rowLabels = rowLabels ?? gridModel.rowLabels;
    title = title ?? gridModel.title;
  } else {
    points = data as HeatmapDataPoint[];
  }

  // 2. Resolve default options
  const gridSize = options.gridSize ?? 16;
  const gap = options.gap ?? 2;
  const maxHeight = options.maxHeight ?? 40;
  const showGrid = options.showGrid ?? true;
  const interactive = options.interactive ?? true;
  const isDark = options.dark ?? false;
  const padding = options.padding ?? 20;
  const projectionAngle = options.projectionAngle ?? 30;
  const labelPosition = options.labelPosition ?? 'behind';
  const shape = options.shape ?? 'prism';
  const opacity = options.opacity ?? 1.0;
  const animated = options.animated ?? true;
  const renderFlatZero = options.renderFlatZero ?? true;

  // Calculate angle constants dynamically
  const rad = (projectionAngle * Math.PI) / 180;
  const cosAngle = Math.cos(rad);
  const sinAngle = Math.sin(rad);

  // Resolve color scheme
  const themes = isDark ? DARK_THEMES : LIGHT_THEMES;
  const negThemes = isDark ? NEGATIVE_DARK_THEMES : NEGATIVE_LIGHT_THEMES;
  const defaultScheme = 'github';

  let theme: CustomColorScheme;
  let negativeTheme: CustomColorScheme;

  if (typeof options.colorScheme === 'object') {
    theme = options.colorScheme;
    negativeTheme = {
      empty: theme.empty,
      steps: theme.steps.map(step => rotateHue(step, 150))
    };
  } else {
    const schemeKey = options.colorScheme ?? defaultScheme;
    theme = themes[schemeKey] || themes[defaultScheme];
    negativeTheme = negThemes[schemeKey] || negThemes[defaultScheme];
  }

  const gridColor = options.gridColor ?? (isDark ? '#2f3542' : '#e1e4e8');
  const labelColor = isDark ? '#8b949e' : '#57606a';
  const labelFontSize = 9;

  // Track unique colors for cylinder gradients
  const uniqueColors = new Set<string>();

  // Find max value for height and color scaling
  let maxValue = 0;
  let minValue = 0;
  // Create a fast lookup map for coordinates
  const dataMap = new Map<string, HeatmapDataPoint>();
  for (const p of points) {
    dataMap.set(`${p.col},${p.row}`, p);
    if (p.value !== null) {
      if (p.value > maxValue) {
        maxValue = p.value;
      }
      if (p.value < minValue) {
        minValue = p.value;
      }
    }
  }
  const maxAbsValue = Math.max(Math.abs(maxValue), Math.abs(minValue));

  // Helper to get point at col, row
  const getPoint = (col: number, row: number): HeatmapDataPoint => {
    return dataMap.get(`${col},${row}`) ?? { col, row, value: null };
  };

  // Track bounding box for dynamic viewBox calculation
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

  // Calculate geometry parameters
  const barSize = gridSize - gap;
  const offset = gap / 2;

  // Function to calculate top face vertices for a cell
  function getBarVertices(c: number, r: number, h: number) {
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

  // Function to calculate ribbon points at any fractional column coordinate
  function getRibbonPoints(cFraction: number, r: number, h: number) {
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

  // Function to calculate grid intersection coordinates (for grid lines)
  function getGridIntersection(c: number, r: number) {
    const xVal = c * gridSize;
    const yVal = r * gridSize;
    return {
      x: (xVal - yVal) * cosAngle,
      y: (xVal + yVal) * sinAngle,
    };
  }

  // Pre-calculate bounds
  // Grid bounds:
  for (let c = 0; c <= cols; c++) {
    for (let r = 0; r <= rows; r++) {
      const pt = getGridIntersection(c, r);
      updateBounds(pt.x, pt.y);
    }
  }

  // Bar height bounds:
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

          const ptsStart = getRibbonPoints(c, r, h_start);
          const ptsMid = getRibbonPoints(c + 0.5, r, h_mid);
          const ptsEnd = getRibbonPoints(c + 1, r, h_end);

          updateBounds(ptsStart.back.x, ptsStart.back.y);
          updateBounds(ptsStart.front.x, ptsStart.front.y);
          updateBounds(ptsMid.back.x, ptsMid.back.y);
          updateBounds(ptsMid.front.x, ptsMid.front.y);
          updateBounds(ptsEnd.back.x, ptsEnd.back.y);
          updateBounds(ptsEnd.front.x, ptsEnd.front.y);

          // Floor bounds
          const ptsStartFloor = getRibbonPoints(c, r, 0);
          const ptsEndFloor = getRibbonPoints(c + 1, r, 0);
          updateBounds(ptsStartFloor.back.x, ptsStartFloor.back.y);
          updateBounds(ptsStartFloor.front.x, ptsStartFloor.front.y);
          updateBounds(ptsEndFloor.back.x, ptsEndFloor.back.y);
          updateBounds(ptsEndFloor.front.x, ptsEndFloor.front.y);
        } else {
          const vertices = getBarVertices(c, r, 0);
          updateBounds(vertices.top.x, vertices.top.y);
          updateBounds(vertices.left.x, vertices.left.y);
          updateBounds(vertices.front.x, vertices.front.y);
          updateBounds(vertices.right.x, vertices.right.y);
        }
      } else {
        const h_top = Math.max(0, h);
        const h_bottom = Math.min(0, h);
        const verticesTop = getBarVertices(c, r, h_top);
        const verticesBottom = getBarVertices(c, r, h_bottom);
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

  // Column labels bounds:
  const colLabelInterval = options.colLabelInterval ?? 1;
  const rLabel = labelPosition === 'front' ? rows + 0.5 : -1.2;
  if (colLabels) {
    for (let c = 0; c < cols; c += colLabelInterval) {
      if (colLabels[c]) {
        const xStart = c * gridSize + offset;
        const yStart = rLabel * gridSize + offset;
        const x = (xStart - yStart) * cosAngle;
        const y = (xStart + yStart) * sinAngle;
        updateBounds(x - 20, y - 10);
        updateBounds(x + 20, y + 10);
      }
    }
  }

  // Row labels bounds:
  const rowLabelInterval = options.rowLabelInterval ?? 1;
  const cLabel = labelPosition === 'front' ? cols + 0.5 : -1.2;
  if (rowLabels) {
    for (let r = 0; r < rows; r += rowLabelInterval) {
      if (rowLabels[r]) {
        const xStart = cLabel * gridSize + offset;
        const yStart = r * gridSize + offset;
        const x = (xStart - yStart) * cosAngle;
        const y = (xStart + yStart) * sinAngle;
        updateBounds(x - 30, y - 10);
        updateBounds(x + 30, y + 10);
      }
    }
  }

  // Generate SVG elements cell-by-cell
  const elements: string[] = [];

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      // 1. Draw grid cell polygon if showGrid is true
      if (showGrid) {
        const p0 = getGridIntersection(c, r);
        const p1 = getGridIntersection(c, r + 1);
        const p2 = getGridIntersection(c + 1, r + 1);
        const p3 = getGridIntersection(c + 1, r);
        const gridPolygon = `<polygon class="iso-grid-cell" points="${p0.x.toFixed(2)},${p0.y.toFixed(2)} ${p1.x.toFixed(2)},${p1.y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)} ${p3.x.toFixed(2)},${p3.y.toFixed(2)}" fill="none" stroke="${gridColor}" stroke-width="0.5" />`;
        elements.push(gridPolygon);
      }

      const pt = getPoint(c, r);
      if (pt.value === null) {
        continue;
      }
      const h = maxAbsValue > 0 ? (pt.value / maxAbsValue) * maxHeight : 0;
      const h_top = Math.max(0, h);
      const h_bottom = Math.min(0, h);
      const verticesTop = getBarVertices(c, r, h_top);
      const verticesBottom = getBarVertices(c, r, h_bottom);

      // Determine base color
      const baseColor = pt.color ?? (pt.value === 0 && options.zeroColor ? options.zeroColor : getColorForValue(pt.value, maxAbsValue, theme, negativeTheme));

      // Shaded faces
      const colors = {
        top: baseColor,
        left: shadeHex(baseColor, 0.85),
        right: shadeHex(baseColor, 0.70)
      };

      const titleText = pt.label ?? `Col ${c}, Row ${r}: ${pt.value}`;
      const titleTag = interactive ? `<title>${escapeHtml(titleText)}</title>` : '';
      const delay = (c + r) * 15;
      const origin = pt.value < 0 ? 'top' : 'bottom';
      const inlineStyle = (interactive && animated) ? ` style="animation-delay: ${delay}ms; transform-origin: ${origin};"` : '';

      let barSvg = '';
      if (shape === 'cylinder') {
        barSvg = renderCylinder(c, r, pt.value, h, baseColor, colors, verticesTop, verticesBottom, barSize, cosAngle, sinAngle, opacity, renderFlatZero, titleTag, inlineStyle, uniqueColors);
      } else if (shape === 'ribbon') {
        if (h === 0) {
          if (renderFlatZero) {
            // Draw flat polygon for zero ribbon cells
            const t = verticesTop.top;
            const l = verticesTop.left;
            const f = verticesTop.front;
            const rg = verticesTop.right;
            const points = `${t.x.toFixed(2)},${t.y.toFixed(2)} ${l.x.toFixed(2)},${l.y.toFixed(2)} ${f.x.toFixed(2)},${f.y.toFixed(2)} ${rg.x.toFixed(2)},${rg.y.toFixed(2)}`;
            barSvg = `<g class="iso-bar" data-col="${c}" data-row="${r}" data-value="${pt.value}"${inlineStyle}>
                ${titleTag}
                <polygon points="${points}" fill="${colors.top}" stroke="${colors.top}" stroke-width="0.3" stroke-linejoin="round" fill-opacity="${opacity}" stroke-opacity="${opacity}" />
              </g>`;
          }
        } else {
          barSvg = renderRibbon(c, r, pt.value, h, colors, opacity, titleTag, inlineStyle, cols, maxAbsValue, maxHeight, getPoint, getRibbonPoints);
        }
      } else {
        barSvg = renderPrism(c, r, pt.value, h, colors, verticesTop, verticesBottom, opacity, renderFlatZero, titleTag, inlineStyle);
      }

      if (barSvg) {
        elements.push(barSvg);
      }
    }
  }

  // Render Column labels
  if (colLabels) {
    const colLabelsGroup: string[] = [];
    const colAnchor = 'middle';
    
    for (let c = 0; c < cols; c += colLabelInterval) {
      const label = colLabels[c];
      if (label) {
        const xStart = c * gridSize + offset;
        const yStart = rLabel * gridSize + offset;
        const x = (xStart - yStart) * cosAngle;
        const y = (xStart + yStart) * sinAngle;

        const adjustedX = x;
        const adjustedY = labelPosition === 'front' ? y + 10 : y;

        colLabelsGroup.push(
          `<text x="${adjustedX.toFixed(2)}" y="${adjustedY.toFixed(2)}" fill="${labelColor}" font-size="${labelFontSize}" font-family="sans-serif" text-anchor="${colAnchor}">${escapeHtml(label)}</text>`
        );
      }
    }
    elements.push(`<g class="iso-col-labels">${colLabelsGroup.join('\n')}</g>`);
  }

  // Render Row labels
  if (rowLabels) {
    const rowLabelsGroup: string[] = [];
    const rowAnchor = labelPosition === 'front' ? 'start' : 'end';
    
    for (let r = 0; r < rows; r += rowLabelInterval) {
      const label = rowLabels[r];
      if (label) {
        const xStart = cLabel * gridSize + offset;
        const yStart = r * gridSize + offset;
        const x = (xStart - yStart) * cosAngle;
        const y = (xStart + yStart) * sinAngle;

        const adjustedX = labelPosition === 'front' ? x + 6 : x - 6;
        const adjustedY = y + 3;

        rowLabelsGroup.push(
          `<text x="${adjustedX.toFixed(2)}" y="${adjustedY.toFixed(2)}" fill="${labelColor}" font-size="${labelFontSize}" font-family="sans-serif" text-anchor="${rowAnchor}">${escapeHtml(label)}</text>`
        );
      }
    }
    elements.push(`<g class="iso-row-labels">${rowLabelsGroup.join('\n')}</g>`);
  }

  // Assemble final SVG
  const width = (maxX - minX) + 2 * padding;
  const height = (maxY - minY) + 2 * padding;
  const viewX = minX - padding;
  const viewY = minY - padding;

  const styleTag = interactive
    ? `<style>
        ${animated ? `@keyframes iso-grow {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }` : ''}
        .iso-bar {
          ${animated ? `transform-box: fill-box;
          animation: iso-grow 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;` : ''}
          transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.2s ease;
          cursor: pointer;
        }
        .iso-bar:hover {
          filter: brightness(1.1) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
          transform: translateY(-3px)${animated ? ' scaleY(1)' : ''};
        }
        .iso-face-top, .iso-face-left, .iso-face-right, .iso-bridge-top, .iso-bridge-front {
          transition: fill 0.2s ease;
        }
      </style>`
    : '';

  // Generate defs for cylinder gradients
  let defsSvg = '';
  if (shape === 'cylinder' && uniqueColors.size > 0) {
    const gradients: string[] = [];
    uniqueColors.forEach(color => {
      const gradId = 'cyl-grad-' + color.replace('#', '');
      gradients.push(
        `<linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${shadeHex(color, 0.85)}" stop-opacity="${opacity}" />
          <stop offset="35%" stop-color="${color}" stop-opacity="${opacity}" />
          <stop offset="75%" stop-color="${shadeHex(color, 0.70)}" stop-opacity="${opacity}" />
          <stop offset="100%" stop-color="${shadeHex(color, 0.50)}" stop-opacity="${opacity}" />
        </linearGradient>`
      );
    });
    defsSvg = `<defs>${gradients.join('\n')}</defs>`;
  }

  const titleSvg = title
    ? `<text x="${(viewX + width / 2).toFixed(2)}" y="${(viewY + padding * 0.7).toFixed(2)}" fill="${isDark ? '#f0f6fc' : '#24292f'}" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">${escapeHtml(title)}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX.toFixed(2)} ${viewY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}" width="100%" height="100%">
    ${styleTag}
    ${defsSvg}
    ${titleSvg}
    <g>
      ${elements.join('\n')}
    </g>
  </svg>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
