# MLC Isometric Heatmap Library — Documentation Hub

Welcome to the documentation folder for the Isometric 3D SVG Heatmap library. Below you will find comprehensive guides on the mathematical projection models, custom presets, rendering styles, and integration options:

## Core Documentation

1.  [Specification & Math Foundations](file:///mnt/data2tb/mlcheatmap/docs/spec_and_examples.md): The core projection formulas, symmetric bar offsets, depth sorting algorithms, and raw SVG structure details.
2.  [Null Values Rendering Strategy](file:///mnt/data2tb/mlcheatmap/docs/null_values.md): Detailed explanation of how `null` (missing data) behaves versus `0` (flat elements), including discontinuous ribbon behaviors.
3.  [Flat Ribbon Floating Shape](file:///mnt/data2tb/mlcheatmap/docs/flatribbon.md): The mathematics and SVG path construction of the floating 3D ribbon bands (`shape: 'flatribbon'`).
4.  [Height Grid Reference Wall](file:///mnt/data2tb/mlcheatmap/docs/height_grid.md): The configuration, projection, and axis layout of the 3D height scale wall (`heightGrid`).
5.  [6-Month Dual Timeline Preset](file:///mnt/data2tb/mlcheatmap/docs/sixmonths_preset.md): Architecture of the 14-row AM/PM calendar grid structure and its automatic null padding.
6.  [6-Month Split Timeline Preset](file:///mnt/data2tb/mlcheatmap/docs/sixmonths_split_preset.md): Architecture of the single-measurement 6-month timeline with visible monthly gap spacers.
7.  [Series-Specific Shapes & Group Wrapping](file:///mnt/data2tb/mlcheatmap/docs/series_shapes_and_wrapping.md): Details on row-specific shapes (`shapeFn`) and embedding heatmaps as `<g>` elements (`wrapper: 'g'`) translated to form composite SVG canvases.
