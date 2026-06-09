const fs = require('fs');
const path = require('path');
const { renderHeatmap, HeatmapGrid, presets } = require('./dist/index.umd.js');

// Scratch output directory
const scratchDir = '/home/mlc/.gemini/antigravity-cli/brain/c5d664b9-cf6f-4fa1-aebb-3042193c163a/scratch';
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

// Get the 8x8 Null values test grid
const grid8x8 = presets.nullsExample8x8();

// Render 8x8 as Prism
const svg8x8Prism = grid8x8.render({
  shape: 'prism',
  colorScheme: 'sky',
  title: '8x8 Grid Null Example (Prism Shape)',
  showGrid: true,
  interactive: true
});
fs.writeFileSync(path.join(scratchDir, 'null_test_8x8_prism.svg'), svg8x8Prism);

// Render 8x8 as Cylinder
const svg8x8Cylinder = grid8x8.render({
  shape: 'cylinder',
  colorScheme: 'sunset',
  title: '8x8 Grid Null Example (Cylinder Shape)',
  showGrid: true,
  interactive: true
});
fs.writeFileSync(path.join(scratchDir, 'null_test_8x8_cylinder.svg'), svg8x8Cylinder);

// Render 8x8 as Ribbon
const svg8x8Ribbon = grid8x8.render({
  shape: 'ribbon',
  colorScheme: 'emerald',
  title: '8x8 Grid Null Example (Ribbon Shape)',
  showGrid: true,
  interactive: true
});
fs.writeFileSync(path.join(scratchDir, 'null_test_8x8_ribbon.svg'), svg8x8Ribbon);

console.log('8x8 Null value test SVGs generated successfully in scratch directory.');
