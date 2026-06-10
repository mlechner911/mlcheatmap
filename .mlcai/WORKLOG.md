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
- **Row Label Overlap Prevention**:
  - Automatically forced row labels (series annotations) to display on the right-hand side of the grid (at $c = \text{cols} + 0.5$) whenever the height grid wall is active.
  - Aligned boundary checks in `src/render/bounds.ts` to follow the right-hand placement of row labels under active height grid.
  - Committed the alignment corrections.
- **3D Depth Overlay for Behind Labels**:
  - Split rendering elements into background elements (rendered before the 3D bars) and foreground elements (rendered after the 3D bars).
  - Placed 'behind' axis labels into the background layer, so that the 3D columns/bars naturally overlap and cover them in the 3D view.
  - Kept 'front' axis labels in the foreground layer so they draw on top of everything.
  - Committed the layering improvements.
- **6-Month Dual Timeline Preset**:
  - Implemented `aggregateSixMonthsDouble` preset in `src/data/presets.ts` mapping days across a 6-month period to columns (weeks) and rows (7 days * 2 measurements/day, i.e., 14 rows).
  - Explicitly initialized out-of-bounds padding days at the beginning and end of the calendar grid to `null` so they render as transparent space.
  - Added mock data generation and live preview options for "6-Month Dual" in the Vite browser demo (`src/demo.ts`, `index.html`).
  - Added the `sixmonths` preset to `demo/generator.js` and a corresponding test generation script in `demo/generate.sh`.
  - Created a test artifact `sixmonths_double_sunset_height_grid.svg` displaying a beautiful isometric projection of the 6-month double-measurement chart.
- **Series-Specific Shapes & Group Wrapping**:
  - Added support for shape-per-series (row-specific shapes) in `HeatmapOptions.shape` which can now accept a single string, an array, or a custom mapper function `(row: number) => HeatmapShape`.
  - Updated bounding box computations in `src/render/bounds.ts` and cell rendering loops in `src/render/renderer.ts` to compute shapes dynamically per row.
  - Implemented a `wrapper` option (`'svg' | 'g'`, defaulting to `'svg'`) in `HeatmapOptions` to render the heatmap as a `<g>` group with local styles/defs rather than a full `<svg>` document.
  - Designed a combined multi-month preview demo in `src/demo.ts` rendering May and June 2026 as separate `<g>` elements, using translation transforms to align them side-by-side in isometric 3D space.
  - Added a "Mixed Shapes" tab to `index.html` and a corresponding generator configuration in `demo/generator.js`.
- **Smooth Color Gradients (Interpolation)**:
  - Added `interpolateColors` option to `HeatmapOptions` in `src/data/types.ts`.
  - Implemented hex-based R/G/B linear color interpolation helper `interpolateColor` in `src/render/color.ts`.
  - Updated `getColorForValue` to construct a combined stop sequence `[empty, ...steps]` and compute linear blends between bounding steps when `interpolateColors` is enabled.
  - Plumbed the option through the SVG renderer (`src/render/renderer.ts`), CLI generator (`demo/generator.js`), and Vite browser demo controls (`index.html`, `src/demo.ts`).
  - Added Bash Example 30 to `demo/generate.sh` to generate a 6-month split timeline showing smooth gradients in `sixmonths_split_smooth_gradient.svg`.
  - Added a new `24h-gradient` preset to `demo/generator.js`, `src/demo.ts`, and `index.html`. It presents the same 24-hour dataset (values 0-10) using 4 separate series/rows (Flat Ribbon, Continuous Ribbon, Cylinder, and Prism) separated by empty spacer rows for clear legibility under low perspective angles.
  - Added Bash Example 31 to `demo/generate.sh` generating `24h_gradient_sky_flatribbon.svg` to showcase a smooth color gradient across all 4 shapes simultaneously.
  - Created a detailed documentation file `docs/gradients.md` detailing the concept, mathematical formulas, and code snippets.
- **SVG/XML Title Well-Formedness Fix**:
  - Replaced unescaped ampersands (`&`) in the multi-month combined SVG titles with `&amp;` in both `demo/generator.js` and `src/demo.ts`.
  - Verified XML syntax correctness of generated SVGs using `xmllint`.
- **License and Attribution Setup**:
  - Created root `LICENSE` file for the MIT License, attributing the copyright to Michael Lechner.
  - Automatically prepended copyright/license header blocks to all `.ts` source files.
  - Embedded pre-rendered example SVGs (`24h_gradient_sky_flatribbon.svg`, `sixmonths_split_smooth_gradient.svg`, and `24h_double_row_timeline.svg`) inline inside the main project `README.md`.
  - Created a dedicated `examples_gallery.md` artifact displaying all three SVGs inline with their detailed descriptions.
- **Library Modularization & Separation of Demo Utilities**:
  - Relocated the web demo source file from `src/demo.ts` to `demo/demo.ts` and updated `index.html` to load it. This excludes the demo file from TSC core compilation.
  - Split the calendar aggregation presets out of the core library bundle by moving `src/data/presets.ts` to `src/presets.ts` and removing it from the main `src/index.ts` entry point.
  - Created a separate configuration `vite.presets.config.ts` to compile the presets helper module to its own bundle files: `dist/presets.umd.js` and `dist/presets.es.js`.
  - Updated `demo/generator.js` to load the presets from the split bundle.
- **AI Coding Assistant Skills Manual (skills.md)**:
  - Created a root-level `skills.md` file designed as a technical quick-start and API guide for LLMs/AI coding assistants. It covers types, configurations, math equations, module splitting, and advanced rendering recipes (composite canvases, mixed shapes, custom color interpolation).
- **Subpath Package Exports Setup**:
  - Configured `"exports"` in `package.json` to formally expose separate entry points: `mlc-isometric-heatmap` for the core library and `mlc-isometric-heatmap/presets` for the optional calendar aggregators.
  - Enables CDN users to load `dist/index.umd.js` and `dist/presets.umd.js` separately, keeping the initial footprint minimal.
- **CDN Documentation Update**:
  - Updated the main `README.md` to document browser-native ES module imports and traditional UMD global script integrations via unpkg.
  - Replaced all code blocks in `README.md` to showcase the ES6 module syntax as the primary default and corrected import subpaths for split presets.
- **AI Integration Guide (README)**:
  - Added an "AI-Assisted Development" section to `README.md`, guiding developers on how to prompt AI assistants (such as Claude, Cursor, or Antigravity/Agy) to read `skills.md` for context-aware code generation.
- **German README & License Attribution (README.de.md)**:
  - Created a full German translation `README.de.md` linking back to the English version.
  - Linked `README.de.md` at the top of the main `README.md`.
  - Expanded the License section in both READMEs to explicitly declare the **MIT License** and copyright attribution to **Michael Lechner**.
- **3D Surface Mesh Implementation (`feature/3d-mesh` branch)**:
  - Switched to the dedicated `feature/3d-mesh` branch.
  - Created a conceptual design document [3d_mesh_concept.md](file:///mnt/data2tb/mlcheatmap/docs/3d_mesh_concept.md) detailing the vector math, surface normals, lighting shading formulas, and back-to-front rendering loop for contiguous 3D terrain representation.
  - Added `'mesh'` to the `HeatmapShape` type in [types.ts](file:///mnt/data2tb/mlcheatmap/src/data/types.ts).
  - Added `'mesh'` bounds calculations inside `calculateBounds` in [bounds.ts](file:///mnt/data2tb/mlcheatmap/src/render/bounds.ts) to adjust the SVG viewport.
  - Created [mesh.ts](file:///mnt/data2tb/mlcheatmap/src/render/mesh.ts) containing vertex projection (`projectVertex`) and quad rendering (`renderMeshQuad`) featuring cross-product surface normals and dot-product Lambertian shading.
  - Integrated quad rendering inside the main back-to-front drawing loop of [renderer.ts](file:///mnt/data2tb/mlcheatmap/src/render/renderer.ts) by invoking `renderMeshQuad` and wrapping the resulting polygon inside a `<g class="iso-bar">` group to inherit interactive hover effects.
  - Handled `null` values by skipping rendering of any quad where one or more of its 4 corner vertices is `null`, leaving clean holes in the terrain.
  - Added `'mesh'` option to the shape select dropdown in [index.html](file:///mnt/data2tb/mlcheatmap/index.html).
  - Implemented a cool rolling hills landscape preset (`mesh-terrain`) combining multiple sine/cosine frequencies with a circular "lake" of missing data (`null` values) in [demo.ts](file:///mnt/data2tb/mlcheatmap/demo/demo.ts) and [generator.js](file:///mnt/data2tb/mlcheatmap/demo/generator.js).
  - Added Example 32 and Example 33 to [generate.sh](file:///mnt/data2tb/mlcheatmap/demo/generate.sh) to generate static SVGs showcasing the mesh shape.
  - Generated and copied `mesh_terrain_sunset_hills.svg` and `mesh_terrain_emerald_hills.svg` to the artifacts directory.
  - Updated [examples_gallery.md](file:///home/mlc/.gemini/antigravity-cli/brain/c5d664b9-cf6f-4fa1-aebb-3042193c163a/examples_gallery.md) to showcase the new mesh terrains.
  - Documented the new shape API and math constraints in [skills.md](file:///mnt/data2tb/mlcheatmap/skills.md), [README.md](file:///mnt/data2tb/mlcheatmap/README.md), and [README.de.md](file:///mnt/data2tb/mlcheatmap/README.de.md).
  - Verified compilation of all library targets and generated assets.
  - Added new `month-mesh` preset and Example 34 to generate a $5 \times 7$ calendar month rendered as a contiguous 3D surface mesh with the `coral` theme. The dataset features positive-only values and explicit `null` data outage days, creating clean empty holes in the calendar grid terrain. Added the tab button in `index.html` and defaults/rendering logic in `demo/demo.ts` and `demo/generator.js`. Compiled and saved `month_mesh_coral_calendar.svg` in artifacts and documented it.










