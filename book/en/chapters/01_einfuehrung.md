# Chapter 1: Why Isometric?

Everyone is familiar with a flat 2D heatmap: a grid of tiles where color represents the value. This works well as long as the numbers are spread far apart. As soon as they are not, the visualization reaches a limit that lies in the human eye rather than the data — no one can reliably distinguish two adjacent shades of green, and anyone trying ends up reading the legend instead of the graphic.

This library gives each value a second expressive channel: **height**. Color and height carry the same number, and the eye reads one where the other fails. An outlier stands out before you even search for it.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_double_ribbon.svg" style="width:100%;aspect-ratio:3.813;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Two measurement series over 24 hours. The afternoon spike is immediately visible as height — on a flat heatmap it would only be a slightly richer green.</figcaption>
</figure>

## What the Library Is

`mlc-isometric-heatmap` is a TypeScript library that transforms a numerical matrix into an isometric 3D visualization rendered as **SVG**. No Canvas, no WebGL, no runtime dependency: the output is a clean string that you can inject into a page, save to a file, or send via email.

This has benefits that go far beyond technical purity:

- **Resolution-independent.** The exact same file looks razor-sharp on a smartphone and on a billboard.
- **Searchable and accessible.** Every cell carries a `<title>` tag that screen readers can read aloud and browsers display as a native tooltip.
- **Interactive without JavaScript.** Hover highlights are embedded directly into the SVG as pure CSS rules. All examples in this handbook are embedded this way — hover over any column and its value appears.
- **Server-side ready.** The library runs in Node.js just as smoothly as in the browser. A report can bundle its finished graphic rather than building it upon opening.

## Installation

```bash
npm install mlc-isometric-heatmap
```

Without bundlers, you can use it directly in the browser:

```html
<script type="module">
  import { HeatmapGrid } from 'https://unpkg.com/mlc-isometric-heatmap/dist/index.es.js';
</script>
```

If you need a classic `<script>` tag, use the UMD build; the library is exposed on `window.MlcIsometricHeatmap`, and the calendar presets on `window.MlcIsometricHeatmapPresets`.

## What It Is Designed For

The library originated from sensor telemetry: measurements over time with a natural temporal grid — hours against weekdays, days against weeks, weeks against months. Wherever a pattern repeats across two axes, the isometric view reveals much more than a flat line chart.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_sunset_greenzero_20deg.svg" style="width:100%;aspect-ratio:2.466;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">A full year: 53 weeks against 7 weekdays. The weekend patterns are obvious without anyone having to explicitly highlight them.</figcaption>
</figure>
