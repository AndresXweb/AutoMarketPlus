import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/swap.ts',
        'src/lib/format.ts',
        'src/lib/images.ts',
        'src/lib/utils.ts',
        'src/lib/market-rules.ts',
        'src/components/image-gallery.tsx',
        'src/components/vehicle-card.tsx',
      ],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/lib/**/types.ts',
      ],
      reporter: ['text', 'html'],
      thresholds: { lines: 30, functions: 30, branches: 30, statements: 30 },
    },
  },
});