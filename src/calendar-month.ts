/**
 * MLC Isometric Heatmap Library - Calendar month preset
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { HeatmapGrid } from './data/grid';
import type { RenderDefaults } from './data/types';
import { dateKey, isoWeek, toDate, weekdayNames } from './date-utils';
import type { DateEvent } from './presets';

/**
 * Options for `presets.aggregateCalendarMonth`.
 */
export interface PresetCalendarMonthOptions {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  startOfWeek?: number; // 0 = Sunday, 1 = Monday (default: 1)
  locale?: string; // BCP 47 locale for the title and weekday names (default: English)
  weekLabel?: (isoWeekNumber: number) => string; // Row label of a week (default: 'W42')
}

/**
 * The flat relief keeps day numbers and neighbouring cells visible; bars as tall
 * as a cell hide the row behind them.
 */
const CALENDAR_RENDER_DEFAULTS = {
  gridSize: 34,
  gap: 3,
  maxHeight: 14,
  gridCells: 'data',
  labelMode: 'axis',
  labelFontSize: 11,
} satisfies RenderDefaults;

function localizedWeekdayNames(startOfWeek: number, locale: string): string[] {
  const format = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  // 2026-01-04 was a Sunday, the anchor for weekday index 0.
  return Array.from({ length: 7 }, (_, index) =>
    format.format(new Date(Date.UTC(2026, 0, 4 + ((index + startOfWeek) % 7))))
  );
}

/**
 * Aggregates events into a month laid out like a wall calendar: weekdays as
 * columns, weeks as rows, one cell per day of the month. Days of neighbouring
 * months have no cell, so the outline follows the real month.
 */
export function aggregateCalendarMonth(
  events: readonly DateEvent[],
  options: PresetCalendarMonthOptions
): HeatmapGrid {
  const { year, month, locale } = options;
  const startOfWeek = options.startOfWeek ?? 1;
  const weekLabel = options.weekLabel ?? ((week: number): string => `W${week}`);

  const firstDayIndex = (new Date(year, month, 1).getDay() - startOfWeek + 7) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const rows = Math.ceil((firstDayIndex + totalDays) / 7);

  const values = new Map<number, number>();
  for (const ev of events) {
    const d = toDate(ev.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      values.set(d.getDate(), (values.get(d.getDate()) ?? 0) + ev.value);
    }
  }

  const grid = new HeatmapGrid(7, rows);
  const rowLabels: string[] = Array.from({ length: rows }, () => '');
  for (let day = 1; day <= totalDays; day++) {
    const cellIndex = firstDayIndex + day - 1;
    const col = cellIndex % 7;
    const row = Math.floor(cellIndex / 7);
    const date = new Date(year, month, day);
    const value = values.get(day) ?? 0;
    grid.setCell(col, row, value, `${dateKey(date)}: ${value}`, undefined, String(day));
    if (!rowLabels[row]) rowLabels[row] = weekLabel(isoWeek(date));
  }

  grid.colLabels = locale ? localizedWeekdayNames(startOfWeek, locale) : weekdayNames(startOfWeek);
  grid.rowLabels = rowLabels;
  grid.title = new Date(year, month, 1).toLocaleString(locale ?? 'en', { month: 'long', year: 'numeric' });
  grid.renderDefaults = CALENDAR_RENDER_DEFAULTS;
  return grid;
}
