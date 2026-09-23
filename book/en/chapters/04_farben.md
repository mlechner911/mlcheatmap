# Chapter 4: Color, Gradients, and Contrast

Eight schemes are built-in: `github`, `emerald`, `sky`, `coral`, `amber`, `purple`, `sunset`, and `grayscale`. Each provides a light and dark variant; `dark: true` toggles between them.

```typescript
grid.render({ colorScheme: 'sunset', dark: true });
```

## Choice of Palette Is Never Merely Decorative

A color scheme directly governs which nuances become visible. `grayscale` sounds austere, but is the most honest choice when graphics are printed or when hue already carries another semantic meaning in your dashboard.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_grayscale_front_35deg.svg" style="width:100%;aspect-ratio:1.441;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">A full year in grayscale. Height carries the visual statement entirely on its own — and succeeds.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/month_coral_behind.svg" style="width:100%;aspect-ratio:1.52;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">The same principle in Coral: color reinforces what height already communicates.</figcaption>
</figure>

## Gradients Between Cells

By default, every cell is filled with a discrete color. For `ribbon` and `flatribbon`, color can smoothly interpolate between control points instead. The result reads as a continuous gradient rather than a stair-step sequence — appropriate for physical quantities that evolve smoothly.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/sixmonths_split_smooth_gradient.svg" style="width:100%;aspect-ratio:1.627;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Six months with smooth color gradients. Transitions are as seamless as the physical metrics they represent.</figcaption>
</figure>

## Zero Is Worth Its Own Color

`zeroColor` gives cells with an exact value of zero a dedicated color. This is more crucial than it might seem: zero is a real, measured observation, not a missing one. Conflating the two conceals outages — leading to decisions based on graphics that falsely portray missing telemetry as calm silence.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_sunset_greenzero_20deg.svg" style="width:100%;aspect-ratio:2.466;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Zero values are highlighted in green, clearly distinguishing them as active measurements.</figcaption>
</figure>

## Opacity and Substrate

Setting `opacity` below 1.0 lets floor grid lines and rows in the background shine through. In dense arrangements, this transparency is often the decisive difference between rich 3D depth and an unreadable blur.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/year_emerald_transparent.svg" style="width:100%;aspect-ratio:1.666;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Semi-transparent columns: the underlying grid remains visible, anchoring spatial orientation.</figcaption>
</figure>
