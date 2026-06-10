/**
 * MLC Isometric Heatmap Library - Preset Aggregators
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { HeatmapGrid } from './data/grid';

export interface DateEvent {
  date: Date | string;
  value: number;
}

export interface HourEvent {
  timestamp: Date | string;
  value: number;
}

/**
 * Parses any date input to a Date object.
 */
function toDate(d: Date | string): Date {
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * 24h Daily/Weekly Preset Options
 */
export interface Preset24hOptions {
  startOfWeek?: number; // 0 = Sunday, 1 = Monday (default: 1)
  rowStyle?: 'days' | 'none'; // Include row labels for days
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
  date: Date | string;
  value: number;
  measurement?: 'AM' | 'PM' | 0 | 1;
}

export interface Preset6MonthDoubleOptions {
  year: number;
  startMonth: number; // 0-indexed (0 = Jan, 11 = Dec)
  startOfWeek?: number; // 0 = Sunday, 1 = Monday (default: 1)
}

export const presets = {
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

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const rowLabels: string[] = [];
    
    // Row labels in correct order
    for (let r = 0; r < rows; r++) {
      const dayIndex = (r + startOfWeek) % 7;
      rowLabels.push(dayNames[dayIndex]);
    }

    // Column labels: hours 0-23
    const colLabels = Array.from({ length: 24 }, (_, i) => {
      const suffix = i >= 12 ? 'PM' : 'AM';
      const hr = i % 12 === 0 ? 12 : i % 12;
      return i % 3 === 0 ? `${hr}${suffix}` : ''; // label every 3 hours
    });

    const gridModel = new HeatmapGrid(cols, rows);
    gridModel.colLabels = colLabels;
    gridModel.rowLabels = rowLabels;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const value = grid[c][r];
        const hourLabel = c.toString().padStart(2, '0') + ':00';
        gridModel.setCell(c, r, value, `${rowLabels[r]}, ${hourLabel} — ${value} events`);
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
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const rowLabels: string[] = [];
    for (let r = 0; r < rows; r++) {
      const dayIndex = (r + startOfWeek) % 7;
      rowLabels.push(dayNames[dayIndex]);
    }
    gridModel.rowLabels = rowLabels;

    // Populate monthly grid
    for (let d = 1; d <= totalDays; d++) {
      const cellIndex = firstDayIndex + d - 1;
      const c = Math.floor(cellIndex / 7);
      const r = cellIndex % 7;
      const value = valuesMap.get(d) ?? 0;
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      gridModel.setCell(c, r, value, `${dateStr} — ${value} units`);
    }

    // Column Labels: Week indicator tags (e.g. "W1", "W2")
    gridModel.colLabels = Array.from({ length: cols }, (_, i) => `W${i + 1}`);

    return gridModel;
  },

  /**
   * Aggregates events into a contribution grid spanning a whole year.
   * Columns = Weeks of the year (usually 53)
   * Rows = 7 Days of the Week
   */
  aggregateYear(
    events: DateEvent[],
    options: PresetYearOptions = {}
  ): HeatmapGrid {
    const startOfWeek = options.startOfWeek ?? 1;
    let D_end: Date;
    let D_start: Date;

    if (options.year) {
      D_start = new Date(options.year, 0, 1);
      D_end = new Date(options.year, 11, 31);
    } else {
      D_end = options.endDate ? toDate(options.endDate) : new Date();
      D_start = new Date(D_end);
      D_start.setDate(D_start.getDate() - 364); // Rolling 365 days
    }

    // Difference in days
    const diffTime = Math.abs(D_end.getTime() - D_start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Align start of week offset
    const rowStart = (D_start.getDay() - startOfWeek + 7) % 7;
    
    // Calculate total columns needed
    const totalCells = rowStart + diffDays;
    const cols = Math.ceil(totalCells / 7);
    const rows = 7;

    // Create value lookup map by YYYY-MM-DD
    const valuesMap = new Map<string, number>();
    for (const ev of events) {
      const d = toDate(ev.date);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      valuesMap.set(key, (valuesMap.get(key) ?? 0) + ev.value);
    }

    const colLabels = Array(cols).fill('');
    let lastMonth = -1;

    const gridModel = new HeatmapGrid(cols, rows);

    // Iterate through all days in range to populate grid and month labels
    const current = new Date(D_start);
    for (let i = 0; i < diffDays; i++) {
      const key = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')}`;
      const value = valuesMap.get(key) ?? 0;

      // Coordinate matching
      const cellIndex = rowStart + i;
      const c = Math.floor(cellIndex / 7);
      const r = cellIndex % 7;

      // Set month label at first occurrence in columns
      const m = current.getMonth();
      if (m !== lastMonth) {
        if (c < cols && colLabels[c] === '') {
          colLabels[c] = current.toLocaleString('default', { month: 'short' });
          lastMonth = m;
        }
      }

      gridModel.setCell(c, r, value, `${key} — ${value} contributions`);

      current.setDate(current.getDate() + 1);
    }

    // Days of week row labels
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const rowLabels: string[] = [];
    for (let r = 0; r < rows; r++) {
      const dayIndex = (r + startOfWeek) % 7;
      rowLabels.push(dayNames[dayIndex]);
    }

    gridModel.colLabels = colLabels;
    gridModel.rowLabels = rowLabels;

    return gridModel;
  },

  /**
   * Aggregates events into a 6-month dual timeline (AM/PM or two metrics per day).
   * Columns = Weeks of the 6-month period (usually 26-27)
   * Rows = 14 (7 days of the week * 2 measurements per day)
   * Padding days outside the 6-month range are set to null.
   */
  aggregateSixMonthsDouble(
    events: DualMeasurementEvent[],
    options: Preset6MonthDoubleOptions
  ): HeatmapGrid {
    const startOfWeek = options.startOfWeek ?? 1;
    const year = options.year;
    const startMonth = options.startMonth;

    // Define bounds
    const D_start = new Date(year, startMonth, 1);
    const D_end = new Date(year, startMonth + 6, 0); // Last day of the 6th month

    // Row offset for the first week
    const firstDayIndex = (D_start.getDay() - startOfWeek + 7) % 7;

    // Count total days in the 6-month period
    let totalDays = 0;
    const tempDate = new Date(D_start);
    while (tempDate <= D_end) {
      totalDays++;
      tempDate.setDate(tempDate.getDate() + 1);
    }

    const cols = Math.ceil((firstDayIndex + totalDays) / 7);
    const rows = 14;

    const gridModel = new HeatmapGrid(cols, rows);

    // Initialize all grid cells to null with "Out of Range" label
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        gridModel.setCell(c, r, null, 'Out of Range');
      }
    }

    // Aggregate events
    // Map key format: YYYY-MM-DD_M (where M is 0 for AM/first, 1 for PM/second)
    const valuesMap = new Map<string, number>();
    for (const ev of events) {
      const d = toDate(ev.date);
      if (isNaN(d.getTime())) continue;

      // Filter events within our 6-month range
      if (d < D_start || d > D_end) continue;

      let mIndex = 0;
      if (ev.measurement !== undefined) {
        mIndex = (ev.measurement === 'PM' || ev.measurement === 1) ? 1 : 0;
      } else {
        mIndex = d.getHours() >= 12 ? 1 : 0;
      }

      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}_${mIndex}`;
      valuesMap.set(dateKey, (valuesMap.get(dateKey) ?? 0) + ev.value);
    }

    // Populate active days
    const colLabels = Array(cols).fill('');
    let lastMonth = -1;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const current = new Date(D_start);
    for (let d = 0; d < totalDays; d++) {
      const cellIndex = firstDayIndex + d;
      const c = Math.floor(cellIndex / 7);
      const r_day = cellIndex % 7;

      const dateStr = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')}`;
      
      // Label the column with the month name when it first transitions
      const m = current.getMonth();
      if (m !== lastMonth) {
        if (c < cols && colLabels[c] === '') {
          colLabels[c] = current.toLocaleString('default', { month: 'short' });
          lastMonth = m;
        }
      }

      // Populate AM and PM values
      for (let mIndex = 0; mIndex < 2; mIndex++) {
        const key = `${dateStr}_${mIndex}`;
        const value = valuesMap.get(key) ?? 0;
        const r = r_day * 2 + mIndex;
        const mLabel = mIndex === 0 ? 'AM' : 'PM';
        gridModel.setCell(c, r, value, `${dateStr} (AM) — ${value} units`);
      }

      current.setDate(current.getDate() + 1);
    }

    // Generate Row Labels
    const rowLabels: string[] = [];
    for (let r = 0; r < 7; r++) {
      const dayIndex = (r + startOfWeek) % 7;
      rowLabels.push(`${dayNames[dayIndex]} AM`);
      rowLabels.push(`${dayNames[dayIndex]} PM`);
    }

    gridModel.colLabels = colLabels;
    gridModel.rowLabels = rowLabels;

    return gridModel;
  },

  /**
   * Generates a preset 8x8 grid with a mixture of positive, negative, zero,
   * and explicit null (missing/no-data) values.
   */
  nullsExample8x8(): HeatmapGrid {
    const cols = 8;
    const rows = 8;
    const gridModel = new HeatmapGrid(cols, rows);

    gridModel.colLabels = ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'];
    gridModel.rowLabels = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        let value: number | null = 0;
        
        // Define coordinates that should be null
        const isNull = (
          (c === 2 && r >= 2 && r <= 4) ||
          (c === 4 && (r === 4 || r === 5)) ||
          (c === 5 && r === 5) ||
          (c === 0 && r === 7) ||
          (c === 7 && r === 0)
        );
        
        if (isNull) {
          value = null;
        } else {
          // Checkerboard mixture of zero, positive and negative values
          const valPattern = (c + r) % 3;
          if (valPattern === 0) {
            value = 0;
          } else if (valPattern === 1) {
            value = Math.round(5 + Math.sin(c * 0.8) * 10);
          } else {
            value = Math.round(-5 - Math.cos(r * 0.8) * 10);
          }
        }
        
        const label = value === null 
          ? `Col ${c}, Row ${r}: [No Data]`
          : `Col ${c}, Row ${r}: ${value}`;
          
        gridModel.setCell(c, r, value, label);
      }
    }
    
    return gridModel;
  }
};
