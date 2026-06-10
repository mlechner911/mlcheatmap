# 3D Contiguous Surface Mesh Concept

This document outlines the visual design concept, mathematical formulas, shading vector calculations, and rendering algorithms to add a **3D Contiguous Surface Mesh** (`shape: 'mesh'`) rendering option to the library.

---

## 1. Design Concept

A normal heatmap renders discrete shapes (prisms, cylinders) or row-specific curves (ribbons) that are physically separated by a gap. 

A **3D Surface Mesh** treats the entire coordinate grid as a single, contiguous heightfield (terrain). Instead of individual columns, adjacent data coordinates are connected directly by 3D polygons (quadrilaterals). 

| Shape Type | Connectivity | Shading method | Visual appearance |
| :--- | :--- | :--- | :--- |
| **`prism` / `cylinder`** | Discrete elements | Flat face shadows | Separated 3D columns standing on a grid. |
| **`mesh`** | Contiguous vertices | Surface normal lighting | A flowing 3D landscape/terrain. |

```
       (c, r, h0) ----------- (c+1, r, h1)
           /                      \
          /   Contiguous Quad      \
         /        Polygon           \
   (c, r+1, h3) ----------- (c+1, r+1, h2)
```

---

## 2. Projection Mathematics

For a grid of size $C \times R$, we have $C \cdot R$ vertices. For any grid coordinate $(c, r)$, the 3D vertex in coordinate space is:
$$\mathbf{V}_{c,r} = \left( c \cdot G_S, \; r \cdot G_S, \; h_{c,r} \right)$$
where $G_S$ is the `gridSize` and $h_{c,r}$ is the projected height derived from the cell value:
$$h_{c,r} = \frac{\text{value}}{V_{\max}} \cdot H_{\max}$$

Applying the isometric camera projection angle $\theta$, the 2D screen coordinate $\mathbf{P}_{c,r} = (x_{2D}, y_{2D})$ is:
$$x_{2D} = (c \cdot G_S - r \cdot G_S) \cdot \cos(\theta)$$
$$y_{2D} = (c \cdot G_S + r \cdot G_S) \cdot \sin(\theta) - h_{c,r}$$

### Quadrilateral Assembly
For each cell index $c \in [0, C-2]$ and $r \in [0, R-2]$, we assemble a quadrilateral connecting 4 adjacent vertices:
1.  $\mathbf{P}_{0} = \mathbf{P}_{c,r}$ (Back)
2.  $\mathbf{P}_{1} = \mathbf{P}_{c+1,r}$ (Right)
3.  $\mathbf{P}_{2} = \mathbf{P}_{c+1,r+1}$ (Front)
4.  $\mathbf{P}_{3} = \mathbf{P}_{c,r+1}$ (Left)

This quadrilateral is rendered in SVG as a closed polygon:
```html
<polygon points="x0,y0 x1,y1 x2,y2 x3,y3" fill="shadeColor" stroke="strokeColor" />
```

---

## 3. Surface Normal & Lighting Shading

To make the terrain feel three-dimensional, we must apply realistic shading based on the slope of the surface relative to a virtual light source.

### 1. Vector Normals
For a quad with 3D vertices $A, B, C, D$:
*   $\mathbf{A} = (c \cdot G_S, \; r \cdot G_S, \; h_{c,r})$
*   $\mathbf{B} = ((c+1) \cdot G_S, \; r \cdot G_S, \; h_{c+1,r})$
*   $\mathbf{D} = (c \cdot G_S, \; (r+1) \cdot G_S, \; h_{c,r+1})$

We define two coplanar edge vectors starting at $\mathbf{A}$:
$$\vec{\mathbf{U}} = \mathbf{B} - \mathbf{A} = \left( G_S, \; 0, \; h_{c+1,r} - h_{c,r} \right)$$
$$\vec{\mathbf{V}} = \mathbf{D} - \mathbf{A} = \left( 0, \; G_S, \; h_{c,r+1} - h_{c,r} \right)$$

The surface normal vector $\vec{\mathbf{N}} = (N_x, N_y, N_z)$ is the cross product $\vec{\mathbf{U}} \times \vec{\mathbf{V}}$:
$$N_x = U_y V_z - U_z V_y = -G_S \cdot (h_{c+1,r} - h_{c,r})$$
$$N_y = U_z V_x - U_x V_z = -G_S \cdot (h_{c,r+1} - h_{c,r})$$
$$N_z = U_x V_y - U_y V_x = G_S^2$$

Normalize the normal vector to get the unit normal vector $\hat{\mathbf{n}}$:
$$\hat{\mathbf{n}} = \frac{\vec{\mathbf{N}}}{\|\vec{\mathbf{N}}\|}$$

### 2. Lambertian Diffuse Shading
We define a virtual light source direction vector pointing from top-front-left:
$$\vec{\mathbf{L}} = (0.3, \; -0.3, \; 0.9)$$
$$\hat{\mathbf{L}} = \frac{\vec{\mathbf{L}}}{\|\vec{\mathbf{L}}\|}$$

The light intensity factor $I \in [0, 1]$ is the dot product of the unit normal and light vector:
$$I = \max\left(0, \; \hat{\mathbf{n}} \cdot \hat{\mathbf{L}}\right)$$

We compute the shaded color by blending the base color with a shadow factor based on $I$:
$$\text{color}_{\text{shaded}} = \text{shadeHex}\left(\text{baseColor}, \; 0.7 + 0.3 \cdot I\right)$$

---

## 4. Rendering & Depth-Sorting Loop

To prevent depth sorting overlap issues, the quads must be rendered back-to-front. In an isometric grid view, cells with smaller row and column coordinates are further away from the viewer than cells with larger coordinates.

Therefore, the main loop coordinates the mesh rendering sequentially:

```typescript
// 1. Pre-calculate all 2D projected points for the vertices grid
const projectedVertices: Point[][] = [];
for (let c = 0; c < cols; c++) {
  projectedVertices[c] = [];
  for (let r = 0; r < rows; r++) {
    projectedVertices[c][r] = projectCoordinates(c, r, getValue(c, r));
  }
}

// 2. Loop back-to-front to build the quad polygons
const polygons: string[] = [];
for (let r = 0; r < rows - 1; r++) {
  for (let c = 0; c < cols - 1; c++) {
    const p0 = projectedVertices[c][r];       // Back
    const p1 = projectedVertices[c+1][r];     // Right
    const p2 = projectedVertices[c+1][r+1];   // Front
    const p3 = projectedVertices[c][r+1];     // Left

    // Calculate average value for coloring
    const avgVal = (val(c,r) + val(c+1,r) + val(c+1,r+1) + val(c,r+1)) / 4;
    const baseColor = getColorForValue(avgVal, maxAbsValue, theme, negativeTheme, interpolateColors);

    // Calculate normals and shading intensity
    const intensity = calculateShading(c, r, gridHeights);
    const fill = shadeHex(baseColor, 0.7 + 0.3 * intensity);

    polygons.push(`
      <polygon 
        points="${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}"
        fill="${fill}"
        stroke="${shadeHex(fill, 0.9)}"
        stroke-width="0.5"
      />
    `);
  }
}
```

---

## 5. Implementation Complexity Analysis
*   **Difficulty**: **Medium** (~150-200 lines of code).
*   **Performance**: Highly performant. Requires $(C-1)(R-1)$ polygons, which is significantly *less* DOM elements than individual prisms (which require 3 polygons per column, plus floor plates).
*   **Dependencies**: Requires no extra external math libraries; uses standard vector cross products.

---

## 6. Working Examples

The library contains pre-configured presets and generated examples demonstrating 3D surface mesh layouts:

1.  **3D Mesh Terrain Preset (`mesh-terrain`)**:
    *   Generates a $24 \times 24$ rolling hills landscape combining multiple sine/cosine frequencies.
    *   Features a circular "lake" of missing data (using explicit `null` coordinates) demonstrating contiguous quad-surface holes where the mesh is not closed.
    *   Optimized with `gap: 0` and smooth color interpolation (`interpolateColors: true`) for a continuous visual landscape.
2.  **3D Mesh Calendar Month Preset (`month-mesh`)**:
    *   Generates a standard calendar month ($5$ weeks $\times$ $7$ days) of positive-only mock data values.
    *   Injects explicit null values on specific days (e.g. outage days) to display mesh terrain "holes" in a calendar layout.
3.  **Generated SVG Files**:
    *   [mesh_terrain_sunset_hills.svg](file:///mnt/data2tb/mlcheatmap/demo/output/mesh_terrain_sunset_hills.svg): Mesh terrain rendered using the `sunset` scheme with a solid 3D height scale wall.
    *   [mesh_terrain_emerald_hills.svg](file:///mnt/data2tb/mlcheatmap/demo/output/mesh_terrain_emerald_hills.svg): Low-profile mesh terrain rendered using the `emerald` scheme at a $20^\circ$ tilt angle.
    *   [month_mesh_coral_calendar.svg](file:///mnt/data2tb/mlcheatmap/demo/output/month_mesh_coral_calendar.svg): Calendar month rendered as a contiguous mesh surface using the `coral` theme, positive-only values, and explicit null outage days.
