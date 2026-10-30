import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Si en src/ se importa con "@/...", este alias lo resuelve.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    // Solo *.spec.ts: los *.test.ts actuales usan el runner nativo de Node y se dejan como están.
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      // Lógica de negocio. Se excluyen tipos y componentes de interfaz.
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/*.test.ts', 'src/lib/**/*.spec.ts', 'src/lib/**/types.ts'],
      reporter: ['text', 'html'],
      // Umbral en 0 hasta medir la línea base; luego se sube al valor real.
      thresholds: { lines: 0, functions: 0, branches: 0, statements: 0 },
    },
  },
});