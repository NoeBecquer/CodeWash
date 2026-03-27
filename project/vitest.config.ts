import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,

    // ✅ ensure consistent setup
    setupFiles: './test/setup.js',

    // ✅ IMPORTANT: ensure Vitest finds your tests
    include: ['test/**/*.{test,spec}.{js,jsx}'],

    // ✅ avoid picking wrong files
    exclude: ['node_modules', 'dist'],

    css: true,

    // ✅ better debugging
    reporters: ['default'],

    // ✅ coverage (cleaner)
    coverage: {
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'test/',
        '**/*.config.js',
        '**/*.d.ts',
      ],
    },
  },
});