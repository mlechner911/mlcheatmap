/**
 * The style rules of a chart: scoped to it, and repeated as little as possible per cell.
 */
import { describe, expect, it } from 'vitest';
import { HeatmapGrid, type HeatmapOptions } from '../src/index';

type RenderOptions = Partial<HeatmapOptions>;

function render(options: RenderOptions = {}): string {
  const grid = new HeatmapGrid(3, 2);
  grid.setCell(0, 0, 10);
  grid.setCell(1, 1, -5);
  grid.setCell(2, 1, 0);
  return grid.render(options);
}

/** A mesh draws only between four known corners. */
function renderFull(options: RenderOptions): string {
  const grid = new HeatmapGrid(2, 2);
  for (let c = 0; c < 2; c++) {
    for (let r = 0; r < 2; r++) grid.setCell(c, r, 1 + c + r);
  }
  return grid.render(options);
}

const views: RenderOptions[] = [{}, { view: 'flat' }];

describe.each(views)('style rules of %o', (view) => {
  it('leaves inline styles out of the cells', () => {
    expect(render(view)).not.toMatch(/ style="/);
  });

  it('scopes every chart rule to the classes on its root', () => {
    const svg = render(view);
    const name = view.view === 'flat' ? 'iso-view-flat' : 'iso-view-3d';
    expect(svg).toContain(`class="${name} iso-animated"`);
    expect(svg).not.toMatch(/^\s*\.iso-bar[ :{]/m);
  });

  it('animates only without a held end state, which would block hover', () => {
    const svg = render(view);
    expect(svg).toContain('animation-fill-mode:backwards');
    expect(svg).not.toMatch(/\bboth\b/);
  });

  it('never sets the delay in the animation rule, so the stagger rules of any chart hold', () => {
    expect(render(view)).not.toMatch(/animation:/);
  });

  it('writes one delay rule per diagonal and names it on the cell', () => {
    const svg = render(view);
    expect(svg.match(/\.iso-d\d+\{/g)).toHaveLength(3); // Diagonals 1 to 3 of a 3x2 grid.
    expect(svg).toContain('.iso-d2{animation-delay:30ms}');
    expect(svg).toMatch(/class="iso-bar[^"]*iso-d2[^"]*" data-col="1" data-row="1"/);
  });

  it('honors reduced motion', () => {
    expect(render(view)).toMatch(/@media \(prefers-reduced-motion:no-preference\)\{[\s\S]*animation-name/);
  });

  it('has no animation at all with animated false', () => {
    const svg = render({ ...view, animated: false });
    expect(svg).not.toContain('iso-animated');
    expect(svg).not.toContain('animation');
    expect(svg).not.toContain('iso-d');
    expect(svg).not.toContain('iso-neg');
  });

  it('has no rules and no switch for them with interactive false', () => {
    const svg = render({ ...view, interactive: false });
    expect(svg).not.toContain('<style>');
    expect(svg).not.toContain('iso-view');
    expect(svg).not.toContain('iso-d');
  });

  it('keeps the hooks for your own code', () => {
    expect(render(view)).toMatch(/<g class="iso-bar[^"]*" data-col="0" data-row="0" data-value="10"/);
  });

  it('adds the switch to a composite group', () => {
    expect(render({ ...view, wrapper: 'g' })).toMatch(/^<g class="iso-heatmap-group iso-view-\w+ iso-animated"/);
  });
});

describe('3D cells', () => {
  it('marks sinking values, which grow from the top', () => {
    expect(render()).toMatch(/class="iso-bar[^"]*iso-neg" data-col="1" data-row="1"/);
    expect(render()).toContain('.iso-bar.iso-neg{transform-origin:top}');
  });

  it('lifts bars on hover, but not the parts of a surface', () => {
    expect(render()).toContain('.iso-bar:not(.iso-surface):hover{transform:translateY(-3px)}');
    for (const shape of ['mesh', 'ribbon', 'flatribbon'] as const) {
      expect(renderFull({ shape })).toMatch(/class="iso-bar iso-surface/);
    }
    for (const shape of ['prism', 'cylinder'] as const) {
      expect(render({ shape })).not.toMatch(/class="iso-bar iso-surface/);
    }
  });

  it('sets the shared stroke width once, at the root', () => {
    const svg = render();
    expect(svg).toMatch(/<g class="iso-view-3d iso-animated" stroke-width="0.3">/);
    expect(svg.match(/stroke-width="0.3"/g)).toHaveLength(1);
  });

  it('rounds prism corners per bar and leaves the floor pointed', () => {
    const svg = render();
    expect(svg).toMatch(/<g class="iso-bar[^"]*" data-col="0" data-row="0" data-value="10" stroke-linejoin="round">/);
    expect(svg).not.toMatch(/<polygon[^>]*stroke-linejoin/);
    expect(render({ shape: 'cylinder' })).not.toContain('stroke-linejoin');
  });

  it('keeps the line width of the floor and of mesh surfaces', () => {
    expect(render()).toMatch(/iso-grid-cell"[^>]*stroke-width="0.5"/);
    expect(renderFull({ shape: 'mesh', useSvg2Mesh: true })).toMatch(/meshGradient[\s\S]*stroke-width="1"/);
    expect(renderFull({ shape: 'mesh', triangulateMesh: false })).toMatch(/stroke-width="0.5"/);
  });

  it('has no line breaks inside a bar', () => {
    expect(render()).not.toMatch(/<g class="iso-bar[^>]*>\n/);
  });
});

describe('opacity', () => {
  it('leaves the SVG default out', () => {
    for (const view of views) {
      expect(render(view)).not.toMatch(/opacity="1"/);
    }
    for (const shape of ['cylinder', 'ribbon'] as const) {
      expect(render({ shape })).not.toMatch(/(fill|stroke)-opacity="1"/);
    }
  });

  it('writes anything below it', () => {
    expect(render({ opacity: 0.5 })).toContain('fill-opacity="0.5" stroke-opacity="0.5"');
    expect(render({ view: 'flat', opacity: 0.5 })).toContain('opacity="0.5"');
  });
});
