# Chapter 6: Zero Is Not Nothing

The distinction between a measured zero and an absent measurement is the most critical principle in this library — and the one data visualizations blur most frequently.

| Value | Rendering |
| :--- | :--- |
| Number | Column reflecting the value's height and palette color |
| `0` | Flat tile on the floor in `zeroColor` or the theme's base color |
| `null` | **Nothing** — only bare floor grid lines, no 3D geometry, no tooltip |

A zero means: the sensor or machine was online and recorded zero output. A `null` means: we do not know. Conflating the two transforms an outage into a deceptively calm night.

That a `null` cell receives **no tooltip** is deliberate: there is nothing to report, and an empty tooltip would invent information where none exists.

## How the Shapes Handle Missing Values

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/null_test_8x8_prism.svg" style="width:100%;aspect-ratio:1.399;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">prism: the gap is an empty slot in the grid, unmistakable.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/null_test_8x8_cylinder.svg" style="width:100%;aspect-ratio:1.399;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">cylinder: identical semantics with cylindrical geometry.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/null_test_8x8_ribbon.svg" style="width:100%;aspect-ratio:1.423;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">ribbon: the curve breaks and restarts cleanly rather than interpolating across the void.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/null_test_8x8_flatribbon.svg" style="width:100%;aspect-ratio:1.404;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">flatribbon: the floating ribbon also pauses — drawing a continuous line would invent fictitious telemetry.</figcaption>
</figure>

This final point is paramount: for continuous geometries it would be trivial to bridge across gaps automatically. The resulting image might look smoother, but it would be dishonest.

## Holes in the Terrain

In a 3D terrain mesh, missing values create clear voids in the surface. This is the most visually striking way of stating: "data is missing here".

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/mesh_terrain_sunset_hills_flat.svg" style="width:100%;aspect-ratio:1.593;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">A terrain relief with a cut-out. The edges remain clean because no polygons are stretched across missing data points.</figcaption>
</figure>
