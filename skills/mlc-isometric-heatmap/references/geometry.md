# Geometry

Only needed when changing the library itself or placing your own shapes over a chart.

## Projection

A point in column `c`, row `r` and height `h` lands on the screen at:

```text
x = (c * gridSize - r * gridSize) * cos(angle)
y = (c * gridSize + r * gridSize) * sin(angle) - h
```

`angle` is `projectionAngle` in radians.

## Depth order

Draw back to front, cell by cell. For each cell, draw the floor lines first and then its shape. Mixing positive, negative and zero cells then needs no extra sorting:

```text
for r in rows:
  for c in cols:
    draw floor lines of (c, r)
    draw shape of (c, r)
```

## Color interpolation

The stops are `[empty, step 0, ..., step N-1]`. The position in them is `i = min(1, |value| / max) * N`. The color is a linear RGB mix between the stops at `floor(i)` and `ceil(i)`.

## Mesh shading

For a quadrilateral with corner `A = (c * gridSize, r * gridSize, h(c, r))`:

```text
U = (gridSize, 0, h(c+1, r) - h(c, r))
V = (0, gridSize, h(c, r+1) - h(c, r))
N = U x V = (-gridSize * (h(c+1, r) - h(c, r)), -gridSize * (h(c, r+1) - h(c, r)), gridSize^2)
```

Normalize `N` and take its dot product with the light vector `(0.408, -0.408, 0.816)` to get the Lambertian shading.
