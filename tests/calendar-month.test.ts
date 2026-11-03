/**
 * Calendar month preset and the date helpers behind the presets.
 */
import { describe, expect, it } from 'vitest';
import { presets } from '../src/presets';
import { dateKey, isoWeek, weekdayNames } from '../src/date-utils';

const OCTOBER_2026 = { year: 2026, month: 9 };

describe('aggregateCalendarMonth', () => {
  it('lays weekdays out as columns and weeks as rows', () => {
    const grid = presets.aggregateCalendarMonth([], OCTOBER_2026);
    expect(grid.cols).toBe(7);
    expect(grid.rows).toBe(5);
    expect(grid.colLabels).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('places days under their weekday', () => {
    const grid = presets.aggregateCalendarMonth([], OCTOBER_2026);
    // October 1st 2026 is a Thursday, October 31st a Saturday.
    expect(grid.getCell(3, 0).faceText).toBe('1');
    expect(grid.getCell(5, 4).faceText).toBe('31');
  });

  it('has no cells for days of neighbouring months', () => {
    const grid = presets.aggregateCalendarMonth([], OCTOBER_2026);
    expect(grid.getCell(0, 0).value).toBeNull();
    expect(grid.getCell(6, 4).value).toBeNull();
    expect(grid.getData().filter((p) => p.value !== null).length).toBe(31);
  });

  it('draws floor lines for the days of the month only', () => {
    const svg = presets.aggregateCalendarMonth([], OCTOBER_2026).render({});
    expect(svg.match(/iso-grid-cell/g)!.length).toBe(31);
  });

  it('labels rows with ISO weeks', () => {
    const grid = presets.aggregateCalendarMonth([], OCTOBER_2026);
    expect(grid.rowLabels).toEqual(['W40', 'W41', 'W42', 'W43', 'W44']);
  });

  it('sums events of a day and ignores other months', () => {
    const grid = presets.aggregateCalendarMonth(
      [
        { date: new Date(2026, 9, 1, 8), value: 2 },
        { date: new Date(2026, 9, 1, 20), value: 3 },
        { date: new Date(2026, 10, 1, 8), value: 99 },
      ],
      OCTOBER_2026
    );
    expect(grid.getCell(3, 0).value).toBe(5);
    expect(grid.getData().map((p) => p.value)).not.toContain(99);
  });

  it('follows startOfWeek', () => {
    const grid = presets.aggregateCalendarMonth([], { ...OCTOBER_2026, startOfWeek: 0 });
    expect(grid.colLabels![0]).toBe('Sun');
    expect(grid.getCell(4, 0).faceText).toBe('1');
  });

  it('localizes title and weekdays', () => {
    const grid = presets.aggregateCalendarMonth([], { ...OCTOBER_2026, locale: 'de-DE', weekLabel: (w) => `KW ${w}` });
    expect(grid.title).toBe('Oktober 2026');
    expect(grid.colLabels![0]).toMatch(/^Mo/);
    expect(grid.rowLabels![0]).toBe('KW 40');
  });

  it('lets render options override its defaults', () => {
    const grid = presets.aggregateCalendarMonth([{ date: new Date(2026, 9, 1), value: 5 }], OCTOBER_2026);
    expect(grid.render({ gridCells: 'all' }).match(/iso-grid-cell/g)!.length).toBe(35);
  });
});

describe('aggregateSixMonthsDouble tooltips', () => {
  it('names the measurement of the cell', () => {
    const grid = presets.aggregateSixMonthsDouble(
      [{ date: new Date(2026, 0, 5, 15), value: 3, measurement: 'PM' }],
      { year: 2026, startMonth: 0 }
    );
    const cell = grid.getData().find((p) => p.value === 3)!;
    expect(grid.rowLabels![cell.row]).toBe('Mon PM');
    expect(cell.label).toContain('(PM)');
  });
});

describe('date helpers', () => {
  it('formats local dates', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('rotates weekday names', () => {
    expect(weekdayNames(0)[0]).toBe('Sun');
    expect(weekdayNames(1)[6]).toBe('Sun');
  });

  it('computes ISO weeks across year boundaries', () => {
    expect(isoWeek(new Date(2026, 9, 1))).toBe(40);
    expect(isoWeek(new Date(2026, 11, 28))).toBe(53);
    expect(isoWeek(new Date(2027, 0, 1))).toBe(53);
    expect(isoWeek(new Date(2027, 0, 4))).toBe(1);
  });
});
