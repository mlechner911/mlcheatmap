# Render options

`HeatmapGrid.render(options)` takes all of these. `renderHeatmap(points, options)` also requires `cols` and `rows`. A preset can bring its own defaults; options passed to the render call win.

## Layout

| Option | Type | Default | Meaning |
|---|---|---|---|
| `gridSize` | `number` | `16` | Cell size in pixels |
| `gap` | `number` | `2` | Gap between cells in pixels |
| `maxHeight` | `number` | `40` | Height of the tallest column in pixels |
| `padding` | `number` | `20` | Space around the drawing |
| `projectionAngle` | `number` | `30` | Camera slant in degrees, 10 to 60 |
| `title` | `string` | none | Title inside the SVG |
| `wrapper` | `'svg' \| 'g'` | `'svg'` | `'g'` returns a group for composites |

## Shapes

`shape` takes a `HeatmapShape`, one per row as an array, or a function `(row) => HeatmapShape`.

| Shape | Draws |
|---|---|
| `'prism'` | Rectangular blocks |
| `'cylinder'` | Round columns with shading |
| `'ribbon'` | A continuous surface along each row |
| `'flatribbon'` | A floating band of constant thickness along each row |
| `'mesh'` | A continuous terrain across all cells; a `null` corner leaves a hole |

```ts
import { HeatmapGrid } from "mlc-isometric-heatmap";

const grid = new HeatmapGrid(24, 2);
const svg = grid.render({
  shape: (row: number) => (row === 0 ? "flatribbon" : "prism"),
  rowLabels: ["Flat", "Prism"],
});
```

## Color and scale

| Option | Type | Default | Meaning |
|---|---|---|---|
| `colorScheme` | name or `{ empty, steps }` | | `github`, `emerald`, `sky`, `coral`, `amber`, `purple`, `sunset`, `grayscale`, or your own colors |
| `interpolateColors` | `boolean` | `false` | Smooth gradients instead of steps |
| `valueDomain` | `{ min, max }` | data range | Fixed scale for height and color; use the same one to compare grids |
| `zeroColor` | `string` | | Color of cells with value zero |
| `renderFlatZero` | `boolean` | `true` | Draw a flat tile for zero values |
| `opacity` | `number` | `1` | Opacity from 0.1 to 1 |
| `dark` | `boolean` | `false` | Colors for a dark background |

## Labels

| Option | Type | Default | Meaning |
|---|---|---|---|
| `colLabels`, `rowLabels` | `string[]` | from the grid | Axis labels |
| `colLabelInterval`, `rowLabelInterval` | `number \| 'auto'` | `1` | Label every nth cell; `'auto'` drops what would overlap |
| `labelMode` | `'screen' \| 'axis'` | `'screen'` | `'axis'` runs the text along the grid axis |
| `labelPosition` | `'behind' \| 'front'` | `'front'` | Which side of the grid gets the labels |
| `labelFontSize` | `number` | `9` | Font size in pixels |
| `labelLift` | `number` | `0` | Moves labels up in pixels, for example onto a wall |
| `colLabelAngle`, `rowLabelAngle` | `number` | `0` | Rotation in degrees, ignored with `labelMode: 'axis'` |
| `showRowLabels` | `boolean` | `true` | `false` hides labels inherited from a grid |
| `rowLabelStyle` | object | | `show`, `fontSize`, `fontFamily`, `color`, `backgroundColor`, `backgroundOpacity`, `padding`, `borderRadius` |

With `rowLabelAngle: -90`, a `backgroundColor` in `rowLabelStyle` gives vertical pills that do not overlap.

## Floor, axes and walls

| Option | Type | Default | Meaning |
|---|---|---|---|
| `showGrid` | `boolean` | `true` | Floor lines |
| `gridCells` | `'all' \| 'data'` | `'all'` | Floor under every cell, or only under cells with a value |
| `gridColor` | `string` | | Color of the floor lines |
| `showAxis` | `boolean` | `false` | Axis lines and tick marks along the label edges |
| `axisColor`, `axisWidth`, `axisTickLength` | | | Their look |
| `showAxisWalls` | `boolean` | `false` | Translucent walls along both rear edges |
| `axisWallHeight`, `axisWallColor` | | `maxHeight` | Their size and color |
| `heightGrid` | object | none | A back wall with a value scale: `ticks`, `solid`, `wallColor`, `gridColor`, `labelColor` |

## Interaction and rendering

| Option | Type | Default | Meaning |
|---|---|---|---|
| `interactive` | `boolean` | `true` | Tooltips as `<title>` and hover hooks |
| `tooltipFormatter` | `(point) => string` | | Your own tooltip text, wins over the label of a cell; not used for `mesh` patches, which show an average |
| `animated` | `boolean` | `true` | Staggered entrance animation |
| `shading` | `boolean` | | Surface shading |
| `triangulateMesh`, `useSvg2Mesh` | `boolean` | | How a `mesh` is drawn |

The types in `dist/data/types.d.ts` are the reference for anything not listed here.
