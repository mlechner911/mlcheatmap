/**
 * Label layout: placement rules, axis mode and collision-free thinning.
 */
import { describe, expect, it } from 'vitest';
import { HeatmapGrid, renderHeatmap } from '../src/index';
import { axisLabelCorners, requiredLabelStep, thinLabels } from '../src/render/label-layout';
import { contrastingTextColor } from '../src/render/color';

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

function hourGrid(options: Parameters<HeatmapGrid['render']>[0]): string {
  const grid = new HeatmapGrid(24, 1);
  grid.fill(1);
  grid.colLabels = HOURS;
  return grid.render(options);
}

function config(angleDeg: number, gridSize = 16) {
  const rad = (angleDeg * Math.PI) / 180;
  return { gridSize, gap: 2, cosAngle: Math.cos(rad), sinAngle: Math.sin(rad) };
}

describe('labelPosition default', () => {
  it('puts labels in front so that bars cannot hide them', () => {
    const grid = new HeatmapGrid(2, 2);
    grid.fill(5);
    grid.colLabels = ['A', 'B'];
    expect(grid.render({})).toBe(grid.render({ labelPosition: 'front' }));
  });
});

describe('requiredLabelStep', () => {
  const labels = ['00:00'];

  it('needs no thinning when labels fit into one cell', () => {
    expect(requiredLabelStep({ labels: ['A'], axis: 'col', fontSize: 9, padding: 0, angleDeg: 0, config: config(30, 40) })).toBe(1);
  });

  it('thins horizontal labels that are wider than their cell', () => {
    expect(requiredLabelStep({ labels, axis: 'col', fontSize: 9, padding: 0, angleDeg: 0, config: config(30) })).toBe(2);
  });

  it('keeps every parallel axis label once the cell exceeds the font size', () => {
    // 30 * sin(40 deg) = 19.3 px across, font 11 + clearance 2 = 13 px.
    expect(requiredLabelStep({ labels: ['Mo.'], axis: 'row', fontSize: 11, padding: 0, angleDeg: 20, config: config(20, 30) })).toBe(1);
  });
});

describe('thinLabels', () => {
  it('keeps every nth label', () => {
    expect(thinLabels(['a', 'b', 'c', 'd', 'e'], 2)).toEqual(['a', '', 'c', '', 'e']);
  });

  it('measures from labels that exist, not from the index', () => {
    expect(thinLabels(['', 'a', 'b', 'c', ''], 2)).toEqual(['', 'a', '', 'c', '']);
  });
});

describe('colLabelInterval: auto', () => {
  it('drops labels without touching the first', () => {
    const svg = hourGrid({ colLabelInterval: 'auto' });
    expect(svg).toContain('>00:00<');
    expect(svg).not.toContain('>01:00<');
    expect(svg).toContain('>02:00<');
  });

  it('leaves explicit intervals alone', () => {
    expect(hourGrid({ colLabelInterval: 1 })).toContain('>01:00<');
  });
});

describe('labelMode: axis', () => {
  function labeled(options: Parameters<HeatmapGrid['render']>[0]): string {
    const grid = new HeatmapGrid(3, 2);
    grid.fill(1);
    grid.colLabels = ['A', 'B', 'C'];
    grid.rowLabels = ['X', 'Y'];
    return grid.render(options);
  }

  it('rotates column labels against and row labels along the projection angle', () => {
    const svg = labeled({ labelMode: 'axis', projectionAngle: 30 });
    expect(svg).toContain('rotate(-30)');
    expect(svg).toContain('rotate(30)');
  });

  it('ignores manual label angles', () => {
    expect(labeled({ labelMode: 'axis', projectionAngle: 30, rowLabelAngle: -90 })).not.toContain('rotate(-90');
  });

  it('draws row label backgrounds in the rotated frame', () => {
    const svg = labeled({ labelMode: 'axis', rowLabelStyle: { backgroundColor: '#123456' } });
    expect(svg).toMatch(/rotate\(30\)"><rect [^>]*fill="#123456"/);
  });

  it('reserves room for long labels inside the viewBox', () => {
    const grid = new HeatmapGrid(3, 2);
    grid.fill(1);
    grid.rowLabels = ['A rather long series name', 'Another long series name'];
    const svg = grid.render({ labelMode: 'axis', padding: 0 });
    const [minX, , width] = svg.match(/viewBox="([^"]+)"/)![1].split(' ').map(Number);
    const transforms = [...svg.matchAll(/translate\((-?[\d.]+) (-?[\d.]+)\) rotate\(30\)/g)];
    expect(transforms.length).toBe(2);
    for (const [, x, y] of transforms) {
      const corners = axisLabelCorners({
        x: Number(x),
        y: Number(y),
        angleDeg: 30,
        textAnchor: 'start',
        width: 25 * 9 * 0.55,
        height: 9,
      });
      for (const corner of corners) {
        expect(corner.x).toBeLessThanOrEqual(minX + width + 0.01);
      }
    }
  });
});

describe('gridCells', () => {
  function sparse(gridCells: 'all' | 'data'): string {
    return renderHeatmap(
      [
        { col: 0, row: 0, value: 1 },
        { col: 1, row: 1, value: null },
      ],
      { cols: 2, rows: 2, gridCells }
    );
  }

  it('draws the floor everywhere by default', () => {
    expect(sparse('all').match(/iso-grid-cell/g)!.length).toBe(4);
  });

  it('draws the floor only under data with data', () => {
    expect(sparse('data').match(/iso-grid-cell/g)!.length).toBe(1);
  });
});

describe('faceText', () => {
  it('sits inside the group of its bar', () => {
    const svg = renderHeatmap([{ col: 0, row: 0, value: 3, faceText: '<7>' }], { cols: 1, rows: 1 });
    expect(svg).toMatch(/<g class="iso-bar"[\s\S]*iso-face-text[^>]*>&lt;7&gt;<\/text>\s*<\/g>/);
  });

  it('is skipped for shapes without a top face', () => {
    const svg = renderHeatmap(
      [{ col: 0, row: 0, value: 3, faceText: '7' }],
      { cols: 1, rows: 1, shape: 'ribbon' }
    );
    expect(svg).not.toContain('iso-face-text');
  });
});

describe('contrastingTextColor', () => {
  it('uses dark text on light and white text on dark backgrounds', () => {
    expect(contrastingTextColor('#ffffff')).toBe('#1e293b');
    expect(contrastingTextColor('#fff')).toBe('#1e293b');
    expect(contrastingTextColor('#111827')).toBe('#ffffff');
  });

  it('falls back to white for anything that is not hex', () => {
    expect(contrastingTextColor('rgba(0, 0, 0, 0.5)')).toBe('#ffffff');
  });
});
