/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { shadeHex } from './color';

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

export function renderStyleTag(animated: boolean): string {
  return `<style>
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
      </style>`;
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

export function renderMetadata(creator: string, title: string | undefined, description: string): string {
  const currentDate = new Date().toISOString().split('T')[0];
  return `<metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
             xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description rdf:about="">
        <dc:creator>${escapeHtml(creator)}</dc:creator>
        <dc:date>${currentDate}</dc:date>
        <dc:title>${title ? escapeHtml(title.replace(/\n/g, ' — ')) : 'MLC Isometric 3D Heatmap'}</dc:title>
        <dc:description>${escapeHtml(description)}</dc:description>
      </rdf:Description>
    </rdf:RDF>
  </metadata>`;
}
