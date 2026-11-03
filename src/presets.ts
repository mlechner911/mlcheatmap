/**
 * MLC Isometric Heatmap Library - Preset Aggregators
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { HeatmapGrid } from './data/grid';
import { aggregateCalendarMonth } from './calendar-month';
import { aggregateSixMonthsDouble } from './aggregate-six-months';
import { aggregateYear } from './aggregate-year';
import { type DateInput, dateKey, toDate, weekdayNames } from './date-utils';
import { nullsExample8x8 } from './nulls-example';

export type { PresetCalendarMonthOptions } from './calendar-month';

/**
 * Single calendar-day measurement for {@link presets.aggregateMonth},
 * {@link presets.aggregateYear} and {@link presets.aggregateSixMonthsDouble}.
 * Events on the same day accumulate (values are summed).
 */
export interface DateEvent {
  date: DateInput;
  value: number;
}

/**
 * Single timestamped measurement for {@link presets.aggregate24h}.
 * Events in the same hour of the same weekday accumulate.
 */
export interface HourEvent {
  timestamp: DateInput;
  value: number;
}

/**
 * 24h Daily/Weekly Preset Options
 */
export interface Preset24hOptions {
  startOfWeek?: number; // 0 = Sunday, 1 = Monday (default: 1)
  rowStyle?: 'days' | 'none'; // Weekday row labels or none (default: 'days')
}

/**
 * Month Preset Options
 */
export interface PresetMonthOptions {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  startOfWeek?: number; // 0 = Sunday, 1 = Monday (default: 1)
}

/**
 * Year Preset Options
 */
export interface PresetYearOptions {
  year?: number; // Specific calendar year (default: rolling last 365 days)
  endDate?: Date | string; // End date for rolling year (default: today)
  startOfWeek?: number; // 0 = Sunday, 1 = Monday (default: 1)
}

/**
 * 6-Month Dual Measurement Preset Options
 */
export interface DualMeasurementEvent {
  date: DateInput;
  value: number;
  measurement?: 'AM' | 'PM' | 0 | 1;
}

/**
 * Options for {@link presets.aggregateSixMonthsDouble}: a fixed 6-month window
 * starting at `startMonth` of `year`, with two sub-rows (AM/PM) per weekday.
 */
export interface Preset6MonthDoubleOptions {
  year: number;
  startMonth: number; // 0-indexed (0 = Jan, 11 = Dec)
  startOfWeek?: number; // 0 = Sunday, 1 = Monday (default: 1)
}

/**
 * Calendar aggregation helpers (optional `mlc-isometric-heatmap/presets`
 * entrypoint). Each aggregator folds raw event lists into a ready-to-render
 * {@link HeatmapGrid} with labels and tooltips attached:
 * - `aggregate24h`: 24 hour-columns x 7 weekdays.
 * - `aggregateMonth`: week-columns x 7 weekdays for one month.
 * - `aggregateCalendarMonth`: 7 weekday-columns x week-rows, laid out like a wall calendar.
 * - `aggregateYear`: 53 week-columns x 7 weekdays, GitHub-style.
 * - `aggregateSixMonthsDouble`: 6 months with AM/PM sub-rows (14 rows).
 */
export const presets = {
  aggregateCalendarMonth,
  aggregateYear,
  aggregateSixMonthsDouble,
  nullsExample8x8,

  /**
   * Aggregates events over a 24-hour daily grid or 24h x 7-day weekly grid.
   * Columns = 24 Hours (00:00 to 23:00)
   * Rows = 7 Days of the Week
   */
  aggregate24h(
    events: HourEvent[],
    options: Preset24hOptions = {}
  ): HeatmapGrid {
    const startOfWeek = options.startOfWeek ?? 1; // Default Monday
    const cols = 24;
    const rows = 7;

    // Initialize grid
    const grid: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));

    for (const ev of events) {
      const date = toDate(ev.timestamp);
      if (isNaN(date.getTime())) continue;

      const hour = date.getHours();
      // Calculate row based on startOfWeek
      const day = (date.getDay() - startOfWeek + 7) % 7;
      
      grid[hour][day] += ev.value;
    }

    const rowLabels = weekdayNames(startOfWeek);

    // Column labels: hours 0-23
    const colLabels = Array.from({ length: 24 }, (_, i) => {
      const suffix = i >= 12 ? 'PM' : 'AM';
      const hr = i % 12 === 0 ? 12 : i % 12;
      return i % 3 === 0 ? `${hr}${suffix}` : ''; // label every 3 hours
    });

    const gridModel = new HeatmapGrid(cols, rows);
    gridModel.colLabels = colLabels;
    if (options.rowStyle !== 'none') {
      gridModel.rowLabels = rowLabels;
    }

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const value = grid[c][r];
        const hourLabel = c.toString().padStart(2, '0') + ':00';
        gridModel.setCell(c, r, value, `${rowLabels[r]}, ${hourLabel}: ${value}`);
      }
    }

    return gridModel;
  },

  /**
   * Aggregates events into a monthly calendar layout.
   * Columns = Weeks of the month (variable, usually 4-6)
   * Rows = 7 Days of the Week
   */
  aggregateMonth(
    events: DateEvent[],
    options: PresetMonthOptions
  ): HeatmapGrid {
    const startOfWeek = options.startOfWeek ?? 1;
    const year = options.year;
    const month = options.month;

    // Determine calendar bounds
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Map offset for the first week column
    const firstDayIndex = (firstDay.getDay() - startOfWeek + 7) % 7;
    const cols = Math.ceil((firstDayIndex + totalDays) / 7);
    const rows = 7;

    // Create value lookup map
    const valuesMap = new Map<number, number>();
    for (const ev of events) {
      const d = toDate(ev.date);
      if (isNaN(d.getTime())) continue;
      if (d.getFullYear() === year && d.getMonth() === month) {
        valuesMap.set(d.getDate(), (valuesMap.get(d.getDate()) ?? 0) + ev.value);
      }
    }

    const gridModel = new HeatmapGrid(cols, rows);

    // Row Labels: Days of week starting from startOfWeek
    gridModel.rowLabels = weekdayNames(startOfWeek);

    // Populate monthly grid
    for (let d = 1; d <= totalDays; d++) {
      const cellIndex = firstDayIndex + d - 1;
      const c = Math.floor(cellIndex / 7);
      const r = cellIndex % 7;
      const value = valuesMap.get(d) ?? 0;
      const dateStr = dateKey(new Date(year, month, d));
      gridModel.setCell(c, r, value, `${dateStr}: ${value}`);
    }

    // Column Labels: Week indicator tags (e.g. "W1", "W2")
    gridModel.colLabels = Array.from({ length: cols }, (_, i) => `W${i + 1}`);

    return gridModel;
  },
};
