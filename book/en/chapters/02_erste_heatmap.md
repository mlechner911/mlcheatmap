# Chapter 2: The First Heatmap

The model consists of two parts: a grid that holds values, and a render call that turns them into SVG.

```typescript
import { HeatmapGrid } from 'mlc-isometric-heatmap';

const grid = new HeatmapGrid(8, 8);

grid.setCell(0, 0, 15, 'Monday morning');
grid.setCell(1, 1, -10, 'Dip on Tuesday');
grid.setCell(2, 2, null, 'No measurement');

grid.colLabels = ['00', '03', '06', '09', '12', '15', '18', '21'];
grid.rowLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const svg = grid.render({ shape: 'prism', colorScheme: 'emerald' });
```

`setCell` accepts three core arguments: column, row, value — and an optional string that appears as a tooltip. The value can be `null`, which is not an error but an intentional state: see Chapter 6.

## Key Options

`render()` takes an options object. No option is strictly required; the defaults produce a sensible, balanced visualization.

| Option | Default | Effect |
| :--- | :--- | :--- |
| `shape` | `'prism'` | Column shape: `prism`, `cylinder`, `ribbon`, `flatribbon`, `mesh` |
| `colorScheme` | `'github'` | `github`, `emerald`, `sky`, `coral`, `amber`, `purple`, `sunset`, `grayscale` — or a custom palette |
| `dark` | `false` | Color values adapted for dark backgrounds |
| `maxHeight` | `40` | Height in pixels for the highest column |
| `gridSize` | `16` | Edge length of a single cell |
| `gap` | `2` | Spacing between neighboring columns |
| `projectionAngle` | `30` | Viewing angle in degrees, recommended between 10 and 60 |
| `opacity` | `1.0` | Opacity of the columns |
| `showGrid` | `true` | Base grid lines on the floor |
| `labelPosition` | `'behind'` | Place labels behind or in front of the grid |
| `interactive` | `true` | Tooltips and hover highlights |
| `animated` | `true` | Staggered entrance animation upon loading |

## The Viewing Angle Makes the Difference

`projectionAngle` is the option that alters the result most dramatically, yet is easiest to overlook. A shallow angle emphasizes surface area and overall periodicity, while a steep angle emphasizes column height and individual spikes.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_double_low_profile.svg" style="width:100%;aspect-ratio:3.813;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Low profile: distribution throughout the day remains the primary focus.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_sky_front_45deg.svg" style="width:100%;aspect-ratio:1.127;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Steep angle with labels in front: individual values are legible while the overall pattern recedes.</figcaption>
</figure>

There is no universally "correct" angle — only one that answers your specific analytical question. If you are looking for outliers, choose a steep angle; if you want to showcase daily curves, choose a shallow one.

## Label Styling

Row labels can be styled independently: font size, color, and especially background badges to keep them legible against noisy backdrops.

```typescript
grid.render({
  rowLabelStyle: {
    backgroundColor: '#2f3542',
    backgroundOpacity: 0.8,
    padding: 4,
    borderRadius: 2,
  },
});
```

If you specify a background color without a text color, the library calculates contrast automatically — light text on dark backgrounds, dark text on light backgrounds.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_sky_styled_labels_slate_bg.svg" style="width:100%;aspect-ratio:1.592;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Badged labels: row names stay clearly legible even when tall columns rise directly behind them.</figcaption>
</figure>
