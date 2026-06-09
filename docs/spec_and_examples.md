# Specification & SVG Examples: Building an Isometric Heatmap

This document serves as a complete reference guide and specification for building a fully-typed isometric 3D heatmap SVG generator in TypeScript.

---

## 1. Mathematical Concepts

To project a 3D grid cell coordinate $(col, row)$ with value height $H$ onto a 2D screen coordinate $(X, Y)$ within an SVG canvas, we use isometric projection equations. 

We can define an adjustable projection angle $\theta$ in degrees (typically between 10 and 60 degrees, default is 30). We calculate the angle constants dynamically:
$$\text{rad} = \theta \cdot \frac{\pi}{180}$$
$$c_{\theta} = \cos(\text{rad})$$
$$s_{\theta} = \sin(\text{rad})$$

### Isometric Projection Equations
For a grid spacing $S_{\text{grid}}$ and height $H$, the base center-point of the bar top face is projected as:
$$X_0 = (col - row) \cdot S_{\text{grid}} \cdot c_{\theta}$$
$$Y_0 = (col + row) \cdot S_{\text{grid}} \cdot s_{\theta} - H$$

### Symmetrical Spacing (Bar Centering)
To add a gap between cells, we define a bar size $S_{\text{bar}} < S_{\text{grid}}$. The centering offset is:
$$\text{offset} = \frac{S_{\text{grid}} - S_{\text{bar}}}{2}$$

Applied to the vertices, the 2D coordinate equations of the four top-face corners are:
*   **Back ($P_0$)**: 
    $$X_0 = (col - row) \cdot S_{\text{grid}} \cdot c_{\theta}$$
    $$Y_0 = ((col + row) \cdot S_{\text{grid}} + 2 \cdot \text{offset}) \cdot s_{\theta} - H$$
*   **Left ($P_1$)**:
    $$X_1 = X_0 - S_{\text{bar}} \cdot c_{\theta}$$
    $$Y_1 = Y_0 + S_{\text{bar}} \cdot s_{\theta}$$
*   **Front ($P_2$)**:
    $$X_2 = X_0$$
    $$Y_2 = Y_0 + 2 \cdot S_{\text{bar}} \cdot s_{\theta}$$
*   **Right ($P_3$)**:
    $$X_3 = X_0 + S_{\text{bar}} \cdot c_{\theta}$$
    $$Y_3 = Y_0 + S_{\text{bar}} \cdot s_{\theta}$$

For the base points (ground level), we simply add the height $H$ to the $Y$ coordinates: $Y_{\text{bottom}} = Y_{\text{top}} + H$.

---

## 2. SVG XML Code Specification

### Floor Grid Lines
The grid background consists of lines drawn on the floor ($H=0$).
```xml
<!-- Grid line along the row axis at column c -->
<line x1="13.86" y1="8.00" x2="-55.43" y2="48.00" stroke="#e1e4e8" stroke-width="0.5" />
<!-- Grid line along the col axis at row r -->
<line x1="-13.86" y1="8.00" x2="83.14" y2="64.00" stroke="#e1e4e8" stroke-width="0.5" />
```

### Flat Cell (Value = 0)
For zero values, only the top face is drawn as a flat rhombus.
```xml
<g class="iso-bar" data-col="0" data-row="0" data-value="0">
  <title>June 1, 2026: 0 points</title>
  <polygon points="0.00,0.00 -12.12,7.00 0.00,14.00 12.12,7.00" fill="#ebedf0" stroke="#ebedf0" stroke-width="0.3" stroke-linejoin="round" />
</g>
```

### 3D Bar (Value > 0)
For non-zero values, the bar has 3 faces drawn in order: left face, right face, top face.
```xml
<g class="iso-bar" data-col="0" data-row="2" data-value="12">
  <title>2026-06-15 — 12 points</title>
  <!-- Left Face (darker shade: multiplier 0.85) -->
  <polygon class="iso-face-left" points="-39.84,-2.67 -27.71,4.33 -27.71,31.00 -39.84,24.00" fill="#d54646" stroke="#d54646" stroke-width="0.3" stroke-linejoin="round" />
  <!-- Right Face (even darker shade: multiplier 0.70) -->
  <polygon class="iso-face-right" points="-27.71,4.33 -15.59,-2.67 -15.59,24.00 -27.71,31.00" fill="#af3939" stroke="#af3939" stroke-width="0.3" stroke-linejoin="round" />
  <!-- Top Face (base color: multiplier 1.0) -->
  <polygon class="iso-face-top" points="-27.71,-9.67 -39.84,-2.67 -27.71,4.33 -15.59,-2.67" fill="#fa5252" stroke="#fa5252" stroke-width="0.3" stroke-linejoin="round" />
</g>
```

---

## 3. TypeScript Interfaces

Use these TypeScript type contracts to ensure your library remains fully typed:

```typescript
export interface HeatmapDataPoint {
  col: number;
  row: number;
  value: number | null;
  label?: string; // Mouse-over tooltip text
  color?: string; // Override specific color
}

export type ColorSchemePreset =
  | 'github'
  | 'emerald'
  | 'sky'
  | 'coral'
  | 'amber'
  | 'purple'
  | 'sunset'
  | 'grayscale';

export interface CustomColorScheme {
  empty: string;
  steps: string[];
}

export interface HeatmapOptions {
  cols: number;
  rows: number;
  gridSize?: number;       // Spacing (default: 16)
  gap?: number;            // Cell spacing (default: 2)
  maxHeight?: number;      // Height scale of highest bar (default: 40)
  colorScheme?: ColorSchemePreset | CustomColorScheme;
  showGrid?: boolean;
  gridColor?: string;
  colLabels?: string[];
  colLabelInterval?: number;
  rowLabels?: string[];
  rowLabelInterval?: number;
  interactive?: boolean;   // Enable mouse hover lifting & tooltips
  dark?: boolean;          // Use dark mode theme palettes
  padding?: number;        // Canvas margin (default: 20)
  title?: string;
  projectionAngle?: number; // Tilt angle in degrees (default: 30)
  labelPosition?: 'behind' | 'front'; // Place labels at the back or front of grid (default: 'behind')
  zeroColor?: string;      // Custom color override for zero value cells
}
```

---

## 4. Depth Sorting & viewBox Calculation

To guarantee a clean layout, you must enforce two constraints:

1.  **Depth Sorting (Back-to-Front)**:
    Since rows run back-right to front-left, and columns run back-left to front-right, $(0,0)$ is the furthest point. Rendering using double loops:
    ```typescript
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        // Draw cell (c, r)
      }
    }
    ```
    This ensures that columns to the right and rows to the bottom automatically layer on top, solving overlapping bugs.

2.  **viewBox Bounds calculation**:
    Do not force the user to guess SVG dimensions. Instead, loop through all generated coordinates (grid lines, cell corners, labels) and track the bounds:
    ```typescript
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    function track(x: number, y: number) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    // Calculate final viewBox parameters
    const width = (maxX - minX) + 2 * padding;
    const height = (maxY - minY) + 2 * padding;
    const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;
    ```

---

## 5. Rendering 3D Cylinders (Columns)

For a cylindrical rendering format instead of rectangular prisms, each cell is drawn using a horizontal ellipse for the top face and a curved path for the side mantle.

### Ellipse Geometry
The top-center coordinate of the cylinder is:
$$X_c = X_0$$
$$Y_c = Y_0 + S_{\text{bar}} \cdot \sin(\theta)$$

The semi-major axis (horizontal radius $r_x$) and semi-minor axis (vertical radius $r_y$) are:
$$r_x = \frac{S_{\text{bar}}}{2} \cdot \cos(\theta)$$
$$r_y = \frac{S_{\text{bar}}}{2} \cdot \sin(\theta)$$

### Cylinder SVG Elements
*   **Flat Circle (Value = 0)**:
  ```xml
  <ellipse cx="12.12" cy="15.00" rx="6.93" ry="4.00" fill="#ebedf0" stroke="#ebedf0" stroke-width="0.3" />
  ```
*   **3D Cylinder (Value > 0)**:
  Using a dynamic `<linearGradient>` for 3D curved shading and stop-opacity for transparency:
  ```xml
  <linearGradient id="cyl-grad-ef4444" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#cc3a3a" stop-opacity="0.9" />
    <stop offset="35%" stop-color="#ef4444" stop-opacity="0.9" />
    <stop offset="75%" stop-color="#a73030" stop-opacity="0.9" />
    <stop offset="100%" stop-color="#782222" stop-opacity="0.9" />
  </linearGradient>

  <!-- Side mantle -->
  <path d="M 5.19,11.00 L 5.19,37.00 A 6.93,4.00 0 0,0 19.05,37.00 L 19.05,11.00 A 6.93,4.00 0 0,1 5.19,11.00 Z" fill="url(#cyl-grad-ef4444)" stroke="#a73030" stroke-width="0.3" />
  <!-- Top Face -->
  <ellipse cx="12.12" cy="11.00" rx="6.93" ry="4.00" fill="#ef4444" stroke="#ef4444" stroke-width="0.3" fill-opacity="0.9" stroke-opacity="0.9" />
  ```
