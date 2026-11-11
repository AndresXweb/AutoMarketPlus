import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      // Semana 2: solo lógica pura del front (sin server fns, BD ni auth).
      // market.ts / db.ts / auth / multiplayer se cubren en semanas de API/BD.
      include: [
        'src/lib/swap.ts',
        'src/lib/format.ts',
        'src/lib/images.ts',
        'src/lib/utils.ts',
        'src/lib/market-rules.ts',
      ],
      exclude: ['src/lib/**/*.test.ts', 'src/lib/**/*.spec.ts', 'src/lib/**/types.ts'],
      reporter: ['text', 'html'],
      // Piso semana 2: 30%. No bajar.
      thresholds: { lines: 30, functions: 30, branches: 30, statements: 30 },
    },
  },
});