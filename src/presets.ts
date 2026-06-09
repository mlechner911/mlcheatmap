import { HeatmapGrid } from './grid';

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
   * Aggregates events for a specific month.
   * Columns = Days of week (0 to 6)
   * Rows = Weeks of the month (4 to 6 rows)
   */
  aggregateMonth(
    events: DateEvent[],
    options: PresetMonthOptions
  ): HeatmapGrid {
    const { year, month } = options;
    const startOfWeek = options.startOfWeek ?? 1;

    // Date range of the target month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();

    // Calculate start offset: day of the week for June 1st
    const startCol = (firstDay.getDay() - startOfWeek + 7) % 7;

    // Calculate number of rows (weeks) needed
    const totalCells = startCol + numDays;
    const rows = Math.ceil(totalCells / 7);
    const cols = 7;

    // Create date map for aggregating
    const dateValuesMap = new Map<number, number>();
    for (const ev of events) {
      const d = toDate(ev.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        dateValuesMap.set(d.getDate(), (dateValuesMap.get(d.getDate()) ?? 0) + ev.value);
      }
    }

    // Map day names for column labels
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const colLabels: string[] = [];
    for (let c = 0; c < cols; c++) {
      const dayIndex = (c + startOfWeek) % 7;
      colLabels.push(dayNames[dayIndex]);
    }

    const rowLabels = Array.from({ length: rows }, (_, i) => `W${i + 1}`);

    const gridModel = new HeatmapGrid(cols, rows);
    gridModel.colLabels = colLabels;
    gridModel.rowLabels = rowLabels;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Calculate day of the month for this grid cell
        const cellIndex = r * 7 + c;
        const dayNum = cellIndex - startCol + 1;

        if (dayNum >= 1 && dayNum <= numDays) {
          const value = dateValuesMap.get(dayNum) ?? 0;
          const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
          gridModel.setCell(c, r, value, `${dateStr} — ${value} points`);
        }
      }
    }

    return gridModel;
  },

  /**
   * Aggregates events for a full year (either a specific calendar year or rolling 365 days).
   * Columns = Weeks of the year (usually 53)
   * Rows = Days of the week (7)
   */
  aggregateYear(
    events: DateEvent[],
    options: PresetYearOptions = {}
  ): HeatmapGrid {
    const startOfWeek = options.startOfWeek ?? 1;

    let D_start: Date;
    let D_end: Date;

    if (options.year !== undefined) {
      // Calendar year
      D_start = new Date(options.year, 0, 1);
      D_end = new Date(options.year, 11, 31);
    } else {
      // Rolling 365 days
      const end = options.endDate ? toDate(options.endDate) : new Date();
      D_end = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      D_start = new Date(D_end);
      D_start.setDate(D_start.getDate() - 364); // 365 days total
    }

    const diffTime = D_end.getTime() - D_start.getTime();
    const diffDays = Math.ceil(diffTime / 86400000) + 1; // standard count

    // Starting row (day of week of D_start)
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
