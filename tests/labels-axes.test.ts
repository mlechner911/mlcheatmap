/**
 * Labels, axes and walls: visibility rules and geometric effects.
 */
import { describe, expect, it } from 'vitest';
import { HeatmapGrid } from '../src/index';

function labeledGrid(): HeatmapGrid {
  const grid = new HeatmapGrid(4, 3);
  grid.setCell(0, 0, 5, 'a');
  grid.setCell(3, 2, 7, 'b');
  grid.rowLabels = ['Mon', 'Tue', 'Wed'];
  grid.colLabels = ['W1', 'W2', 'W3', 'W4'];
  return grid;
}

/** Y coordinates of all column-label texts in an SVG. */
function colLabelY(svg: string, text: string): number[] {
  const matches = [...svg.matchAll(
    new RegExp(`<text[^>]*>(${text})<\\/text>`, 'g')
  )];
  return matches.map((m) => {
    const tag = m[0].match(/y="(-?[\d.]+)"/)!;
    return parseFloat(tag[1]);
  });
}

describe('row label visibility', () => {
  it('shows grid labels by default', () => {
    expect(labeledGrid().render({})).toContain('>Tue<');
  });

  it('hides grid labels with showRowLabels: false', () => {
    const svg = labeledGrid().render({ showRowLabels: false });
    expect(svg).not.toContain('>Tue<');
    expect(svg).not.toContain('iso-row-labels');
  });

  it('documents the undefined fallback: rowLabels: undefined keeps grid labels', () => {
    // Renderer resolves `options.rowLabels ?? grid.rowLabels`, so an explicit
    // undefined cannot clear labels — use showRowLabels: false instead.
    // If this ever changes, update the HeatmapOptions.showRowLabels JSDoc too.
    const svg = labeledGrid().render({ rowLabels: undefined });
    expect(svg).toContain('>Tue<');
  });
});

describe('showAxis', () => {
  it('is off by default (backwards compatible)', () => {
    const svg = labeledGrid().render({});
    expect(svg).not.toContain('iso-axis-rule');
    expect(svg).not.toContain('iso-axis-tick');
  });

  it('draws two baseline rules plus ticks per labeled line', () => {
    const svg = labeledGrid().render({ showAxis: true });
    expect(svg.match(/iso-axis-rule/g)!.length).toBe(2);
    // 4 labeled columns + 3 labeled rows
    expect(svg.match(/iso-axis-tick/g)!.length).toBe(7);
  });

  it('row ticks follow showRowLabels', () => {
    const svg = labeledGrid().render({ showAxis: true, showRowLabels: false });
    expect(svg.match(/iso-axis-tick/g)!.length).toBe(4);
  });
});

describe('showAxisWalls', () => {
  it('draws one wall per rear edge plus ruling lines', () => {
    const svg = labeledGrid().render({ showAxisWalls: true, axisWallHeight: 28 });
    expect(svg.match(/iso-axis-wall"/g)!.length).toBe(2);
    // ruling lines for 4 columns + 3 rows
    expect(svg.match(/iso-axis-wall-rule/g)!.length).toBe(7);
  });

  it('lifts labels onto the wall top with labelLift', () => {
    const plain = colLabelY(labeledGrid().render({}), 'W2');
    const lifted = colLabelY(
      labeledGrid().render({ showAxisWalls: true, axisWallHeight: 28, labelLift: 28 }),
      'W2'
    );
    expect(plain.length).toBe(1);
    expect(lifted.length).toBe(1);
    expect(plain[0] - lifted[0]).toBeCloseTo(28, 1);
  });
});

describe('label rotation', () => {
  it('emits no transform by default', () => {
    expect(labeledGrid().render({})).not.toContain('rotate(');
  });

  it('centers vertical row labels on their anchor (middle)', () => {
    const svg = labeledGrid().render({ rowLabelAngle: -90 });
    expect(svg).toContain('rotate(-90');
    expect(svg).toContain('text-anchor="middle"');
  });
});

describe('null cells', () => {
  it('renders no bar for null values', () => {
    const grid = new HeatmapGrid(3, 3);
    grid.setCell(1, 1, null, 'missing');
    grid.setCell(0, 0, 5, 'present');
    const svg = grid.render({});
    expect(svg).not.toContain('data-col="1" data-row="1"');
    expect(svg).toContain('data-col="0" data-row="0"');
  });
});
