/**
 * MLC Isometric Heatmap Library - Null values example
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

import { HeatmapGrid } from './data/grid';

/**
 * Generates a preset 8x8 grid with a mixture of positive, negative, zero,
 * and explicit null (missing/no-data) values.
 */
export function nullsExample8x8(): HeatmapGrid {
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
