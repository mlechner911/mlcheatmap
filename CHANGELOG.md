# Changelog

## 1.4.1 (2026-11-04)

- Fixed bars not lifting on hover while `animated` was on, the default.
- Fixed charts on one page affecting each other: a chart with `animated: false` or `interactive: false` still animated next to a normal one, and flat cells could pick up the 3D animation. Style rules now apply to their own chart only.
- The entrance animation now respects `prefers-reduced-motion`.
- Surfaces (`mesh`, `ribbon`, `flatribbon`) now only brighten on hover, as lifting a part would tear them.
- Smaller SVGs: a 3D year is about 30 % smaller before compression. Cells no longer carry inline styles or default attributes, and charts look the same. Your own CSS on `.iso-face-*` needs no change, `iso-bar` and the `data-*` attributes stay, but a selector like `[class="iso-bar"]` now has to allow further classes.

## 1.4.0 (2026-11-04)

- Added `view: 'flat'`, a standard 2D heatmap from the same data, presets and color options. Only color carries the value there, so `shape`, `maxHeight` and other 3D options have no effect.

## 1.3.3 (2026-11-03)

- Fixed plain dates like `2026-09-01` landing on the previous day, or vanishing from a month, west of UTC.
- Presets now also accept milliseconds since the epoch as `date` and `timestamp`.

## 1.3.2 (2026-11-03)

- Added an agent skill in the standard `SKILL.md` format to the package, replacing `skills.md`.
- Fixed `tooltipFormatter`, which had no effect. It now sets the tooltip of prisms and cylinders and overrides labels.

## 1.3.1 (2026-11-03)

- Fixed preset tooltips naming a fixed unit (`events`, `units`, `contributions`). They now read `<date>: <value>`.

## 1.3.0

- Added the calendar month preset and overlap-free axis labels. `labelPosition` now defaults to `front`.
