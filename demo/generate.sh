#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Resolve scripts directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$SCRIPT_DIR/output"

echo "=== Isometric SVG Heatmap Example Generator ==="

# 1. Ensure the library is compiled
if [ ! -f "$PARENT_DIR/dist/index.umd.js" ]; then
    echo "Library build not found. Compiling library first..."
    cd "$PARENT_DIR"
    npm run build
    cd "$SCRIPT_DIR"
fi

# 2. Clear output directory
echo "Cleaning output directory: $OUTPUT_DIR..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# 3. Generate examples
echo "Generating example heatmaps..."

# Example 1: 24h Grid, Sky Theme, Front Labels, 45-degree angle
node "$SCRIPT_DIR/generator.js" \
  --preset=24h \
  --color=sky \
  --angle=45 \
  --label-pos=front \
  --out="$OUTPUT_DIR/24h_sky_front_45deg.svg"

# Example 2: Monthly Grid, Coral Theme, Behind Labels, Default 30-degree angle
node "$SCRIPT_DIR/generator.js" \
  --preset=month \
  --color=coral \
  --angle=30 \
  --label-pos=behind \
  --out="$OUTPUT_DIR/month_coral_behind.svg"

# Example 3: Yearly Grid, Emerald Theme, Custom Green Zero-Value Color, 20-degree angle
node "$SCRIPT_DIR/generator.js" \
  --preset=year \
  --color=sunset \
  --zero-color="#0e4429" \
  --angle=20 \
  --label-pos=behind \
  --out="$OUTPUT_DIR/year_sunset_greenzero_20deg.svg"

# Example 4: Yearly Grid, Grayscale Theme, Front Labels, 35-degree angle
node "$SCRIPT_DIR/generator.js" \
  --preset=year \
  --color=grayscale \
  --angle=35 \
  --label-pos=front \
  --out="$OUTPUT_DIR/year_grayscale_front_35deg.svg"
# Example 5: 24h Single row timeline, Amber Theme, 4 measurements, Custom Slate Zero-Value Color, 30-degree angle
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-single \
  --color=amber \
  --zero-color="#1e293b" \
  --angle=30 \
  --label-pos=front \
  --out="$OUTPUT_DIR/24h_single_day_4points.svg"
# Example 6: 24h Double row timeline, Sky Theme, 2 series × 4 measurements, Custom Slate Zero-Value Color, 30-degree angle
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-double \
  --color=sky \
  --zero-color="#1e293b" \
  --angle=30 \
  --label-pos=front \
  --out="$OUTPUT_DIR/24h_double_row_timeline.svg"

# Example 7: Transparent Yearly Grid, Emerald Theme, 30-degree angle, 60% opacity
node "$SCRIPT_DIR/generator.js" \
  --preset=year \
  --color=emerald \
  --angle=30 \
  --opacity=0.6 \
  --out="$OUTPUT_DIR/year_emerald_transparent.svg"

# Example 8: 24h Double timeline using 3D cylinder columns, Sky Theme, 90% opacity, Slate Zero-Color
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-double \
  --color=sky \
  --shape=cylinder \
  --zero-color="#1e293b" \
  --opacity=0.9 \
  --angle=30 \
  --label-pos=front \
  --out="$OUTPUT_DIR/24h_double_cylinder.svg"

# Example 9: Monthly calendar using 3D cylinder columns, Coral Theme, 100% opacity
node "$SCRIPT_DIR/generator.js" \
  --preset=month \
  --color=coral \
  --shape=cylinder \
  --angle=30 \
  --label-pos=behind \
  --out="$OUTPUT_DIR/month_coral_cylinder.svg"

# Example 10: Low-profile 24h single timeline (12-degree angle, 16px grid, 10px max height)
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-single \
  --color=amber \
  --zero-color="#1e293b" \
  --angle=12 \
  --grid-size=16 \
  --max-height=10 \
  --label-pos=front \
  --out="$OUTPUT_DIR/24h_single_low_profile.svg"

# Example 11: Low-profile 24h double timeline (12-degree angle, 16px grid, 12px max height)
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-double \
  --color=sky \
  --zero-color="#1e293b" \
  --angle=12 \
  --grid-size=16 \
  --max-height=12 \
  --label-pos=front \
  --out="$OUTPUT_DIR/24h_double_low_profile.svg"

# Example 12: Low-profile 24h double timeline (No animation, No 2D flat zero cells)
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-double \
  --color=sky \
  --angle=12 \
  --grid-size=16 \
  --max-height=12 \
  --label-pos=front \
  --no-animate \
  --no-flat-zero \
  --out="$OUTPUT_DIR/24h_double_no_animate_no_zero_cells.svg"

# Example 13: 24h Double timeline using 3D continuous ribbons, Sky Theme, 12 degree angle
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-double \
  --color=sky \
  --shape=ribbon \
  --angle=12 \
  --grid-size=16 \
  --max-height=12 \
  --label-pos=front \
  --out="$OUTPUT_DIR/24h_double_ribbon.svg"

# Example 14: Monthly calendar using 3D continuous ribbons, Coral Theme, 30 degree angle, No flat 2D cells
node "$SCRIPT_DIR/generator.js" \
  --preset=month \
  --color=coral \
  --shape=ribbon \
  --no-flat-zero \
  --angle=30 \
  --label-pos=behind \
  --out="$OUTPUT_DIR/month_coral_ribbon.svg"

# Example 15: 24h Triple timeline using 3D continuous ribbons (3 Series, wavy values, low profile)
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-triple \
  --color=sky \
  --shape=ribbon \
  --angle=12 \
  --grid-size=16 \
  --max-height=15 \
  --label-pos=front \
  --out="$OUTPUT_DIR/24h_triple_ribbon.svg"

# Example 16: 24h Triple timeline using 3D prisms (positive & negative values)
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-triple \
  --color=sunset \
  --shape=prism \
  --angle=30 \
  --grid-size=18 \
  --max-height=40 \
  --label-pos=front \
  --out="$OUTPUT_DIR/24h_triple_prism_mixed.svg"

# Example 17: 24h Triple timeline using 3D cylinders (positive & negative values)
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-triple \
  --color=emerald \
  --shape=cylinder \
  --angle=30 \
  --grid-size=18 \
  --max-height=40 \
  --label-pos=front \
  --out="$OUTPUT_DIR/24h_triple_cylinder_mixed.svg"

# Example 18: 8x8 Grid with Null values using 3D rectangular prisms
node "$SCRIPT_DIR/generator.js" \
  --preset=nulls \
  --color=sky \
  --shape=prism \
  --angle=30 \
  --out="$OUTPUT_DIR/null_test_8x8_prism.svg"

# Example 19: 8x8 Grid with Null values using 3D cylinder columns
node "$SCRIPT_DIR/generator.js" \
  --preset=nulls \
  --color=sunset \
  --shape=cylinder \
  --angle=30 \
  --out="$OUTPUT_DIR/null_test_8x8_cylinder.svg"

# Example 20: 8x8 Grid with Null values using 3D continuous ribbons
node "$SCRIPT_DIR/generator.js" \
  --preset=nulls \
  --color=emerald \
  --shape=ribbon \
  --angle=30 \
  --out="$OUTPUT_DIR/null_test_8x8_ribbon.svg"

# Example 21: 8x8 Grid with Null values using 3D floating ribbons (flatribbon)
node "$SCRIPT_DIR/generator.js" \
  --preset=nulls \
  --color=sunset \
  --shape=flatribbon \
  --angle=30 \
  --out="$OUTPUT_DIR/null_test_8x8_flatribbon.svg"

# Example 22: Monthly calendar using 3D floating ribbons (flatribbon), Coral Theme
node "$SCRIPT_DIR/generator.js" \
  --preset=month \
  --color=coral \
  --shape=flatribbon \
  --angle=30 \
  --label-pos=behind \
  --out="$OUTPUT_DIR/month_coral_flatribbon.svg"

# Example 23: 24h Triple timeline using 3D floating ribbons (flatribbon)
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-triple \
  --color=sky \
  --shape=flatribbon \
  --angle=12 \
  --grid-size=16 \
  --max-height=15 \
  --label-pos=front \
  --out="$OUTPUT_DIR/24h_triple_flatribbon.svg"

# Example 24: Monthly calendar activity with 3D cylinders and a solid height grid wall (5 ticks)
node "$SCRIPT_DIR/generator.js" \
  --preset=month \
  --color=emerald \
  --shape=cylinder \
  --angle=30 \
  --height-ticks=5 \
  --out="$OUTPUT_DIR/month_emerald_cylinder_height_grid_solid.svg"

# Example 25: 24h Double timeline with flatribbon and a wireframe height grid wall (6 ticks, no-solid)
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-double \
  --color=sunset \
  --shape=flatribbon \
  --angle=25 \
  --height-ticks=6 \
  --no-height-solid \
  --out="$OUTPUT_DIR/24h_double_flatribbon_height_grid_wireframe.svg"

# Example 26: 6-Month Dual Timeline (AM/PM), Sunset Theme, Prism columns, Height grid ticks=5
node "$SCRIPT_DIR/generator.js" \
  --preset=sixmonths \
  --color=sunset \
  --shape=prism \
  --angle=30 \
  --height-ticks=5 \
  --out="$OUTPUT_DIR/sixmonths_double_sunset_height_grid.svg"

# Example 27: June Month Tracker with Mixed Shapes per Series (Row)
node "$SCRIPT_DIR/generator.js" \
  --preset=mixed \
  --color=sunset \
  --angle=30 \
  --out="$OUTPUT_DIR/month_mixed_shapes_per_row.svg"

# Example 28: Combined Multi-Month (May & June 2026) using translated <g> groups, Sunset Theme, Mixed Shapes
node "$SCRIPT_DIR/generator.js" \
  --preset=multimonth \
  --color=sunset \
  --angle=30 \
  --out="$OUTPUT_DIR/multimonth_combined_groups.svg"

# Example 29: 6-Month Split Calendar Timeline (Jan - Jun 2026) with visible gaps, Sunset Theme, Prism columns
node "$SCRIPT_DIR/generator.js" \
  --preset=sixmonths-split \
  --color=sunset \
  --angle=30 \
  --out="$OUTPUT_DIR/sixmonths_split_sunset.svg"

# Example 30: 6-Month Split Calendar Timeline (Jan - Jun 2026) with visible gaps, Sunset Theme, Prism columns, with smooth gradients enabled
node "$SCRIPT_DIR/generator.js" \
  --preset=sixmonths-split \
  --color=sunset \
  --angle=30 \
  --interpolate-colors \
  --out="$OUTPUT_DIR/sixmonths_split_smooth_gradient.svg"

# Example 31: 24h Timeline Gradient Demo (values 0-10), Sky Theme, Flatribbon shape, showing color interpolation
node "$SCRIPT_DIR/generator.js" \
  --preset=24h-gradient \
  --color=sky \
  --shape=flatribbon \
  --angle=15 \
  --out="$OUTPUT_DIR/24h_gradient_sky_flatribbon.svg"

# Example 32: 3D Mesh Terrain, Sunset Theme, Rolling hills with circular lake, 30 degree angle, height grid wall (5 ticks)
node "$SCRIPT_DIR/generator.js" \
  --preset=mesh-terrain \
  --color=sunset \
  --angle=30 \
  --height-ticks=5 \
  --out="$OUTPUT_DIR/mesh_terrain_sunset_hills.svg"

# Example 33: 3D Mesh Terrain, Emerald Theme, Rolling hills with circular lake, 20 degree angle, low profile
node "$SCRIPT_DIR/generator.js" \
  --preset=mesh-terrain \
  --color=emerald \
  --angle=20 \
  --out="$OUTPUT_DIR/mesh_terrain_emerald_hills.svg"

# Example 34: 3D Surface Mesh Calendar Month (Standard Quad Mesh), Coral Theme, 30 degree angle, height grid wall (5 ticks)
node "$SCRIPT_DIR/generator.js" \
  --preset=month-mesh \
  --color=coral \
  --angle=30 \
  --height-ticks=5 \
  --triangulate=false \
  --out="$OUTPUT_DIR/month_mesh_coral_calendar.svg"

# Example 35: 3D Surface Mesh Calendar Month (Triangulated Planar Shading), Coral Theme, 30 degree angle, height grid wall (5 ticks)
node "$SCRIPT_DIR/generator.js" \
  --preset=month-mesh \
  --color=coral \
  --angle=30 \
  --height-ticks=5 \
  --triangulate=true \
  --out="$OUTPUT_DIR/month_mesh_coral_calendar_triangulated.svg"

# Example 36: 3D Experimental SVG 2.0 MeshGradient Calendar Month, Coral Theme, 30 degree angle, height grid wall (5 ticks)
node "$SCRIPT_DIR/generator.js" \
  --preset=month-mesh \
  --color=coral \
  --angle=30 \
  --height-ticks=5 \
  --svg2mesh=true \
  --out="$OUTPUT_DIR/month_mesh_coral_calendar_svg2mesh.svg"

# Example 37: 24h Grid, Sky Theme, Styled Row Labels with Dark Slate Background Box
node "$SCRIPT_DIR/generator.js" \
  --preset=24h \
  --color=sky \
  --angle=30 \
  --row-label-bg="#1e293b" \
  --row-label-padding=6 \
  --row-label-radius=4 \
  --row-label-font-size=10 \
  --out="$OUTPUT_DIR/24h_sky_styled_labels_slate_bg.svg"

# Example 38: Monthly Grid, Coral Theme, Styled Row Labels with Translucent Orange Background & Monospace Font
node "$SCRIPT_DIR/generator.js" \
  --preset=month \
  --color=coral \
  --angle=30 \
  --row-label-bg="#ff5500" \
  --row-label-bg-opacity=0.25 \
  --row-label-color="#ff5500" \
  --row-label-font-size=11 \
  --row-label-padding=4 \
  --row-label-radius=3 \
  --row-label-font-family=monospace \
  --out="$OUTPUT_DIR/month_coral_styled_labels_orange_translucent.svg"

# Example 39: Yearly Contributions Grid, Sunset Theme, Row Labels Hidden (Disabled)
node "$SCRIPT_DIR/generator.js" \
  --preset=year \
  --color=sunset \
  --angle=25 \
  --no-row-labels \
  --out="$OUTPUT_DIR/year_sunset_no_row_labels.svg"

# Example 40: 6-Month Dual Timeline Grid, Sunset Theme, Large Text Styled Labels (Serif, custom color)
node "$SCRIPT_DIR/generator.js" \
  --preset=sixmonths \
  --color=sunset \
  --shape=prism \
  --angle=30 \
  --height-ticks=5 \
  --row-label-font-size=13 \
  --row-label-color="#cc3535" \
  --row-label-font-family="Georgia, serif" \
  --out="$OUTPUT_DIR/sixmonths_sunset_styled_labels_serif.svg"

# Example 41: Workweek Calendar Month (Mon-Fri rows), Coral Theme, 30 degree angle, no negative values, 0 values for padding
node "$SCRIPT_DIR/generator.js" \
  --preset=month-workweek \
  --color=coral \
  --angle=30 \
  --out="$OUTPUT_DIR/month_workweek_mon_fri_calendar.svg"


echo "========================================="
echo "Done! The following SVG files were generated in $OUTPUT_DIR:"

ls -la "$OUTPUT_DIR"
echo "========================================="
