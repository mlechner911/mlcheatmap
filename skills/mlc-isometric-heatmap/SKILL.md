---
name: mlc-isometric-heatmap
description: Render isometric 3D heatmaps or flat 2D heatmaps as SVG strings with mlc-isometric-heatmap (TypeScript, no DOM needed) — grids of prisms, cylinders, ribbons or terrain meshes, calendar views by hour, month and year, shared scales, axis labels and walls. Use when writing or changing code that imports mlc-isometric-heatmap, or when values over two dimensions, such as activity per weekday and hour or per day of a year, should become a heatmap, even if the request only says "calendar chart" or "contribution graph".
---

# mlc-isometric-heatmap

The library turns values on a grid into isometric 3D heatmaps. Height and color both carry the value, so charts stay readable in grayscale and for colorblind readers. The result is an SVG string, so the same call works in a browser and on a server. `view: "flat"` draws a standard 2D heatmap from the same data instead.

## Shortest path to a chart

```ts
import { HeatmapGrid } from "mlc-isometric-heatmap";

const grid = new HeatmapGrid(12, 4); // columns, rows

grid.setCell(0, 0, 10, "Week 1"); // col, row, value, tooltip
grid.setCell(1, 0, 15, "Week 2");
grid.setCell(2, 0, null); // no data: the cell stays empty

grid.rowLabels = ["Q1", "Q2", "Q3", "Q4"];

const svg: string = grid.render({
  shape: "cylinder",
  colorScheme: "sunset",
  maxHeight: 50,
  interpolateColors: true,
});
```

`render` only returns a string. To show it in a browser, put it into an element: `element.innerHTML = svg`.

## A calendar from raw events

Use the presets instead of building calendar grids by hand. They live in a separate entry point:

```ts
import { presets } from "mlc-isometric-heatmap/presets";

const events = [
  { date: "2026-09-01", value: 12 },
  { date: "2026-09-02", value: 7 },
];

const svg: string = presets
  .aggregateCalendarMonth(events, {
    year: 2026,
    month: 8, // September: months count from 0
    startOfWeek: 1,
    locale: "de-DE",
    weekLabel: (week: number) => `KW ${week}`,
  })
  .render({ colorScheme: "emerald" });
```

## When to use what

- **`HeatmapGrid`:** You have values per cell, or want to set labels and tooltips per cell. The usual choice.
- **`renderHeatmap(points, options)`:** You already have an array of `{ col, row, value }`. Here `cols` and `rows` are required options.
- **`presets`:** You have timestamped events and want a calendar. `aggregate24h`, `aggregateMonth`, `aggregateCalendarMonth`, `aggregateYear`, `aggregateSixMonthsDouble`.

## Traps

- **Months count from 0**, as in JavaScript dates: `month: 8` is September. A wrong month gives no error, only an empty or shifted calendar.
- **Package paths:** `mlc-isometric-heatmap/presets` is separate from the main entry. Without a bundler, load the ES module directly, for example `dist/index.es.js` and `dist/presets.es.js`. The bare CDN URL of the package leads to the UMD build, which cannot be imported as a module.
- **Scales are per grid.** Every grid scales to its own minimum and maximum, so the same height means different values in two charts. To compare grids, pass the same `valueDomain` to each.
- **`labelPosition` defaults to `front` since 1.3.0.** With `labelLift`, labels then land on top of the bars. Set `labelPosition: "behind"` when lifting labels onto `showAxisWalls`.
- **Overlapping labels:** Long labels or many cells collide in the default `labelMode: "screen"`. Use `labelMode: "axis"` with `colLabelInterval: "auto"` and `rowLabelInterval: "auto"`.
- **`view: "flat"` has no height.** Only color carries the value, so it loses the grayscale and colorblind readability. `shape`, `maxHeight`, `projectionAngle`, `labelMode`, `labelLift`, `showAxisWalls` and `heightGrid` are ignored without an error. Column labels go on top by default; `labelPosition: "front"` moves them below.
- **`null` is not `0`.** `null` leaves the cell empty, `0` draws a flat tile, and negative values sink below the floor in a different color. In a `mesh`, a `null` corner cuts a hole into the surface.
- **Tooltips name no unit.** Presets write `<date>: <value>`. Pass `tooltipFormatter` to `render`, or a label to `setCell`, for your own text.
- **Hiding labels:** `rowLabels: undefined` falls back to the labels of the grid. Use `showRowLabels: false`.

## More detail

Read the file that matches the task:

| Task | File |
|---|---|
| All render options, the flat view, shapes, color schemes, axes, walls and labels | [references/options.md](references/options.md) |
| Presets and their event formats, several grids in one SVG | [references/presets-and-composites.md](references/presets-and-composites.md) |
| Projection, depth order, color and shading formulas, for changing the library itself | [references/geometry.md](references/geometry.md) |
