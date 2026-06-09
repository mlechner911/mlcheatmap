# Architecture — Isometric SVG Heatmap

This document describes the architectural layout, coordinate systems, and algorithms used to render a 3D isometric heatmap in SVG format.

## 1. Coordinate System & Projection Math

The library maps 3D grid cell indices $(col, row)$ and cell values (height $H$) to 2D screen coordinates $(X, Y)$ inside an SVG container.

Standard isometric projection rotates the grid by 45 degrees around the Z axis, then tilts it by 35.264 degrees. For Web SVG, we use a simplified projection with a 30-degree angle, yielding the following equations:

$$\cos(30^\circ) = \frac{\sqrt{3}}{2} \approx 0.866025$$
$$\sin(30^\circ) = 0.5$$

For a grid spacing $S_{\text{grid}}$ and height $H$, the base of the bar is projected as:

$$X_0 = X_{\text{origin}} + (col - row) \cdot S_{\text{grid}} \cdot \cos(30^\circ)$$
$$Y_0 = Y_{\text{origin}} + (col + row) \cdot S_{\text{grid}} \cdot \sin(30^\circ) - H$$

### Symmetrical Gaps (Bar Centering)

To allow spacing between bars, each bar has a size $S_{\text{bar}} < S_{\text{grid}}$. We center the bar within the grid cell by calculating the offset:

$$\text{offset} = \frac{S_{\text{grid}} - S_{\text{bar}}}{2}$$

This centers the bar symmetrically. The coordinate calculation shifts the base points accordingly.

## 2. Rendering a 3D Bar

Each non-zero value is rendered as a 3D prism composed of three visible faces:
1. **Top face**: A horizontal rhombus at height $H$.
2. **Left face**: A vertical parallelogram connecting the left side of the top face to the base.
3. **Right face**: A vertical parallelogram connecting the right side of the top face to the base.

For zero values, we render only the top face (flat rhombus at height 0), or a placeholder outline.

### Lighting and Shading

To simulate a 3D light source coming from the top-left:
- **Top face**: 100% of the theme color brightness (e.g. standard color).
- **Left face**: 85% of the theme color brightness.
- **Right face**: 70% of the theme color brightness.

This provides instant visual depth without requiring complex WebGL or canvas operations.

## 3. Rendering Order & Depth (Z-Sorting)

To prevent visual overlapping bugs where bars in front are drawn behind bars in the back, we use a strict back-to-front rendering order. 

In our coordinate system:
- Columns ($col$) run back-left to front-right.
- Rows ($row$) run back-right to front-left.

Thus, the back-most point is $(0, 0)$ and the front-most point is $(cols - 1, rows - 1)$. 

By iterating using nested loops:
```ts
for (let c = 0; c < cols; c++) {
  for (let r = 0; r < rows; r++) {
     // Render bar(c, r)
  }
}
```
We guarantee that any cell closer to the viewer is drawn on top of cells further away.

## 4. Rendering a 3D Cylinder Column

When `shape` is set to `'cylinder'`, cells with value $H > 0$ are rendered as cylindrical columns instead of rectangular prisms.

### Cylinder Projection Math

A cylinder is centered inside a grid cell of size $S_{\text{grid}}$ with diameter $S_{\text{bar}}$. The projected bases (both top cap and bottom base) are ellipses:
- **Semi-major axis (horizontal)**: $r_x = \frac{S_{\text{bar}}}{2} \cdot \cos(\theta)$
- **Semi-minor axis (vertical)**: $r_y = \frac{S_{\text{bar}}}{2} \cdot \sin(\theta)$

For a cell at $(c, r)$, let $(X_t, Y_t)$ be the center of the top ellipse at height $H$ and $(X_b, Y_b)$ be the center of the bottom ellipse:
- $X_t = (c - r) \cdot S_{\text{grid}} \cdot \cos(\theta)$
- $Y_t = (c + r) \cdot S_{\text{grid}} \cdot \sin(\theta) - H + S_{\text{bar}} \cdot \sin(\theta)$
- $Y_b = Y_t + H$

### Cylinder Geometry Parts

1. **Mantle (Side Walls)**: A path bounded by the left/right tangents and the bottom/top elliptical arcs.
   - Left-top: $(X_t - r_x, Y_t)$
   - Left-bottom: $(X_t - r_x, Y_b)$
   - Right-bottom: $(X_t + r_x, Y_b)$
   - Right-top: $(X_t + r_x, Y_t)$
   - Path string: `M Left-Top L Left-Bottom A rx,ry 0 0,0 Right-Bottom L Right-Top A rx,ry 0 0,1 Left-Top Z`
2. **Top Cap**: A complete SVG `<ellipse>` centered at $(X_t, Y_t)$ with radii $(r_x, r_y)$.

### Cylinder Shading & Gradients

Unlike flat-polygon prisms, cylinder mantle surfaces have continuous curvature. We simulate realistic 3D lighting by defining an SVG `<linearGradient>` with the following stops:
- **0%**: Shaded left edge (85% of base color brightness).
- **35%**: Light reflection band (100% base color brightness).
- **75%**: Moderately shaded right-facing side (70% base color brightness).
- **100%**: Dark shaded far-right edge (50% base color brightness).

## 5. Transparency and Opacity

To display columns with transparency, the `opacity` option (from `0.1` to `1.0`) is applied:
- Directly on SVG elements via `fill-opacity` and `stroke-opacity` (ensuring borders and fills align seamlessly without visual doubling at boundaries).
- In `<linearGradient>` stop nodes using `stop-opacity` to prevent transparent fills from showing underlying solid background colors.

## 6. Rendering a 3D Continuous Ribbon (Band)

When `shape` is set to `'ribbon'`, the heatmap rows are rendered as continuous 3D bands running along the columns (constant $r$, increasing $c$).

### Geometry and Bridges

A ribbon is constructed by rendering individual 3D prisms for each active cell, and then dynamically bridging the gaps between adjacent active cells:
- **Condition**: A bridge is rendered between cell $(c, r)$ and $(c+1, r)$ if and only if both cells have value $> 0$.
- **Bridge Top Face**: A sloped polygon connecting the right-top edge of cell $c$'s top face to the left-top edge of cell $c+1$'s top face.
  - Vertices: $V_c.\text{front} \to V_c.\text{right} \to V_{c+1}.\text{top} \to V_{c+1}.\text{left}$
- **Bridge Front Face**: A vertical polygon connecting the front-right edge of cell $c$ to the front-left edge of cell $c+1$, extending down to the floor.
  - Vertices: $V_c.\text{front} \to V_{c+1}.\text{left} \to V_{c+1}.\text{left\_floor} \to V_c.\text{front\_floor}$

### Shading and Transitions

- **Top bridge polygon**: Filled with `topColor` of the source cell.
- **Front bridge polygon**: Oriented along the same plane as the right face of the bars. It is shaded with `rightColor` of the source cell (70% brightness) to ensure consistent light source reflections.
- **Interruption**: For zero-value points, no bridge is drawn, causing the ribbon to break naturally.
