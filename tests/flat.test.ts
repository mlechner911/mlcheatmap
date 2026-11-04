/**
 * view: 'flat': a standard heatmap from the same data and options as the 3D view.
 */
import { describe, expect, it } from 'vitest';
import { HeatmapGrid, renderHeatmap } from '../src/index';
import { presets } from '../src/presets';

function grid(): HeatmapGrid {
  const result = new HeatmapGrid(3, 2);
  result.setCell(0, 0, 10, 'first');
  result.setCell(1, 0, 0);
  result.setCell(2, 1, -5);
  result.colLabels = ['A', 'B', 'C'];
  result.rowLabels = ['One', 'Two'];
  return result;
}

function viewBox(svg: string): number[] {
  return /viewBox="([^"]+)"/.exec(svg)![1].split(' ').map(Number);
}

/** The anchor of a label, from the translation of its group. */
function labelAnchor(svg: string, text: string): { x: number; y: number } {
  const match = new RegExp(`translate\\((-?[\\d.]+) (-?[\\d.]+)\\) rotate\\([^)]*\\)">(?:<rect[^>]*/>)?<text[^>]*>${text}</text>`).exec(svg)!;
  return { x: Number(match[1]), y: Number(match[2]) };
}

describe('flat cells', () => {
  it('draws straight rectangles and no 3D faces', () => {
    const svg = grid().render({ view: 'flat' });
    expect(svg).toContain('<rect x="0" y="0" width="14" height="14"');
    expect(svg).not.toContain('<polygon');
    expect(svg).not.toContain('iso-grow');
  });

  it('lays cells out by column and row', () => {
    const svg = grid().render({ view: 'flat', gridSize: 20, gap: 4 });
    expect(svg).toContain('<rect x="40" y="20" width="16" height="16"');
  });

  it('colors a value exactly like the 3D view', () => {
    const options = { colorScheme: 'sunset', interpolateColors: true } as const;
    const flat = /data-value="10"[^]*?fill="(#[0-9a-f]+)"/.exec(grid().render({ ...options, view: 'flat' }))![1];
    // The first face of a 3D bar is a shaded side, so look for the color anywhere in it.
    expect(grid().render(options)).toContain(`fill="${flat}"`);
  });

  it('gives negative values their own color', () => {
    const svg = grid().render({ view: 'flat', colorScheme: 'emerald' });
    const fill = (value: number): string => new RegExp(`data-value="${value}"[^]*?fill="(#[0-9a-f]+)"`).exec(svg)![1];
    expect(fill(-5)).not.toBe(fill(10));
  });

  it('keeps tooltips and the hooks of 3D cells', () => {
    const svg = grid().render({ view: 'flat', tooltipFormatter: (point) => `value ${point.value}` });
    expect(svg).toContain('<title>value 10</title>');
    expect(svg).toContain('class="iso-bar iso-flat" data-col="0" data-row="0" data-value="10"');
  });

  it('honors interactive and animated', () => {
    const still = grid().render({ view: 'flat', animated: false });
    expect(still).not.toContain('animation');
    const plain = grid().render({ view: 'flat', interactive: false });
    expect(plain).not.toContain('<title>first');
    expect(plain).not.toContain('<style>');
  });

  it('writes face text straight into the cell', () => {
    const data = new HeatmapGrid(1, 1);
    data.setCell(0, 0, 3, 'x', undefined, '17');
    const svg = data.render({ view: 'flat' });
    expect(svg).toMatch(/<text class="iso-face-text" x="7" [^>]*>17<\/text>/);
    expect(svg).not.toContain('matrix(');
  });

  it('honors the color of a point and zeroColor', () => {
    const data = new HeatmapGrid(2, 1);
    data.setCell(0, 0, 3, 'x', '#123456');
    data.setCell(1, 0, 0);
    const svg = data.render({ view: 'flat', zeroColor: '#abcdef' });
    expect(svg).toContain('fill="#123456"');
    expect(svg).toContain('fill="#abcdef"');
  });
});

describe('flat floor', () => {
  it('outlines empty cells, and only those', () => {
    expect(grid().render({ view: 'flat' }).match(/iso-grid-cell/g)).toHaveLength(3);
    expect(grid().render({ view: 'flat', showGrid: false })).not.toContain('iso-grid-cell');
    expect(grid().render({ view: 'flat', gridCells: 'data' })).not.toContain('iso-grid-cell');
  });

  it('replaces a hidden zero by its outline', () => {
    const svg = grid().render({ view: 'flat', renderFlatZero: false, gridCells: 'data' });
    expect(svg).not.toContain('data-value="0"');
    expect(svg.match(/iso-grid-cell/g)).toHaveLength(1);
  });
});

describe('flat labels', () => {
  it('puts column labels above and row labels left', () => {
    const svg = grid().render({ view: 'flat' });
    expect(labelAnchor(svg, 'A').y).toBeLessThan(0);
    expect(labelAnchor(svg, 'One').x).toBeLessThan(0);
    expect(labelAnchor(svg, 'A').x).toBeCloseTo(7);
    expect(labelAnchor(svg, 'Two').y).toBeCloseTo(23);
  });

  it('moves column labels below with labelPosition front', () => {
    const svg = grid().render({ view: 'flat', labelPosition: 'front' });
    expect(labelAnchor(svg, 'A').y).toBeGreaterThan(30);
    expect(labelAnchor(svg, 'One').x).toBeLessThan(0);
  });

  it('keeps every label inside the drawing', () => {
    const long = new HeatmapGrid(3, 2);
    long.rowLabels = ['A rather long row label', 'Short'];
    long.colLabels = ['A rather long column label', '', ''];
    for (const colLabelAngle of [0, -45, -90, 45, 90]) {
      for (const labelPosition of ['behind', 'front'] as const) {
        const svg = long.render({ view: 'flat', colLabelAngle, labelPosition, padding: 0 });
        const [x, y, width, height] = viewBox(svg);
        const col = labelAnchor(svg, 'A rather long column label');
        expect(col.x).toBeGreaterThanOrEqual(x);
        expect(col.x).toBeLessThanOrEqual(x + width);
        expect(col.y).toBeGreaterThanOrEqual(y);
        expect(col.y).toBeLessThanOrEqual(y + height);
        expect(x).toBeLessThanOrEqual(-long.rowLabels[0].length * 9 * 0.55);
      }
    }
  });

  it('makes rotated labels read away from the grid', () => {
    const anchor = (svg: string): string => /text-anchor="(\w+)">A</.exec(svg)![1];
    expect(anchor(grid().render({ view: 'flat', colLabelAngle: -45 }))).toBe('start');
    expect(anchor(grid().render({ view: 'flat', colLabelAngle: 45 }))).toBe('end');
    expect(anchor(grid().render({ view: 'flat', colLabelAngle: -45, labelPosition: 'front' }))).toBe('end');
    expect(anchor(grid().render({ view: 'flat', colLabelAngle: 45, labelPosition: 'front' }))).toBe('start');
  });

  it('thins labels with a number and with auto', () => {
    const wide = new HeatmapGrid(12, 1);
    wide.colLabels = Array.from({ length: 12 }, (_, i) => `Label ${i}`);
    expect(wide.render({ view: 'flat', colLabelInterval: 3 }).match(/>Label \d+</g)).toHaveLength(4);
    const auto = wide.render({ view: 'flat', colLabelInterval: 'auto' }).match(/>Label \d+</g)!;
    expect(auto.length).toBeLessThan(12);
    expect(auto.length).toBeGreaterThan(1);
  });

  it('thins rows by their height, not their width', () => {
    const tall = new HeatmapGrid(1, 10);
    tall.rowLabels = Array.from({ length: 10 }, (_, i) => `A very long row label ${i}`);
    expect(tall.render({ view: 'flat', rowLabelInterval: 'auto' }).match(/>A very long row label \d</g)).toHaveLength(10);
  });

  it('hides row labels with showRowLabels false', () => {
    expect(grid().render({ view: 'flat', showRowLabels: false })).not.toContain('>One<');
  });

  it('draws pills behind row labels and keeps them in the drawing', () => {
    const svg = grid().render({ view: 'flat', padding: 0, rowLabelStyle: { backgroundColor: '#000000', padding: 6 } });
    expect(svg).toMatch(/<rect x="-[\d.]+" y="-[\d.]+" [^>]*fill="#000000"/);
    expect(viewBox(svg)[0]).toBeLessThanOrEqual(labelAnchor(svg, 'One').x - 3 * 9 * 0.55 - 6);
  });

  it('centers vertical row labels on their row', () => {
    expect(/text-anchor="(\w+)">One</.exec(grid().render({ view: 'flat', rowLabelAngle: -90 }))![1]).toBe('middle');
  });
});

describe('flat axis', () => {
  it('draws axis lines with one tick per label, beside the labels', () => {
    const svg = grid().render({ view: 'flat', showAxis: true, axisColor: '#ff0000' });
    expect(svg.match(/<line [^>]*stroke="#ff0000"/g)).toHaveLength(2 + 3 + 2);
    expect(labelAnchor(svg, 'A').y).toBeLessThan(-2 - 5);
  });
});

describe('ignored 3D options', () => {
  it('have no effect on the drawing', () => {
    const plain = grid().render({ view: 'flat' });
    expect(grid().render({
      view: 'flat',
      shape: 'cylinder',
      maxHeight: 200,
      projectionAngle: 50,
      labelMode: 'axis',
      labelLift: 30,
      showAxisWalls: true,
      heightGrid: { ticks: 3 },
    })).toBe(plain);
  });
});

describe('documents', () => {
  it('shows the title and scales by valueDomain like the 3D view', () => {
    const svg = grid().render({ view: 'flat', title: 'A & B', valueDomain: { min: 0, max: 1000 } });
    expect(svg).toContain('A &amp; B');
    const fill = /data-value="10"[^]*?fill="(#[0-9a-f]+)"/.exec(svg)![1];
    const fullScale = /data-value="10"[^]*?fill="(#[0-9a-f]+)"/.exec(grid().render({ view: 'flat' }))![1];
    expect(fill).not.toBe(fullScale);
  });

  it('returns a placeable group with wrapper g', () => {
    const svg = grid().render({ view: 'flat', wrapper: 'g' });
    expect(svg.startsWith('<g class="iso-heatmap-group"')).toBe(true);
    expect(svg).toContain('data-width=');
  });

  it('does not call a flat chart 3D', () => {
    expect(grid().render({ view: 'flat' })).not.toContain('3D');
  });

  it('also works from renderHeatmap with raw points', () => {
    const svg = renderHeatmap([{ col: 1, row: 1, value: 4 }], { view: 'flat', cols: 2, rows: 2 });
    expect(svg).toContain('<rect x="16" y="16"');
  });
});

describe('presets', () => {
  const september = [{ date: '2026-09-01', value: 12 }, { date: '2026-09-30', value: 7 }];

  it('draw a calendar month with day numbers and weekdays on top', () => {
    const svg = presets.aggregateCalendarMonth(september, { year: 2026, month: 8 }).render({ view: 'flat' });
    expect(svg).toContain('>30</text>');
    expect(labelAnchor(svg, 'Mon').y).toBeLessThan(0);
    expect(svg).not.toContain('<polygon');
  });

  it('keep labelPosition front as the 3D default for the calendar month', () => {
    const calendar = presets.aggregateCalendarMonth(september, { year: 2026, month: 8 });
    expect(calendar.render({})).toBe(calendar.render({ labelPosition: 'front' }));
  });

  it('draw a year', () => {
    const svg = presets.aggregateYear(september, { year: 2026 }).render({ view: 'flat' });
    expect(svg).not.toContain('<polygon');
    expect(svg).toContain('data-value="12"');
  });
});

describe('the default view', () => {
  it('stays isometric', () => {
    expect(grid().render({})).toBe(grid().render({ view: 'isometric' }));
    expect(grid().render({})).toContain('<polygon');
  });
});
