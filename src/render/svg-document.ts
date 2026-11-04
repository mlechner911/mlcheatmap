/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { shadeHex } from './color';

const TITLE_LINE_HEIGHT = 18;

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export function wrapTitle(title: string | undefined, svgWidth: number): string[] {
  if (!title) return [];
  const maxChars = Math.max(25, Math.floor((svgWidth - 60) / 8.5));
  return title.split('\n').flatMap(line => (line.length > maxChars ? wrapText(line, maxChars) : [line]));
}

export function renderTitle(params: {
  lines: readonly string[];
  viewX: number;
  viewY: number;
  width: number;
  padding: number;
  lineHeight: number;
  isDark: boolean;
}): string {
  const { lines, viewX, viewY, width, padding, lineHeight, isDark } = params;
  return lines.map((line, idx) => {
    const y = viewY + padding * 0.7 + idx * lineHeight;
    return `<text x="${(viewX + width / 2).toFixed(2)}" y="${y.toFixed(2)}" fill="${isDark ? '#f0f6fc' : '#24292f'}" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">${escapeHtml(line)}</text>`;
  }).join('\n');
}

/** Delay between two neighbouring diagonals of the entrance animation. */
const STAGGER_MS = 15;

/** The class that delays a cell by its diagonal; none for the first one, which starts at once. */
export function staggerClass(col: number, row: number): string {
  return col + row > 0 ? `iso-d${col + row}` : '';
}

/** One rule per diagonal, so that cells only name their class. Identical across charts. */
function staggerRules(diagonals: number): string {
  const rules: string[] = [];
  for (let d = 1; d < diagonals; d++) {
    rules.push(`.iso-d${d}{animation-delay:${d * STAGGER_MS}ms}`);
  }
  return rules.join('');
}

/**
 * The classes that switch on a chart's style rules. Inline SVG styles apply to the whole page,
 * so every rule is scoped by them, and a chart without animation stays still next to one with.
 */
export function viewClass(view: '3d' | 'flat', interactive: boolean, animated: boolean): string {
  if (!interactive) return '';
  return animated ? `iso-view-${view} iso-animated` : `iso-view-${view}`;
}

/**
 * The animation keeps to `backwards`: holding its end state would override the hover transform.
 * Its parts are set one by one, as a shorthand would reset the delay from the stagger rules.
 */
export function renderStyleTag(animated: boolean, diagonals: number): string {
  return `<style>
        ${animated ? '@keyframes iso-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}' : ''}
        .iso-view-3d .iso-bar{cursor:pointer;transition:filter .2s ease}
        .iso-view-3d .iso-bar:hover{filter:brightness(1.1) drop-shadow(0 4px 6px rgba(0,0,0,.2))}
        @media (prefers-reduced-motion:no-preference){
          .iso-view-3d .iso-bar{transition:transform .2s cubic-bezier(.25,.46,.45,.94),filter .2s ease}
          .iso-view-3d .iso-bar:not(.iso-surface):hover{transform:translateY(-3px)}
          ${animated ? `.iso-view-3d.iso-animated .iso-bar{transform-box:fill-box;transform-origin:bottom;animation-name:iso-grow;animation-duration:.6s;animation-timing-function:cubic-bezier(.16,1,.3,1);animation-fill-mode:backwards}
          .iso-view-3d.iso-animated .iso-bar.iso-neg{transform-origin:top}` : ''}
        }
        ${animated ? staggerRules(diagonals) : ''}
      </style>`;
}

/** Flat cells have no height to grow from or lift, so they fade in and only brighten on hover. */
export function renderFlatStyleTag(animated: boolean, diagonals: number): string {
  return `<style>
        ${animated ? '@keyframes iso-flat-in{from{opacity:0}}' : ''}
        .iso-view-flat .iso-bar{cursor:pointer;transition:filter .2s ease}
        .iso-view-flat .iso-bar:hover{filter:brightness(1.1)}
        ${animated ? `@media (prefers-reduced-motion:no-preference){
          .iso-view-flat.iso-animated .iso-bar{animation-name:iso-flat-in;animation-duration:.4s;animation-timing-function:ease;animation-fill-mode:backwards}
        }
        ${staggerRules(diagonals)}` : ''}
      </style>`;
}

/** Opacity of a shape; nothing at all when it is fully opaque, the SVG default. */
export function opacityAttributes(opacity: number): string {
  return opacity < 1 ? ` fill-opacity="${opacity}" stroke-opacity="${opacity}"` : '';
}

/** One horizontal gradient per cylinder color; empty when no cylinder was drawn. */
export function renderCylinderDefs(colors: ReadonlySet<string>, opacity: number): string {
  if (colors.size === 0) return '';
  const gradients = [...colors].map(color =>
    `<linearGradient id="cyl-grad-${color.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${shadeHex(color, 0.85)}" stop-opacity="${opacity}" />
          <stop offset="35%" stop-color="${color}" stop-opacity="${opacity}" />
          <stop offset="75%" stop-color="${shadeHex(color, 0.70)}" stop-opacity="${opacity}" />
          <stop offset="100%" stop-color="${shadeHex(color, 0.50)}" stop-opacity="${opacity}" />
        </linearGradient>`
  );
  return `<defs>${gradients.join('\n')}</defs>`;
}

export function renderMetadata(creator: string, title: string | undefined, description: string, fallbackTitle: string): string {
  const currentDate = new Date().toISOString().split('T')[0];
  return `<metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
             xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description rdf:about="">
        <dc:creator>${escapeHtml(creator)}</dc:creator>
        <dc:date>${currentDate}</dc:date>
        <dc:title>${title ? escapeHtml(title.replace(/\n/g, ' — ')) : escapeHtml(fallbackTitle)}</dc:title>
        <dc:description>${escapeHtml(description)}</dc:description>
      </rdf:Description>
    </rdf:RDF>
  </metadata>`;
}

/** Wraps a finished drawing into a complete SVG, or a group for composites, with room for its title. */
export function renderDocument(params: {
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  padding: number;
  title: string | undefined;
  isDark: boolean;
  styleTag: string;
  rootClass: string;
  rootAttributes: string;
  defs: string;
  body: string;
  wrapper: 'svg' | 'g';
  creator: string | undefined;
  comment: string;
  fallbackTitle: string;
}): string {
  const { bounds, padding, title, isDark, styleTag, rootClass, rootAttributes, defs, body, wrapper, creator, comment, fallbackTitle } = params;
  const width = (bounds.maxX - bounds.minX) + 2 * padding;
  const titleLines = wrapTitle(title, width);
  const titleOffset = titleLines.length > 1 ? (titleLines.length - 1) * TITLE_LINE_HEIGHT : 0;
  const height = (bounds.maxY - bounds.minY) + 2 * padding + titleOffset;
  const viewX = bounds.minX - padding;
  const viewY = bounds.minY - padding - titleOffset;
  const titleSvg = renderTitle({ lines: titleLines, viewX, viewY, width, padding, lineHeight: TITLE_LINE_HEIGHT, isDark });
  const generatorComment = `<!-- ${comment} -->`;

  if (wrapper === 'g') {
    return `<g class="iso-heatmap-group${rootClass ? ` ${rootClass}` : ''}"${rootAttributes} data-min-x="${viewX.toFixed(2)}" data-min-y="${viewY.toFixed(2)}" data-width="${width.toFixed(2)}" data-height="${height.toFixed(2)}">
      ${generatorComment}
      ${styleTag}
      ${defs}
      ${titleSvg}
      ${body}
    </g>`;
  }

  const metadataSvg = renderMetadata(creator ?? 'Michael Lechner', title, comment, fallbackTitle);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX.toFixed(2)} ${viewY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}" width="100%" height="100%">
    ${generatorComment}
    ${metadataSvg}
    ${styleTag}
    ${defs}
    ${titleSvg}
    <g${rootClass ? ` class="${rootClass}"` : ''}${rootAttributes}>
      ${body}
    </g>
  </svg>`;
}
