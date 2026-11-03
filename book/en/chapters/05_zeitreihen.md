# Chapter 5: Time Series Without Manual Labor

Populating a grid by hand is feasible for eight by eight cells. For a full year with 371 cells, mapping timestamps onto matrix coordinates is precisely the type of arithmetic where daylight saving time and start-of-week offsets cause silent errors that nobody catches.

Presets take that work away: you don't deal with columns and rows at all. You say when something happened and how much, and the preset works out where it belongs.

## From Dates to a Calendar

Presets reside in a dedicated submodule so they are not loaded unless explicitly imported:

```typescript
import { presets } from 'mlc-isometric-heatmap/presets';

const days = [
  { date: '2026-09-01', value: 12 },
  { date: '2026-09-02', value: 7 },
  { date: '2026-09-02', value: 3 },
  { date: '2026-09-14', value: 18 },
];

const svg = presets
  .aggregateCalendarMonth(days, { year: 2026, month: 8 }) // months count from 0: September
  .render({ colorScheme: 'emerald' });
```

There is not a single coordinate in this code. The preset takes care of the rest:

- **Position:** Every event lands on its weekday and week, including the offset of the first day of the month.
- **Summing:** Events on the same day add up, so 2 September shows 10 here.
- **Filtering:** Events outside the requested period are ignored, so one long list can feed several charts.
- **Labels:** Axes and tooltips are filled in, and `locale` and `weekLabel` adapt them to your language.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/calendar_month_september.svg" style="width:100%;aspect-ratio:1.665;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">September as a wall calendar, built from nothing but dates and values. <a href="https://play.mlcgo.eu/isometric-heatmap/calendar-month">Try it in the playground</a>.</figcaption>
</figure>

Dates can arrive in whatever form your data has:

| Form | Example | Meaning |
|---|---|---|
| Plain date | `'2026-09-01'` | That calendar day, in every time zone |
| Timestamp with time zone | `'2026-09-01T22:30:00Z'` | Converted to local time, so it can land on another hour or day |
| `Date` object | `new Date(2026, 8, 1)` | As it is |
| Milliseconds | `1788220800000` | Since 1970, as many APIs deliver them |

Cells always follow the local time of whoever runs the code. An unreadable date is skipped without an error.

## 24 Hours Against Weekdays

This preset reads `timestamp` instead of `date`, because the hour matters:

```typescript
const events = [
  { timestamp: '2026-06-09T10:15:00', value: 5 },
  { timestamp: '2026-06-09T15:30:00', value: 20 },
];

const grid = presets.aggregate24h(events, { startOfWeek: 1 });
```

24 columns, 7 rows. Weeks begin on Monday by default; `startOfWeek: 0` begins them on Sunday, as is common in US calendars.

This is the ideal view for diurnal rhythms: when machinery runs, when periods of quiet occur, and how weekends differ from working hours.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_double_row_timeline.svg" style="width:100%;aspect-ratio:1.674;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Two measurement series as daily timelines.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_single_day_4points.svg" style="width:100%;aspect-ratio:1.674;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">A single day with four sample points — sparse data still yields a legible, informative picture.</figcaption>
</figure>

## One Month

```typescript
const grid = presets.aggregateMonth(days, { year: 2026, month: 8 });
```

Weeks as columns, weekdays as rows. The monthly view is the granularity at which a human viewer can still easily inspect any individual day.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/month_emerald_cylinder_height_grid_solid.svg" style="width:100%;aspect-ratio:1.445;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">A single month with a height grid as a scale backdrop in the rear.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/month_workweek_mon_fri_calendar.svg" style="width:100%;aspect-ratio:1.372;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Monday to Friday only: where weekends contribute no data, showing them only wastes visual space.</figcaption>
</figure>

## Half a Year

A gap exists between a single month and an entire year: 26 weeks is too wide for a single monthly chart, yet too compact to form long-term seasonal textures in an annual grid. The six-month preset bridges this gap, optionally with monthly divider gaps.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/sixmonths_split_sunset.svg" style="width:100%;aspect-ratio:1.492;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Six months with month dividers: boundaries remain distinctly readable.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/sixmonths_double_sunset_height_grid.svg" style="width:100%;aspect-ratio:1.654;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Two series across six months, paired with an isometric height grid.</figcaption>
</figure>

## One Year

```typescript
const grid = presets.aggregateYear(days, { year: 2026 });
```

53 weeks against 7 weekdays — the geometry familiar from contribution graphs, elevated here with 3D height. At this density, row text can become visual clutter; `showRowLabels: false` turns them off cleanly.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_sunset_no_row_labels.svg" style="width:100%;aspect-ratio:1.980;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">A full year without row labels: the structural rhythm carries the visualization on its own.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_emerald_mesh_terrain.svg" style="width:100%;aspect-ratio:1.976;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">The exact same year rendered as a continuous 3D relief instead of columns.</figcaption>
</figure>

## Multiple Groups Side by Side

When comparing quarters, semesters, or different facility locations, multiple grids can be merged into a single visualization rather than laid out in separate figures. The critical benefit is a unified vertical scale — independent graphs scale to their own local maxima, distorting comparative analysis.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/multimonth_combined_groups.svg" style="width:100%;aspect-ratio:1.298;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Multiple monthly groups unified within a single graphic with a shared height scale.</figcaption>
</figure>
