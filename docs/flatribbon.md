# Flat Ribbon (Floating Band) Concept

This document presents the visual design concept, mathematical foundations, and code implementation of the **Flat Ribbon** (`shape: 'flatribbon'`) shape variant in the isometric 3D heatmap library.

---

## 1. Design Concept

A normal `ribbon` shape renders as a continuous 3D surface starting at the data spline and extending all the way down to the `y=0` ground axis. While this is useful, it can look heavy and resemble a solid block.

The **Flat Ribbon** option introduces a lightweight, floating band of constant thickness running parallel to the data spline. It simulates a ribbon hovering in 3D space:

| Shape Type | Bottom boundary | 3D visual appearance |
| :--- | :--- | :--- |
| **`ribbon`** | Flat ground plane ($y = 0$) | Solid wall extending from values down to grid floor. |
| **`flatribbon`** | Parallel offset curve ($y = \text{top} - \text{thickness}$) | Floating 3D strip/band with a constant height profile. |

---

## 2. Geometry & Parallel Bezier Math

In our isometric projection, a ribbon segment consists of spline curves generated with Hermite/cubic Bezier interpolation. For a flat ribbon of constant thickness $T$:
1. The **top surface** follows the data spline.
2. The **bottom surface** must curve exactly parallel to the top spline.

Since a cubic Bezier curve is defined by its control points $P_0, P_1, P_2, P_3$, translating all control points vertically by a constant offset vector $(0, -T)$ results in a translated Bezier curve:
$$B_{\text{bottom}}(t) = B_{\text{top}}(t) - T$$

This guarantees a mathematically perfect parallel band of constant vertical thickness at all points along the segment.

### Thickness Calculation
The band thickness is automatically computed relative to the maximum height to scale nicely, with a minimum fallback:
```typescript
const thickness = Math.max(4, maxHeight * 0.1);
```

---

## 3. SVG Path Construction

The front wall of the ribbon segment is rendered as a closed shape connecting the top and bottom paths. 

```
   (pts0.front)  top curve (Bezier)   (ptsMid.front)
         o~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~o
         |                                  |
         |  front wall                      |
         |                                  |
         o~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~o
   (pts0Bottom.front)                  (ptsMidBottom.front)
                 bottom curve (Bezier)
```

Instead of closing with a straight line on the floor ($y=0$), the path runs:
1. Start at `pts0Bottom.front`
2. Draw a vertical line up to `pts0.front`
3. Draw the top Bezier spline to `ptsMid.front`
4. Draw a vertical line down to `ptsMidBottom.front`
5. Draw the **reverse** Bezier spline along the bottom control points back to `pts0Bottom.front`
6. Close the path (`Z`)

This creates a fully enclosed 3D envelope.
