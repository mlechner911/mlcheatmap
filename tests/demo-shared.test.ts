/**
 * Shared demo helpers: reproducible mock data and composites.
 */
import { describe, expect, it } from 'vitest';
import { presets } from '../src/presets';
import { createRandom, renderMonthBlocks, renderMultiMonth, sixMonthsDailyEvents } from '../demo/shared.mjs';

describe('createRandom', () => {
  it('repeats its sequence for the same seed', () => {
    const a = createRandom(7);
    const b = createRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('differs between seeds and stays within [0, 1)', () => {
    const a = createRandom(1);
    const b = createRandom(2);
    expect(a()).not.toBe(b());
    for (let i = 0; i < 1000; i++) {
      const value = a();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('composites', () => {
  const quarter = (): string =>
    renderMonthBlocks({
      presets,
      year: 2026,
      months: [0, 1, 2],
      events: sixMonthsDailyEvents(createRandom()),
      options: { gridSize: 11, gap: 1 },
      title: 'Title',
    });

  it('renders the same SVG twice', () => {
    expect(quarter()).toBe(quarter());
  });

  it('nests one block per month and shows weekdays only once', () => {
    const svg = quarter();
    expect(svg.match(/iso-month-block/g)!.length).toBe(3);
    expect(svg.match(/iso-row-labels/g)!.length).toBe(1);
  });

  it('adapts label backgrounds and title to dark mode', () => {
    const svg = renderMultiMonth({ presets, options: { dark: true } });
    expect(svg).toContain('fill="#f0f6fc"');
    expect(svg).toContain('fill="#1f2937"');
  });
});
