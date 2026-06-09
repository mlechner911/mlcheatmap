import { HeatmapDataPoint, HeatmapOptions, CustomColorScheme } from '../data/types';
import { LIGHT_THEMES, DARK_THEMES, NEGATIVE_LIGHT_THEMES, NEGATIVE_DARK_THEMES, getColorForValue, shadeHex, rotateHue } from './color';
import { renderPrism } from './prism';
import { renderCylinder } from './cylinder';
import { renderRibbon } from './ribbon';
import { GeometryConfig, getGridIntersection, getBarVertices, getRibbonPoints } from './geometry';
import { calculateBounds } from './bounds';
import { renderColLabels, renderRowLabels } from './labels';

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

  const geometryConfig: GeometryConfig = {
    gridSize,
    gap,
    cosAngle,
    sinAngle
  };

  const colLabelInterval = options.colLabelInterval ?? 1;
  const rowLabelInterval = options.rowLabelInterval ?? 1;

  // Pre-calculate bounds
  const bounds = calculateBounds({
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
  });

  const barSize = gridSize - gap;
  const offset = gap / 2;

  // Generate SVG elements cell-by-cell
  const elements: string[] = [];

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      // 1. Draw grid cell polygon if showGrid is true
      if (showGrid) {
        const p0 = getGridIntersection(c, r, geometryConfig);
        const p1 = getGridIntersection(c, r + 1, geometryConfig);
        const p2 = getGridIntersection(c + 1, r + 1, geometryConfig);
        const p3 = getGridIntersection(c + 1, r, geometryConfig);
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
      const verticesTop = getBarVertices(c, r, h_top, geometryConfig);
      const verticesBottom = getBarVertices(c, r, h_bottom, geometryConfig);

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
          barSvg = renderRibbon(c, r, pt.value, h, colors, opacity, titleTag, inlineStyle, cols, maxAbsValue, maxHeight, getPoint, (cFraction, row, height) => getRibbonPoints(cFraction, row, height, geometryConfig));
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
  const rLabel = labelPosition === 'front' ? rows + 0.5 : -1.2;
  if (colLabels) {
    const colLabelsSvg = renderColLabels({
      colLabels,
      colLabelInterval,
      cols,
      rLabel,
      geometryConfig,
      labelColor,
      labelFontSize,
      escapeHtml
    });
    elements.push(colLabelsSvg);
  }

  // Render Row labels
  const cLabel = labelPosition === 'front' ? cols + 0.5 : -1.2;
  if (rowLabels) {
    const rowLabelsSvg = renderRowLabels({
      rowLabels,
      rowLabelInterval,
      rows,
      cLabel,
      geometryConfig,
      labelColor,
      labelFontSize,
      labelPosition,
      escapeHtml
    });
    elements.push(rowLabelsSvg);
  }

  // Assemble final SVG
  const width = (bounds.maxX - bounds.minX) + 2 * padding;
  const height = (bounds.maxY - bounds.minY) + 2 * padding;
  const viewX = bounds.minX - padding;
  const viewY = bounds.minY - padding;

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
