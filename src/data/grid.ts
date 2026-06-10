/**
 * MLC Isometric Heatmap Library
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { HeatmapDataPoint, HeatmapOptions } from './types';
import { renderHeatmap } from '../render/renderer';

/**
 * Grid Model representing the heatmap coordinate space and aggregated metrics.
 */
export class HeatmapGrid {
  public readonly cols: number;
  public readonly rows: number;
  public colLabels?: string[];
  public rowLabels?: string[];
  public title?: string;
  private cells: Map<string, HeatmapDataPoint> = new Map();

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
  }

  /**
   * Sets/overrides the value and options of a specific coordinate cell.
   */
  setCell(col: number, row: number, value: number | null, label?: string, color?: string): this {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      throw new Error(`Cell index out of bounds: col ${col}, row ${row} on a ${this.cols}x${this.rows} grid`);
    }
    this.cells.set(`${col},${row}`, { col, row, value, label, color });
    return this;
  }

  /**
   * Gets the data point at a specific coordinate cell.
   */
  getCell(col: number, row: number): HeatmapDataPoint {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      throw new Error(`Cell index out of bounds: col ${col}, row ${row} on a ${this.cols}x${this.rows} grid`);
    }
    return this.cells.get(`${col},${row}`) ?? { col, row, value: null };
  }

  /**
   * Fills the entire grid using a static value or a dynamic generator function.
   */
  fill(value: number | null | ((col: number, row: number) => number | null)): this {
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const val = typeof value === 'function' ? value(c, r) : value;
        this.setCell(c, r, val);
      }
    }
    return this;
  }

  /**
   * Returns a flat array of all grid data points.
   */
  getData(): HeatmapDataPoint[] {
    const dataList: HeatmapDataPoint[] = [];
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        dataList.push(this.getCell(c, r));
      }
    }
    return dataList;
  }

  /**
   * Getter returning a flat array of all grid data points (for backwards compatibility).
   */
  get data(): HeatmapDataPoint[] {
    return this.getData();
  }

  /**
   * Renders the grid model as an isometric SVG string using specified options.
   */
  render(options?: Omit<HeatmapOptions, 'cols' | 'rows'>): string {
    return renderHeatmap(this, {
      ...(options || {}),
      cols: this.cols,
      rows: this.rows
    });
  }
}
