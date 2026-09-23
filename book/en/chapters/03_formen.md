# Chapter 3: The Five Shapes

`shape` defines how numerical values turn into geometry. This choice is never purely aesthetic — every shape answers certain analytical questions well and others poorly.

## prism — The Standard

One box per value, clearly delineated. This is the default, and in most cases the right one: individual values remain distinguishable, and the grid structure stays clearly legible.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_triple_prism_mixed.svg" style="width:100%;aspect-ratio:1.824;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Three series as prisms. Each value is a discrete volumetric body and readable as such.</figcaption>
</figure>

## cylinder — Softer, Same Principle

The same quantitative statement with rounder contours. Useful when the graphic sits next to body text where the sharp edges of a prism might feel too harsh or mechanical.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_double_cylinder.svg" style="width:100%;aspect-ratio:1.858;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Cylinders instead of prisms — same data, calmer visual rhythm.</figcaption>
</figure>

## ribbon — The Continuous Curve

Instead of separated bodies, a continuous ribbon spans along each series row. The eye follows the trend rather than individual discrete values. This is ideal when the question is "how does this metric develop over time?", and wrong when asking "what was the exact value on Tuesday?".

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_triple_ribbon.svg" style="width:100%;aspect-ratio:3.963;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Three ribbons. Comparing trajectories against each other is the primary strength of this shape.</figcaption>
</figure>

## flatribbon — The Floating Ribbon

A standard `ribbon` extends all the way down to the base plane, creating a solid wall. A `flatribbon` maintains constant vertical thickness, following the contour curve while floating freely in 3D space. When stacking multiple parallel rows, this is the difference between visual clarity and an impenetrable solid block.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_triple_flatribbon.svg" style="width:100%;aspect-ratio:3.963;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Three floating ribbons. Because they do not drop to the floor, they do not occlude rows behind them.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/24h_gradient_sky_flatribbon.svg" style="width:100%;aspect-ratio:3.255;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Flatribbon with smooth color gradient — height and color convey the same analytical message.</figcaption>
</figure>

## mesh — The Landscape Terrain

All other shapes treat values as isolated or row-wise bodies. `mesh` treats the entire matrix as a single, connected 3D surface: adjacent points are triangulated into polygons, forming a cohesive relief map.

This is the right shape for data that is genuinely continuous — temperature across space and time, or network load across a topology. For discrete event counts it can be misleading, as it implies continuity where none exists.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/mesh_terrain_sunset_hills.svg" style="width:100%;aspect-ratio:1.637;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">A 3D terrain mesh. The circular gap in the center is not a bug, but a lake of null values — see Chapter 6.</figcaption>
</figure>

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/mesh_terrain_emerald_hills.svg" style="width:100%;aspect-ratio:2.306;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">The exact same terrain rendered in a different color scheme.</figcaption>
</figure>

## Mixing Shapes

Shapes can also be assigned on a per-row basis. While rarely needed, if two series represent fundamentally different domains — such as discrete incident counts alongside continuous sensor telemetry — mixing shapes highlights the difference before the reader even checks the legend.

<figure style="margin:2rem 0">
<div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.35)">
<object type="image/svg+xml" data="/books/mlcheatmap/images/month_mixed_shapes_per_row.svg" style="width:100%;aspect-ratio:1.395;display:block"></object>
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Distinct shapes per row within a single visualization.</figcaption>
</figure>
