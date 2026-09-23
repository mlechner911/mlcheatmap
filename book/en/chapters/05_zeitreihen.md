# Chapter 5: Time Series Without Manual Labor

Populating a grid by hand is feasible for eight by eight cells. For a full year with 371 cells, mapping timestamps onto matrix coordinates is precisely the type of arithmetic where daylight saving time and start-of-week offsets cause silent errors that nobody catches.

That is what presets are for. They reside in a dedicated submodule so they are not loaded unless explicitly imported:

```typescript
import { presets } from 'mlc-isometric-heatmap/presets';

const events = [
  { timestamp: new Date('2026-06-09T10:15:00Z'), value: 5 },
  { timestamp: new Date('2026-06-09T15:30:00Z'), value: 20 },
];
```

## 24 Hours Against Weekdays

```typescript
const grid = presets.aggregate24h(events, { startOfWeek: 1 });
```

24 columns, 7 rows. `startOfWeek: 1` begins on Monday — the Sunday default originates from US calendar conventions and is usually inappropriate for European contexts.

This is the ideal view for diurnal rhythms: when machinery runs, when periods of quiet occur, and how weekends differ from working hours.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_double_row_timeline.svg" style="width:100%;aspect-ratio:1.858;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Two measurement series as daily timelines.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_single_day_4points.svg" style="width:100%;aspect-ratio:1.815;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">A single day with four sample points — sparse data still yields a legible, informative picture.</figcaption>
</figure>

## One Month

```typescript
const grid = presets.aggregateMonth(events, { year: 2026, month: 5 });
```

Weeks as columns, weekdays as rows. The monthly view is the granularity at which a human viewer can still easily inspect any individual day.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/month_emerald_cylinder_height_grid_solid.svg" style="width:100%;aspect-ratio:1.464;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">A single month with a height grid as a scale backdrop in the rear.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/month_workweek_mon_fri_calendar.svg" style="width:100%;aspect-ratio:1.374;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Monday to Friday only: where weekends contribute no data, showing them only wastes visual space.</figcaption>
</figure>

## Half a Year

A gap exists between a single month and an entire year: 26 weeks is too wide for a single monthly chart, yet too compact to form long-term seasonal textures in an annual grid. The six-month preset bridges this gap, optionally with monthly divider gaps.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/sixmonths_split_sunset.svg" style="width:100%;aspect-ratio:1.602;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Six months with month dividers: boundaries remain distinctly readable.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/sixmonths_double_sunset_height_grid.svg" style="width:100%;aspect-ratio:1.65;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Two series across six months, paired with an isometric height grid.</figcaption>
</figure>

## One Year

```typescript
const grid = presets.aggregateYear(events, { year: 2026 });
```

53 weeks against 7 weekdays — the geometry familiar from contribution graphs, elevated here with 3D height. At this density, row text can become visual clutter; `showRowLabels: false` turns them off cleanly.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_sunset_no_row_labels.svg" style="width:100%;aspect-ratio:1.924;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">A full year without row labels: the structural rhythm carries the visualization on its own.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_emerald_mesh_terrain.svg" style="width:100%;aspect-ratio:2.003;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">The exact same year rendered as a continuous 3D relief instead of columns.</figcaption>
</figure>

## Multiple Groups Side by Side

When comparing quarters, semesters, or different facility locations, multiple grids can be merged into a single visualization rather than laid out in separate figures. The critical benefit is a unified vertical scale — independent graphs scale to their own local maxima, distorting comparative analysis.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/multimonth_combined_groups.svg" style="width:100%;aspect-ratio:1.528;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Multiple monthly groups unified within a single graphic with a shared height scale.</figcaption>
</figure>
