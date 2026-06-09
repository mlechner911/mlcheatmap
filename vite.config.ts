import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MlcIsometricHeatmap',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      // Ensure we don't bundle external dependencies if we have any (currently none)
      external: [],
      output: {
        globals: {},
      },
    },
    sourcemap: true,
    outDir: 'dist',
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
});
