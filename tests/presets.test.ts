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
});
