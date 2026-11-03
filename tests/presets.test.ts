/**
 * Calendar presets: grid geometry and aggregation behavior.
 */
import { describe, expect, it } from 'vitest';
import { presets } from '../src/presets';

describe('aggregateMonth', () => {
  it('builds a June 2026 calendar (5 week-columns x 7 weekdays)', () => {
    // June 1st 2026 is a Monday; with startOfWeek Monday the month starts
    // exactly at the first column.
    const grid = presets.aggregateMonth(
      [{ date: '2026-06-15', value: 5 }],
      { year: 2026, month: 5, startOfWeek: 1 }
    );
    expect(grid.cols).toBe(5);
    expect(grid.rows).toBe(7);
    expect(grid.rowLabels).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('sums events landing on the same day', () => {
    const grid = presets.aggregateMonth(
      [
        { date: '2026-06-15', value: 5 },
        { date: new Date(2026, 5, 15), value: 7 },
      ],
      { year: 2026, month: 5 }
    );
    const values = grid.getData().map((d) => d.value);
    expect(values).toContain(12);
  });

  it('ignores events outside the month', () => {
    const grid = presets.aggregateMonth(
      [{ date: '2026-07-01', value: 99 }],
      { year: 2026, month: 5 }
    );
    const values = grid.getData().map((d) => d.value);
    expect(values).not.toContain(99);
  });
});

describe('aggregateYear', () => {
  it('builds a 53 week-column GitHub-style grid for 2026', () => {
    const grid = presets.aggregateYear([], { year: 2026, startOfWeek: 1 });
    expect(grid.cols).toBe(53);
    expect(grid.rows).toBe(7);
  });

  it('accumulates same-day events', () => {
    const grid = presets.aggregateYear(
      [
        { date: '2026-03-04', value: 3 },
        { date: '2026-03-04', value: 4 },
      ],
      { year: 2026 }
    );
    expect(grid.getData().map((d) => d.value)).toContain(7);
  });
});

describe('aggregate24h', () => {
  it('builds a 24x7 grid with weekday row labels', () => {
    const grid = presets.aggregate24h(
      [{ timestamp: new Date(2026, 5, 9, 8, 30), value: 5 }],
      { startOfWeek: 1 }
    );
    expect(grid.cols).toBe(24);
    expect(grid.rows).toBe(7);
    expect(grid.rowLabels![0]).toBe('Mon');
  });

  it('leaves out row labels with rowStyle: none', () => {
    expect(presets.aggregate24h([], { rowStyle: 'none' }).rowLabels).toBeUndefined();
  });
});

describe('tooltip labels', () => {
  const days = [{ date: '2026-03-02', value: 7 }];

  it('name no unit, because the presets do not know what the values mean', () => {
    const grids = [
      presets.aggregate24h([{ timestamp: '2026-03-02T12:00:00', value: 7 }]),
      presets.aggregateMonth(days, { year: 2026, month: 2 }),
      presets.aggregateYear(days, { year: 2026 }),
      presets.aggregateSixMonthsDouble(days, { year: 2026, startMonth: 2 }),
    ];
    for (const grid of grids) {
      const labels = grid.getData().map((point) => point.label ?? '');
      expect(labels.some((label) => label.endsWith(': 7'))).toBe(true);
      for (const label of labels) {
        expect(label).not.toMatch(/events|units|contributions/);
      }
    }
  });
});

describe('tooltipFormatter', () => {
  const grid = presets.aggregateMonth([{ date: '2026-03-02', value: 7 }], { year: 2026, month: 2 });

  it('replaces the tooltip of a preset', () => {
    const svg = grid.render({ tooltipFormatter: (point) => `${point.value} kWh` });
    expect(svg).toContain('<title>7 kWh</title>');
    expect(svg).not.toContain('<title>2026-03-02: 7</title>');
  });

  it('leaves the label in place without a formatter', () => {
    expect(grid.render()).toContain('<title>2026-03-02: 7</title>');
  });
});
