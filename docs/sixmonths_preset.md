# 6-Month Dual Timeline Preset Overview

This preset represents a complex, dual-measurement timeline spanning exactly six calendar months. It displays two daily measurements (e.g., morning and afternoon, or two distinct metrics) side-by-side.

## Grid Layout Architecture

### Columns: Weeks (26–27 columns)
The columns map to calendar weeks. Columns are dynamically labeled with the short name of the month (e.g., `Jan`, `Feb`) at the week where that month first starts.

### Rows: Days of Week × 2 (14 rows)
The rows map to the days of the week, with two sub-rows per day:
*   Row 0: `Mon AM` / Metric 1
*   Row 1: `Mon PM` / Metric 2
*   Row 2: `Tue AM` / Metric 1
*   Row 3: `Tue PM` / Metric 2
*   ...
*   Row 12: `Sun AM` / Metric 1
*   Row 13: `Sun PM` / Metric 2

> [!TIP]
> Setting `rowLabelInterval: 2` (enabled by default for this layout) filters out the `PM` labels, displaying only `Mon AM`, `Tue AM`, etc. This aligns labels with the start of each day block, avoiding vertical text crowding.

---

## Padding & Explicit Null Values

In a typical monthly or multi-month calendar grid, the first and last weeks contain days that belong to the preceding or succeeding months. To achieve a clean look:
1.  The entire grid is initialized to `null`.
2.  Any day falling before the first day of the 6-month period, or after the last day of the 6-month period, is kept as `null`.
3.  Active days inside the 6-month range are populated with their measurements (defaulting to `0` if no events occurred).

> [!NOTE]
> Setting out-of-bounds days to `null` instead of `0` ensures they are not rendered in isometric space (neither flat cell plates nor vertical bars are drawn), creating a true calendar grid structure.

---

## Visual Demonstration

Below is a schematic comparison of how values render:

| Value Type | Height | Appearance | Hover Interaction |
| :--- | :--- | :--- | :--- |
| **Positive (`> 0`)** | Upwards bar | Colored bar | Tooltip & Highlight |
| **Negative (`< 0`)** | Downwards bar | Diverging color bar | Tooltip & Highlight |
| **Zero (`0`)** | Flat cell | Flat zero-color plate | Tooltip & Highlight |
| **Null (`null`)** | Invisible | None (completely empty) | Ignored |
