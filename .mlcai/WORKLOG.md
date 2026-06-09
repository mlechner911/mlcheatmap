# Worklog - MLC Isometric Heatmap Library

## Session: 2026-06-09
- **Goal**: Create a reusable, high-quality, and highly customizable TypeScript library for rendering isometric 3D heatmaps as SVG (no canvas/PNG). Support grid layouts like 24h (hourly/weekly) and Month calendars.
- **Steps**:
  1. Initialize project directory structure (`package.json`, `tsconfig.json`).
  2. Implement core math and rendering engine (`src/renderer.ts`, `src/types.ts`, `src/color.ts`).
  3. Implement data aggregation and preset helpers (`src/presets.ts`) for 24h, Month, and Year layouts.
  4. Create a demo web application using Vite to preview the heatmap interactive options.
  5. Document integration and architecture in `.mlcai/`.
- **Status**: Completed.
  - Successfully implemented core projection math, shading, preset layouts (24h, Month, Year).
  - Added support for adjustable projection angles (dynamic cos/sin calculation) and customizable axis label positions (behind vs. in front of the grid with automatic text anchor alignments).
  - Fixed front-mode label alignment (centering column labels in all modes, adjusting offsets to avoid optical misalignment under perspective skew).
  - Added `zeroColor` configuration option to override empty/zero cell colors independently of the selected color scheme.
  - Configured library bundling (UMD/ES) and automatic TypeScript definition emission (`dist/`).
  - Implemented interactive, responsive demo page (`index.html`, `src/demo.ts`) styled with Bootstrap 5.3.3.
  - Created a `demo/` subdirectory containing a CLI generator utility (`demo/generator.js`) and a bash execution script (`demo/generate.sh`) to bulk render customizable example SVGs.
  - Validated builds and bash script executions with zero errors or warnings.
  - Added support for 3D cylinder columns (cylinders) with realistic shading effects via linear gradients and SVG paths.
  - Added adjustable bar opacity parameters, mapped to SVG opacity attributes and gradient stops.
  - Fully wired the shape selector and opacity range input into the Vite demo page for live interactive testing.
  - Implemented pure CSS load animations (scaleY(0) to scaleY(1)) with staggered delays proportional to the coordinate grid (col + row) for a highly responsive emerging 3D transition effect.
  - Added support for 3D Continuous Ribbon (shape="ribbon") rendering. It features smooth peaks in the center of active cells, transitioning to adjacent cell heights using Hermite cubic Bezier splines. The curves are automatically flattened when adjacent values are equal, and they slope down to the floor (height 0) at the start/end of active segments.
- **Negative Height Projection (Sinking heatmaps)**:
  - Supported rendering of negative values (e.g. from -20 to 20), allowing bars, cylinders, or ribbons to sink below the grid floor (height < 0) while positive values rise above it (height > 0).
  - Added new diverging negative color schemes (`NEGATIVE_LIGHT_THEMES`, `NEGATIVE_DARK_THEMES`) to provide contrasting colors for negative values, and automatically rotate custom color step hues by 150 degrees as a fallback.
  - Implemented dynamic transform-origins (`top` vs `bottom`) for entries so that positive bars grow upwards and negative bars grow downwards from the floor.
  - Updated demo presets and generators with mock datasets varying from -20 to 20.
  - **0-Level Overlap & Depth Sorting Fix**: Interleaved grid line polygons and 3D elements (bars/cylinders/ribbons) cell-by-cell in the main back-to-front rendering loop. This ensures that the grid floor lines/polygons of front cells correctly layer on top of sinking bodies from the cells behind them, while any cell's bar covers its own grid lines on top of the floor. This eliminates depth-sorting violations when mixing positive, negative, and zero values.
  - **Negative Ribbon Face and Depth Sorting Fix**: Added conditional rendering logic for 3D continuous ribbons (`shape="ribbon"`). For positive heights (`h >= 0`), we draw the top face first and then the front wall on top (since the front wall is closer to the viewer). For negative heights (`h < 0`, representing a valley/trench), the back wall (furthest away) is visible and must be drawn first, followed by the top face (valley floor) on top of it. The front wall is hidden from view and is omitted.
- **Architectural Refactoring (Datenmodell & Representation separation)**:
  - **Introduced HeatmapGrid Model**: Created [src/grid.ts](file:///mnt/data2tb/mlcheatmap/src/grid.ts) featuring a `HeatmapGrid` class representing the `cols` x `rows` coordinate grid. It provides clean OOP methods: `setCell`, `getCell`, `fill`, and `render`.
  - **Preset Updates**: Modified [src/presets.ts](file:///mnt/data2tb/mlcheatmap/src/presets.ts) so that preset generators (24h, Month, Year) return `HeatmapGrid` instances directly instead of raw objects.
  - **Backwards Compatibility**: Added a `data` getter on the `HeatmapGrid` model to transparently map to `getData()`, allowing existing preset invocations (e.g. `.data`) to work unmodified.
  - **Modularity & File Splitting**: Extracted the shape-rendering math out of [src/renderer.ts](file:///mnt/data2tb/mlcheatmap/src/renderer.ts) into smaller, focused sub-modules: [prism.ts](file:///mnt/data2tb/mlcheatmap/src/renderer/prism.ts), [cylinder.ts](file:///mnt/data2tb/mlcheatmap/src/renderer/cylinder.ts), and [ribbon.ts](file:///mnt/data2tb/mlcheatmap/src/renderer/ribbon.ts). This makes files much smaller and splits rendering representation from model structures.
- **Null Value Concept & Representation**:
  - Defined the concept distinguishing `null` (missing/no-data) cells from `zero` (0) values. Zeroes render as flat/colored cells while `null` values render as completely transparent (no 3D shapes, no tooltips, only grid floor lines are drawn).
  - Modified data types in `HeatmapDataPoint` to allow `value: number | null`.
  - Updated `src/renderer.ts` to skip normalization bounds tracking, height bounds, and rendering for cells where `value === null`.
  - Refactored `src/renderer/ribbon.ts` to support discontinuous ribbon segments. If adjacent ribbon cells are `null`, the ribbon slopes down smoothly to zero height and draws a 3D cap at the boundary rather than ending in mid-air.
  - Implemented a test generator script `scratch_test_nulls.js` and produced corresponding test SVGs illustrating the clean layout across all three rendering shapes (including the new 8x8 preset).
  - Added a new `nullsExample8x8()` preset to `presets` in `src/presets.ts` representing an 8x8 grid with mixed positive, negative, zero, and null values.
  - Wired the "8x8 Null Test" preset layout into `index.html` and `src/demo.ts` to show visual comparisons interactively in the web demo application.
  - Documented the design decisions and updated the artifact `null_value_concept.md` with the new 8x8 visual examples.
- **Directory Restructuring & Code Splitting**:
  - Restructured the project by creating two specialized sub-directories: `src/data/` (for models/presets/types) and `src/render/` (for rendering engines, shape implementations, colors, labels, and geometry helpers).
  - Split the main `src/renderer.ts` (originally containing all layout bounds, labeling, grid projection lines, and SVG packaging logic) into small, single-responsibility modules:
    *   `src/render/geometry.ts`: Projection and intersection calculations.
    *   `src/render/bounds.ts`: Coordinate bounding box tracking.
    *   `src/render/labels.ts`: Multi-position row and column labels formatting.
    *   `src/render/renderer.ts`: Main layout coordinator.
  - Moved files and updated all module imports across the codebase and Vite configurations.
  - Successfully verified compile checks and committed the structural layout in Git.
- **Flat Ribbon Shape Variant (`shape="flatribbon"`)**:
  - Implemented a floating 3D band rendering mode that follows the data spline at a constant thickness ($T = \max(4, \text{maxHeight} \times 0.1)$) instead of extending down to the $y=0$ ground floor.
  - Calculated bottom spline coordinate offsets by translating control points vertically by the thickness value.
  - Closed front wall paths using a reverse Bezier curve along the bottom control points to construct a complete 3D tube structure.
  - Bypassed ground-level floor plates for negative values in the flatribbon style since it is a floating shape.
  - Updated bounds calculation in `src/render/bounds.ts` to accommodate the parallel bottom spline coordinates.
  - Wired the new option into the Vite web demo (`index.html`, `src/demo.ts`) and generator CLI scripts.
  - Cleaned up obsolete bounds functions (`calculateBoundsOLd`) to reduce complexity.
  - Compiled, tested, and checked in all source updates in Git.
- **Height Grid Scale Reference Wall (`heightGrid`)**:
  - Added option to render a vertical reference wall stood along the back-left grid boundary (from (0,0) to (0,rows)).
  - Supported optional solid filled backdrop (`solid: true`) with customizable colors, layering behind the 3D columns.
  - Implemented vertical dashed grid guidelines matching floor row grid intersections, folding up the wall.
  - Rendered horizontal value grid lines dividing the vertical range, calculated dynamically based on data bounds (including negative ranges).
  - Placed end-aligned numerical value labels on the left of each tick scale.
  - Updated bounds calculation in `src/render/bounds.ts` to include the wall and label layout to prevent clipping in the SVG viewBox.
  - Wired the new option into the Vite web demo (`index.html`, `src/demo.ts`) and CLI generator (`demo/generator.js`).
  - Compiled, generated fresh examples, and checked in all changes in Git.
- **Interactive HTML Details Card (Event Delegation)**:
  - Added a beautifully styled card in `index.html` below the preview container for showing hovered coordinate and value details.
  - Implemented event delegation in `src/demo.ts` by listening to `mouseover` and `mouseout` events on the preview container.
  - Extracted metadata directly from the SVG elements' attributes (`data-col`, `data-row`, `data-value`), which are generated automatically by the library.
  - Kept the native `<title>` tags optional (disabling them using `interactive: false` saves significant SVG payload/size, while custom JS tools can still read the `data-` attributes).
  - Committed all additions in Git.




