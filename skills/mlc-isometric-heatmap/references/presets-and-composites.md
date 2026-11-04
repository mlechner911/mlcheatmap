# Presets and composites

Import presets from `mlc-isometric-heatmap/presets`. Each one returns a `HeatmapGrid` with labels and tooltips, ready for `.render()`. Events in the same cell are summed.

## Which preset

| Preset | Layout | Events | Required options |
|---|---|---|---|
| `aggregate24h` | 24 hours × 7 weekdays | `{ timestamp, value }` | none |
| `aggregateMonth` | Week columns × 7 weekdays | `{ date, value }` | `year`, `month` |
| `aggregateCalendarMonth` | 7 weekdays × week rows, like a wall calendar | `{ date, value }` | `year`, `month` |
| `aggregateYear` | 53 weeks × 7 weekdays | `{ date, value }` | none |
| `aggregateSixMonthsDouble` | 6 months, two rows per weekday (AM/PM) | `{ date, value, measurement? }` | `year`, `startMonth` |

`month` and `startMonth` count from 0. `date` and `timestamp` take a `Date`, a string or milliseconds since the epoch. `startOfWeek` sets the first weekday, `0` is Sunday and `1` is Monday, the default.

```ts
import { presets } from "mlc-isometric-heatmap/presets";

const week = presets.aggregate24h(
  [
    { timestamp: "2026-06-09T08:30:00", value: 12 },
    { timestamp: "2026-06-09T18:45:00", value: 25 },
  ],
  { startOfWeek: 1 },
);

const svg = week.render({ colorScheme: "sky", shape: "flatribbon", interpolateColors: true });
```

`aggregateCalendarMonth` brings its own defaults: flat relief, a floor only under real days and labels along the axes. It also takes `locale` and `weekLabel`.

Cells follow local time where the code runs. A plain `"2026-09-01"` stays on that calendar day everywhere. A timestamp with a time zone, such as one ending in `Z`, is converted, so it can land on another hour or day. An unreadable date is skipped without an error.

## Comparing several grids

Render them with the same `valueDomain`, otherwise each one scales to its own data:

```ts
import { presets } from "mlc-isometric-heatmap/presets";

const options = { colorScheme: "amber", valueDomain: { min: 0, max: 40 } } as const;

const march = presets.aggregateMonth([{ date: "2026-03-02", value: 10 }], { year: 2026, month: 2 });
const july = presets.aggregateMonth([{ date: "2026-07-02", value: 35 }], { year: 2026, month: 6 });

const svgs = [march.render(options), july.render(options)];
```

## Several grids in one SVG

`wrapper: "g"` returns a group instead of a complete SVG. Move each group into place yourself:

```ts
import { presets } from "mlc-isometric-heatmap/presets";

const may = presets.aggregateMonth([{ date: "2026-05-04", value: 8 }], { year: 2026, month: 4 });
const june = presets.aggregateMonth([{ date: "2026-06-01", value: 5 }], { year: 2026, month: 5 });

const gridSize = 22;
const gap = 3;
const options = { wrapper: "g", gridSize, gap, valueDomain: { min: 0, max: 10 } } as const;

// One column to the right is cos(angle) across and sin(angle) down, here at 30 degrees.
const step = gridSize + gap;
const angle = (30 * Math.PI) / 180;
const dx = may.cols * step * Math.cos(angle);
const dy = may.cols * step * Math.sin(angle);

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="100%">
  ${may.render(options)}
  <g transform="translate(${dx.toFixed(2)}, ${dy.toFixed(2)})">${june.render(options)}</g>
</svg>`;
```

In the flat view, grids sit side by side without any projection, so one column is simply `gridSize` across:

```ts
import { presets } from "mlc-isometric-heatmap/presets";

const may = presets.aggregateMonth([{ date: "2026-05-04", value: 8 }], { year: 2026, month: 4 });
const june = presets.aggregateMonth([{ date: "2026-06-01", value: 5 }], { year: 2026, month: 5 });

const gridSize = 16;
const options = { view: "flat", wrapper: "g", gridSize, valueDomain: { min: 0, max: 10 } } as const;
const dx = may.cols * gridSize + 40; // Room for the row labels of the next grid.

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -40 400 200" width="100%">
  ${may.render(options)}
  <g transform="translate(${dx}, 0)">${june.render(options)}</g>
</svg>`;
```
