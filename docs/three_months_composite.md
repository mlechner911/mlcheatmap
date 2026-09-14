# 3-Month Composite (Quarter View in One SVG)

Goal: render **3 calendar months side-by-side in a single SVG** — e.g. Apr–Jun 2026 or a rolling quarter. There is no dedicated `aggregateQuarter` preset; the recommended path is the **composite technique**: 3× `presets.aggregateMonth` → 3× `wrapper: 'g'` → one parent `<svg>` with `translate(dx, dy)` offsets.

This is the same pattern as `sixmonths_split_preset.md` (6 months) and `multimonth` in `demo/generator.js` (2 months), reduced to the most common case: one quarter on one page.

---

## 1. Layout principle

1. Aggregate each month separately: `presets.aggregateMonth(events, { year, month, startOfWeek })`. Each grid has its own column count (4–6 week columns) and 7 rows (Mon–Sun).
2. Compute the **shared value domain** over the whole quarter (`min`/`max` across all three months) and pass it as `valueDomain` to every block. Without this, each month normalizes to its own max and identical heights would mean different values — the single biggest source of misreading in composites.
3. Render each grid as a `<g>` group (`wrapper: 'g'`), not a full `<svg>`. Styles/`<defs>` travel inside the group, so the composite stays self-contained.
4. Offset month `i` along the isometric column axis with a 1-column spacer gap:
   $$dx = (C_{\text{cumulative}} + i \cdot \text{spacer}) \cdot (\text{gridSize} + \text{gap}) \cdot \cos(\theta)$$
   $$dy = (C_{\text{cumulative}} + i \cdot \text{spacer}) \cdot (\text{gridSize} + \text{gap}) \cdot \sin(\theta)$$
   where $C_{\text{cumulative}}$ = total columns of all preceding months, $\theta$ = `projectionAngle`.
5. Labels & axes per block:
   - Row labels: only month 0 shows them — via `showRowLabels: i === 0`. NOTE: passing `rowLabels: undefined` does **not** hide them, the renderer falls back to the grid's own labels (`rowLabels ?? gridModel.rowLabels` in `src/render/renderer.ts`).
   - Column labels: prefix with the month name (`Apr W1…`) so repeated `W1`s stay attributable.
   - Axes: `showAxis: true` draws a baseline rule along both floor edges plus tick marks toward the label side (ticks follow label intervals and hide with the labels).
   - Month identity: put the month name as the **first column label** (`['Apr', 'W2', …]`, year-preset convention) instead of a separate `<text>` title. Top-center or bottom-center per-block titles collide with the neighbouring block in diagonal packing (verified visually); the corner label needs no extra viewBox room.
   - Back walls: `showAxisWalls: true` + `axisWallHeight` (e.g. `28`) draws translucent walls along both rear edges as a calm label backdrop. While walls are on, behind-positioned labels render in the **foreground layer** so tall bars can never bury them. Use `spacerCols = 2` so block N+1's back labels clear block N.
6. Parent viewBox: union over the three `data-min-x / data-min-y / data-width / data-height` bounds attributes plus padding — otherwise the SVG clips.

---

## 2. Minimal recipe (TypeScript)

```typescript
import { presets } from 'mlc-isometric-heatmap/presets';

const year = 2026;
const months = [3, 4, 5]; // Apr, May, Jun (0-indexed)
const startOfWeek = 1;
const gridSize = 16, gap = 2, angle = 30;
const spacerCols = 1;

const rad = (angle * Math.PI) / 180;
const stepX = (gridSize + gap) * Math.cos(rad);
const stepY = (gridSize + gap) * Math.sin(rad);

// Group events per month beforehand (DateEvent: { date, value })
const groups: string[] = [];
let accumulatedCols = 0;
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

months.forEach((m, i) => {
  const mEvents = allEvents.filter(ev => {
    const d = new Date(ev.date);
    return d.getFullYear() === year && d.getMonth() === m;
  });
  const grid = presets.aggregateMonth(mEvents, { year, month: m, startOfWeek });

  const g = grid.render({
    wrapper: 'g',
    gridSize, gap, projectionAngle: angle,
    colorScheme: 'emerald',
    shape: 'prism',
    valueDomain,              // shared quarter scale (see step 2)
    showAxis: true,           // baseline rules + ticks per block
    showRowLabels: i === 0,   // only first month labels rows
    colLabels: grid.colLabels.map(w => monthNames[m] + ' ' + w),
    title: undefined,
  });

  const colOffset = accumulatedCols + i * spacerCols;
  const dx = colOffset * stepX;
  const dy = colOffset * stepY;
  groups.push(`<g class="iso-month-block" data-month="${m}" transform="translate(${dx.toFixed(2)}, ${dy.toFixed(2)})">${g}</g>`);

  const match = g.match(/data-min-x="([^"]+)" data-min-y="([^"]+)" data-width="([^"]+)" data-height="([^"]+)"/);
  if (match) {
    const x0 = parseFloat(match[1]) + dx, y0 = parseFloat(match[2]) + dy;
    minX = Math.min(minX, x0); minY = Math.min(minY, y0);
    maxX = Math.max(maxX, x0 + parseFloat(match[3]));
    maxY = Math.max(maxY, y0 + parseFloat(match[4]));
  }
  accumulatedCols += grid.cols;
});

const padding = 20;
const viewX = minX - padding, viewY = minY - padding;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX.toFixed(2)} ${viewY.toFixed(2)} ${((maxX - minX) + 2 * padding).toFixed(2)} ${((maxY - minY) + 2 * padding).toFixed(2)}" width="100%" height="100%">${groups.join('\n')}</svg>`;
```

Notes:
- `spacerCols = 1` gives the visible month gap. Use `0` for a seamless block.
- Keep `gridSize / gap / projectionAngle` identical across all three renders, otherwise the `dx/dy` math breaks.
- `valueDomain`, `colorScheme`, `maxHeight` and `shape` must also be identical across blocks, otherwise heights/colors are not comparable.
- For a rolling quarter, replace the fixed `months` array with the last 3 calendar months derived from `endDate`.
- New options reference: `valueDomain?: { min, max }`, `showAxis?: boolean` (default `false`), `axisColor?: string` (default: theme label color), `axisWidth?: number` (default `1`), `axisTickLength?: number` (default `5`).
- Wall options: `showAxisWalls?: boolean` (default `false`), `axisWallHeight?: number` (default `maxHeight`), `axisWallColor?: string` (default: height-grid wall default). Walls are included in bounds calculation, so no clipping.
- Label lift: `labelLift?: number` (default `0`) shifts all axis labels upward by px. Set it to the wall height so labels sit on the wall top edge; each labeled column/row then gets a ruling line down the wall face to its grid line (`iso-axis-wall-rule`). Lift is included in bounds calculation.
- Label rotation: `colLabelAngle?: number`, `rowLabelAngle?: number` (default `0`, positive = clockwise). Row labels with `rowLabelAngle: -projectionAngle` follow the row axis and are much easier to attribute to their row (verified visually). Vertical row labels (`rowLabelAngle: -90`, anchor auto-centers on the iso edge line) with a `rowLabelStyle` background pill (`backgroundColor`, `backgroundOpacity`, `padding`, `borderRadius`) give zero overlap even for long labels — the recommended combo for calendar blocks. Rotated column labels overlap at week-column density — keep them horizontal. Rotated bounds are accounted for, no clipping.

---

## 3. Demo (CLI)

The demo generator ships a ready-made `three-months` preset (Apr–Jun 2026, deterministic sine mock data):

```bash
node demo/generator.js --preset=three-months --color=emerald --angle=30 \
  --out=demo/output/three_months_q2_2026_emerald.svg
```

Positive values only (standard single-hue look, no diverging negatives):

```bash
node demo/generator.js --preset=three-months --positive --color=emerald --angle=30 \
  --out=demo/output/three_months_q2_2026.svg
```

Or via the batch script (`demo/generate.sh`, Example 46):
`three_months_q2_2026_emerald.svg` is generated alongside all other examples.

---

## 4. When NOT to use this

- For a full year, use `presets.aggregateYear` (one 53-column grid, GitHub-style) instead of 12 composites.
- For AM/PM double measurements over 6 months, use `presets.aggregateSixMonthsDouble` / `sixmonths_preset.md`.
- For continuous terrain without month gaps, use `shape: 'mesh'` on a single grid rather than stitching.

See also: `series_shapes_and_wrapping.md` (group wrapping fundamentals), `sixmonths_split_preset.md` (6-month variant of this pattern).
