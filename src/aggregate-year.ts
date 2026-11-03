/**
 * MLC Isometric Heatmap Library - Year preset
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { HeatmapGrid } from './data/grid';
import { dateKey, toDate, weekdayNames } from './date-utils';
import type { DateEvent, PresetYearOptions } from './presets';

/**
 * Aggregates events into a contribution grid spanning a whole year.
 * Columns = Weeks of the year (usually 53)
 * Rows = 7 Days of the Week
 */
export function aggregateYear(
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
    const key = dateKey(d);
    valuesMap.set(key, (valuesMap.get(key) ?? 0) + ev.value);
  }

  const colLabels = Array(cols).fill('');
  let lastMonth = -1;

  const gridModel = new HeatmapGrid(cols, rows);

  // Iterate through all days in range to populate grid and month labels
  const current = new Date(D_start);
  for (let i = 0; i < diffDays; i++) {
    const key = dateKey(current);
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

  gridModel.colLabels = colLabels;
  gridModel.rowLabels = weekdayNames(startOfWeek);

  return gridModel;
}
