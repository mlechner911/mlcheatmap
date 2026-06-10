import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/presets.ts'),
      name: 'MlcIsometricHeatmapPresets',
      fileName: (format) => `presets.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
    outDir: 'dist',
    emptyOutDir: false, // Keep the compiled main index files
  },
});
