import { GeometryConfig } from './geometry';

export interface ColLabelParams {
  colLabels: string[];
  colLabelInterval: number;
  cols: number;
  rLabel: number;
  geometryConfig: GeometryConfig;
  labelColor: string;
  labelFontSize: number;
  escapeHtml: (str: string) => string;
}

export function renderColLabels(params: ColLabelParams): string {
  const {
    colLabels,
    colLabelInterval,
    cols,
    rLabel,
    geometryConfig,
    labelColor,
    labelFontSize,
    escapeHtml
  } = params;

  const { gridSize, gap, cosAngle, sinAngle } = geometryConfig;
  const offset = gap / 2;
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
      // Offset if front-side
      const adjustedY = rLabel > 0 ? y + 10 : y;

      colLabelsGroup.push(
        `<text x="${adjustedX.toFixed(2)}" y="${adjustedY.toFixed(2)}" fill="${labelColor}" font-size="${labelFontSize}" font-family="sans-serif" text-anchor="${colAnchor}">${escapeHtml(label)}</text>`
      );
    }
  }

  return `<g class="iso-col-labels">${colLabelsGroup.join('\n')}</g>`;
}

export interface RowLabelParams {
  rowLabels: string[];
  rowLabelInterval: number;
  rows: number;
  cLabel: number;
  geometryConfig: GeometryConfig;
  labelColor: string;
  labelFontSize: number;
  labelPosition: 'behind' | 'front';
  escapeHtml: (str: string) => string;
}

export function renderRowLabels(params: RowLabelParams): string {
  const {
    rowLabels,
    rowLabelInterval,
    rows,
    cLabel,
    geometryConfig,
    labelColor,
    labelFontSize,
    labelPosition,
    escapeHtml
  } = params;

  const { gridSize, gap, cosAngle, sinAngle } = geometryConfig;
  const offset = gap / 2;
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

  return `<g class="iso-row-labels">${rowLabelsGroup.join('\n')}</g>`;
}
