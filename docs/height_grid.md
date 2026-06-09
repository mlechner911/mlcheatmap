# Height Grid Scale Reference Wall Concept

This document presents the visual design concept, mathematical foundations, and code implementation of the **Height Grid Scale Reference Wall** (`heightGrid`) feature in the isometric 3D heatmap library.

---

## 1. Design Philosophy

Isometric 3D heatmaps provide an engaging perspective of data, but comparing bar/column heights visually can sometimes be challenging without a scale. 

The **Height Grid Wall** solves this by rendering a vertical backdrop along the back-left edge of the grid. It acts as an axis panel showing height ticks and labels:

- **Solid Wall Background**: A semi-transparent filled polygon behind the columns. This acts as a visual anchor and helps isolate the front-facing bars.
- **Wireframe Grid Lines**: Horizontal and vertical grid lines drawn on the wall itself. The vertical lines align with the grid rows (folding up from the floor), while the horizontal lines represent value increments.
- **Scale Labels**: Floating numbers rendered to the left of the wall, showing the exact data value represented by each tick.

---

## 2. Geometry & Projection Math

The wall sits along the back-left boundary of the grid ($c = 0$, from $r = 0$ to $r = \text{rows}$).

For any row $r$ on the floor, the base coordinate is:
$$P_{\text{floor}}(r) = \text{getGridIntersection}(0, r)$$

Standing vertically above/below the floor, the coordinate at a given height $h$ is:
$$P_{\text{wall}}(r, h) = (x_r, y_r - h)$$

### Wall Corners
The wall polygon is defined by:
- Top-Right: $P_{\text{wall}}(0, \text{heightMax})$
- Top-Left: $P_{\text{wall}}(\text{rows}, \text{heightMax})$
- Bottom-Left: $P_{\text{wall}}(\text{rows}, \text{heightMin})$
- Bottom-Right: $P_{\text{wall}}(0, \text{heightMin})$

where $\text{heightMin}$ is $-\text{maxHeight}$ if the dataset contains negative values, or $0$ otherwise; and $\text{heightMax}$ is $\text{maxHeight}$.

### Grid Lines
- **Vertical Lines**: Drawn at each integer row $r \in [0, \text{rows}]$ from $P_{\text{wall}}(r, \text{heightMin})$ to $P_{\text{wall}}(r, \text{heightMax})$.
- **Horizontal Lines**: Drawn at divided heights $h$ from $P_{\text{wall}}(0, h)$ to $P_{\text{wall}}(\text{rows}, h)$.

---

## 3. Configuration options

The height grid is fully customizable under the `heightGrid` option in `HeatmapOptions`:

```typescript
export interface HeightGridOptions {
  ticks: number;         // Number of horizontal scale lines/ticks
  solid?: boolean;       // Render a solid filled background wall (default: true)
  wallColor?: string;    // Custom background fill color for the wall
  gridColor?: string;    // Custom stroke color for the wall grid lines
  labelColor?: string;   // Custom color for the tick value texts
}
```
