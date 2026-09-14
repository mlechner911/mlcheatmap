/**
 * Value-domain scaling: per-grid default vs. fixed shared domain.
 *
 * The heightGrid tick labels expose the effective scale maximum, and the
 * prism top-face vertex exposes the effective bar height — both assertable
 * without pixel rendering.
 */
import { describe, expect, it } from 'vitest';
import { HeatmapGrid } from '../src/index';

function gridWithPeak(peak: number): HeatmapGrid {
  const grid = new HeatmapGrid(4, 2);
  grid.setCell(1, 0, 10, 'probe cell, identical in every grid');
  grid.setCell(0, 0, peak, 'peak setting this grid apart');
  grid.rowLabels = ['R0', 'R1'];
  grid.colLabels = ['C0', 'C1', 'C2', 'C3'];
  return grid;
}

/** Extracts the numeric heightGrid tick labels from an SVG string. */
function tickLabels(svg: string): number[] {
  const matches = [...svg.matchAll(/<text[^>]*>(-?\d+(?:\.\d+)?)<\/text>/g)];
  return matches.map((m) => parseFloat(m[1]));
}

/** Screen y of the prism top vertex at (col, row). Polygon coordinates live
 * in data space (the viewBox only transforms the view), so values are directly
 * comparable across SVGs with identical grid geometry. */
function barTopY(svg: string, col: number, row: number): number {
  const group = new RegExp(
    `<g class="iso-bar" data-col="${col}" data-row="${row}"[^>]*>[\\s\\S]*?iso-face-top" points="(-?[\\d.]+),(-?[\\d.]+)`
  );
  const match = svg.match(group);
  if (!match) throw new Error(`no prism bar found at ${col},${row}`);
  return parseFloat(match[2]);
}

describe('per-grid scaling (default)', () => {
  it('normalizes to the data maximum', () => {
    const svg = gridWithPeak(20).render({ heightGrid: { ticks: 2 } });
    const ticks = tickLabels(svg);
    expect(ticks).toContain(20);
    expect(ticks).not.toContain(100);
  });
});

describe('valueDomain (shared composite scale)', () => {
  it('overrides the data maximum for height and tick labels', () => {
    const svg = gridWithPeak(20).render({
      valueDomain: { min: 0, max: 100 },
      heightGrid: { ticks: 2 },
    });
    const ticks = tickLabels(svg);
    expect(ticks).toContain(100);
    expect(ticks).not.toContain(20);
  });

  it('renders identical values at identical heights across grids', () => {
    const domain = { min: 0, max: 100 };
    const topA = barTopY(gridWithPeak(20).render({ valueDomain: domain }), 1, 0);
    const topB = barTopY(gridWithPeak(80).render({ valueDomain: domain }), 1, 0);
    expect(topA).toBeCloseTo(topB, 2);
  });

  it('control: without a domain the same probe cell differs (test is sensitive)', () => {
    const topA = barTopY(gridWithPeak(20).render({}), 1, 0);
    const topB = barTopY(gridWithPeak(80).render({}), 1, 0);
    expect(Math.abs(topA - topB)).toBeGreaterThan(1);
  });
});
