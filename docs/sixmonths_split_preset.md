# 6-Month Split Timeline (1 Value/Day with Monthly Spacers)

This document presents the layout design and geometry offsets of the **6-Month Split Timeline** (`preset: 'sixmonths-split'`) preset in the isometric 3D heatmap library.

---

## 1. Design Philosophy

While the standard 6-month dual timeline represents two measurements per day as a continuous block, this layout offers a variant with **only 1 value per day** and inserts a **visible spacer/gap** between each calendar month. 

Rendering months as separate, floating 3D blocks side-by-side on the same isometric plane:
- Highlights calendar month transitions visually.
- Simplifies comparison across the 6-month duration.
- Reduces clutter, as each day represents a single metric.

---

## 2. Geometry Offsets & Modular Compilation

To render this combined SVG:
1.  Six months (Jan to Jun) are aggregated individually using `presets.aggregateMonth`.
2.  Each month is rendered as a separate `<g>` element using the `wrapper: 'g'` configuration.
3.  Each month block is offset along the column axis by a cumulative translation transform `translate(dx, dy)` using:
    $$dx = (C_{\text{cumulative}} + i \cdot \text{spacer}) \cdot (\text{gridSize} + \text{gap}) \cdot \cos(\theta)$$
    $$dy = (C_{\text{cumulative}} + i \cdot \text{spacer}) \cdot (\text{gridSize} + \text{gap}) \cdot \sin(\theta)$$
    
    where $C_{\text{cumulative}}$ is the total columns of preceding months, $i$ is the month index ($0$ to $5$), and $\text{spacer}$ is the column spacer width (set to $1$ column).
4.  **Clean Labels**: Only the first month (January) draws the row labels (Mon-Sun) to keep the left-hand axis clean.
5.  All month groups are nested inside a single parent `<svg>` with a dynamically calculated overall viewBox size to avoid clipping.

---

## 3. Visual Demonstration

A generated example of this layout is saved as a vector SVG file:
*   **Artifact File**: [sixmonths_split_sunset.svg](file:///home/mlc/.gemini/antigravity-cli/brain/c5d664b9-cf6f-4fa1-aebb-3042193c163a/sixmonths_split_sunset.svg)
*   **Configuration**:
    *   **Preset**: `sixmonths-split` (Jan – Jun 2026)
    *   **Theme**: Sunset (diverging warm gradients)
    *   **Shape**: Rectangular Prism (`prism`)
    *   **Angle**: 30°
