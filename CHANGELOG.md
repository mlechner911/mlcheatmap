# Changelog

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
