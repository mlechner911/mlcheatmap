# Series-Specific Shapes & Group Wrapping

This document outlines two new major features added to the library:
1.  **Series-Specific Shapes (Shape-per-Series)**: Customizing cell shapes (prism, cylinder, ribbon, or flatribbon) on a per-row basis.
2.  **Modular Group Wrapping (`wrapper: 'g'`)**: Rendering heatmaps as SVG `<g>` groups instead of complete `<svg>` files. This allows multiple heatmaps to be combined, translated, and rendered within a single parent SVG viewport.

---

## 1. Series-Specific Shapes

By default, the `shape` parameter applies globally. You can now pass an array or a custom mapper function to define the shape per row (series):

```typescript
// Define shape using a function mapping row index to a shape:
const shapeFn = (r: number) => {
  const shapes: HeatmapShape[] = ['prism', 'cylinder', 'ribbon', 'flatribbon'];
  return shapes[r % shapes.length];
};

const svg = renderHeatmap(data, {
  shape: shapeFn, // custom row-by-row shape mapping
  // ... other options
});
```

> [!NOTE]
> All bounding box calculations in `calculateBounds` and cylinder linear gradient def emissions adapt automatically. Cylinder definitions are only compiled if at least one row utilizes the cylinder geometry.

---

## 2. Group Wrapping & Translation

When combining multiple monthly or calendar layouts into a single larger visualization, standard SVG nesting can cause layout and styling issues. By setting `wrapper: 'g'`, the library returns a `<g>` group:

```typescript
const svgGroup = renderHeatmap(data, {
  wrapper: 'g',
  // ... other options
});
```

*   **Self-Contained Styles**: The returned group includes local `<style>` and `<defs>` definitions as children, ensuring interactive animations and gradient fills work when embedded inside any parent SVG.
*   **Coordinate Offsets**: The generated group tags are marked with metadata attributes (`data-min-x`, `data-min-y`, `data-width`, `data-height`) representing the computed bounds of that specific heatmap segment.

### Isometric Translation Alignment
To align a second heatmap group side-by-side with a first heatmap along the column axis:
$$\Delta x = C \times (\text{gridSize} + \text{gap}) \times \cos(\theta)$$
$$\Delta y = C \times (\text{gridSize} + \text{gap}) \times \sin(\theta)$$

Where $C$ is the column count of the first heatmap, and $\theta$ is the projection angle. Wrap the second heatmap in a `<g transform="translate(dx, dy)">` to align them seamlessly:

```xml
<svg viewBox="0 0 1000 600">
  <!-- May 2026 -->
  <g class="iso-heatmap-group">...</g>
  
  <!-- June 2026 translated to start exactly where May ends -->
  <g transform="translate(346.41, 200.00)">
    <g class="iso-heatmap-group">...</g>
  </g>
</svg>
```
