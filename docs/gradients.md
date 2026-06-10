# Smooth Color Gradients (Interpolation) Concept

This document presents the visual design concept, mathematical foundations, and code implementation of the **Smooth Color Gradients** (`interpolateColors: true`) option in the isometric 3D heatmap library.

---

## 1. Design Concept

Traditionally, heatmap cells map to discrete steps in a color palette. For example, in an 5-step theme, values are quantized into 5 buckets, and each cell gets a static step color. While clean and distinct, it can look blocky if the dataset has many small variations.

The **Smooth Color Gradients** option allows cell colors to scale continuously. Instead of snapping to the nearest step, colors are interpolated linearly in RGB space between steps, creating a smooth transition from light to dark or across diverging color schemes (e.g., from negative cold colors to positive hot colors).

| Color Mode | Snapping behavior | Visual appearance |
| :--- | :--- | :--- |
| **Discrete (Default)** | Snap to nearest index step | Discrete bands/clusters of uniform color. |
| **Smooth Gradient** | Linear interpolation between adjacent stops | Smooth, continuous transitions across the grid. |

---

## 2. Mathematical Foundation

To interpolate colors continuously, we treat the theme's zero-value color (`empty`) as the starting stop, and append the theme's steps:

$$\mathbf{C} = [ C_{\text{empty}}, C_{\text{step 0}}, C_{\text{step 1}}, \dots, C_{\text{step } N-1} ]$$

This forms a list of $N + 1$ color stops. 

Given an absolute value $v$ and a maximum absolute value $V_{\max}$, we calculate a normalized ratio:

$$r = \min\left(1.0, \frac{|v|}{V_{\max}}\right)$$

We then map the ratio $r \in [0, 1]$ to a float index $i$ in the color stop range:

$$i = r \cdot N$$

Let:
- $i_{\text{low}} = \lfloor i \rfloor$
- $i_{\text{high}} = \min(N, \lceil i \rceil)$
- $f = i - i_{\text{low}}$ (interpolation factor)

The final interpolated color is calculated by blending the R, G, and B channels linearly between $C[i_{\text{low}}]$ and $C[i_{\text{high}}]$:

$$R_{\text{final}} = R_{\text{low}} + (R_{\text{high}} - R_{\text{low}}) \cdot f$$
$$G_{\text{final}} = G_{\text{low}} + (G_{\text{high}} - G_{\text{low}}) \cdot f$$
$$B_{\text{final}} = B_{\text{low}} + (B_{\text{high}} - B_{\text{low}}) \cdot f$$

---

## 3. Implementation Details

### Color Interpolator
The helper function `interpolateColor` parses hex color codes into their R, G, and B components, mixes them, and converts the result back into a hex string:

```typescript
export function interpolateColor(color1: string, color2: string, factor: number): string {
  try {
    const c1 = parseHex(color1);
    const c2 = parseHex(color2);
    const r = c1.r + (c2.r - c1.r) * factor;
    const g = c1.g + (c2.g - c1.g) * factor;
    const b = c1.b + (c2.b - c1.b) * factor;
    return toHex(r, g, b);
  } catch {
    return color1;
  }
}
```

### Color Selector (`getColorForValue`)
If `interpolate` is enabled, `getColorForValue` performs the stop indexing and linear blending:

```typescript
export function getColorForValue(
  value: number,
  maxAbsValue: number,
  theme: CustomColorScheme,
  negativeTheme?: CustomColorScheme,
  interpolate?: boolean
): string {
  if (value === 0) return theme.empty;

  const targetTheme = (value < 0 && negativeTheme) ? negativeTheme : theme;
  const absVal = Math.abs(value);

  if (maxAbsValue <= 0) return targetTheme.steps[0];

  const ratio = Math.min(1, absVal / maxAbsValue);

  if (interpolate) {
    const allColors = [targetTheme.empty, ...targetTheme.steps];
    const floatIdx = ratio * (allColors.length - 1);
    const low = Math.floor(floatIdx);
    const high = Math.min(allColors.length - 1, Math.ceil(floatIdx));
    const factor = floatIdx - low;
    return interpolateColor(allColors[low], allColors[high], factor);
  } else {
    const index = Math.min(
      Math.floor(ratio * targetTheme.steps.length),
      targetTheme.steps.length - 1
    );
    return targetTheme.steps[index];
  }
}
```

---

## 4. Usage

### Library API
To enable continuous color interpolation, set the `interpolateColors` option to `true` in `HeatmapOptions`:

```typescript
import { renderHeatmap } from 'mlc-isometric-heatmap';

const svg = renderHeatmap(data, {
  colorScheme: 'sunset',
  interpolateColors: true // Enables smooth gradients
});
```

### CLI Generator
Pass the `--interpolate-colors` (or `--gradient`) flag to the command line generator:

```bash
node demo/generator.js \
  --preset=sixmonths-split \
  --color=sunset \
  --interpolate-colors \
  --out=output/sixmonths_split_smooth_gradient.svg
```

Or run the preconfigured `24h-gradient` demo preset:

```bash
node demo/generator.js \
  --preset=24h-gradient \
  --color=sky \
  --shape=flatribbon \
  --angle=15 \
  --out=output/24h_gradient_sky_flatribbon.svg
```
