/**
 * MLC Isometric Heatmap Library - Six-month dual measurement preset
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { HeatmapGrid } from './data/grid';
import { dateKey, toDate, weekdayName } from './date-utils';
import type { DualMeasurementEvent, Preset6MonthDoubleOptions } from './presets';

/**
 * Aggregates events into a 6-month dual timeline (AM/PM or two metrics per day).
 * Columns = Weeks of the 6-month period (usually 26-27)
 * Rows = 14 (7 days of the week * 2 measurements per day)
 * Padding days outside the 6-month range are set to null.
 */
export function aggregateSixMonthsDouble(
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

    const measurementKey = `${dateKey(d)}_${mIndex}`;
    valuesMap.set(measurementKey, (valuesMap.get(measurementKey) ?? 0) + ev.value);
  }

  // Populate active days
  const colLabels = Array(cols).fill('');
  let lastMonth = -1;

  const current = new Date(D_start);
  for (let d = 0; d < totalDays; d++) {
    const cellIndex = firstDayIndex + d;
    const c = Math.floor(cellIndex / 7);
    const r_day = cellIndex % 7;

    const dateStr = dateKey(current);

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
      gridModel.setCell(c, r, value, `${dateStr} (${mLabel}): ${value}`);
    }

    current.setDate(current.getDate() + 1);
  }

  // Generate Row Labels
  const rowLabels: string[] = [];
  for (let r = 0; r < 7; r++) {
    rowLabels.push(`${weekdayName(r, startOfWeek)} AM`);
    rowLabels.push(`${weekdayName(r, startOfWeek)} PM`);
  }

  gridModel.colLabels = colLabels;
  gridModel.rowLabels = rowLabels;

  return gridModel;
}
