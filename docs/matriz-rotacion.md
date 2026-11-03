# Matriz de rotación de capas

**Grupo**: AutoMarketPlus · **Ficha**:  · **Stack**: React (TanStack Start) + PostgreSQL

Capas: **Front** (React) · **API** (backend) · **BD** (integración) · **E2E** (Playwright)

Reglas:

- Cada semana cambias de capa. No repites capa hasta haber pasado por las cuatro.
- En la columna escribe la capa y, al cerrar la semana, el enlace a tu PR de tests.
- Quien revisa tu PR debe haber trabajado en otra capa esa semana.

| Integrante (usuario GitHub) | S1  | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 |
|-----------------------------|-----|----|----|----|----|----|----|----|----|
| @AndresXweb                 | E2E | Front |    |    |    |    |    |    |    |
| @NicoSogamoso               | E2E | (completar: API / BD / E2E) |    |    |    |    |    |    |    |
| @(PedroFigueroa)        | E2E | (completar) |    |    |    |    |    |    |    |

## Cobertura semanal

| Semana          | Frontend (%) | Backend (%) | Umbral configurado para la semana siguiente |
|-----------------|--------------|-------------|---------------------------------------------|
| S1 (línea base) | ~1.3 (src/lib completo, sin umbral) | n/a (monolito) | 0 (medición inicial) |
| S2              | (anotar tras `npm run test:cov`, módulos puros) | n/a | 30 |

Notas S2:
- Cobertura unitaria sobre lógica pura: `swap.ts`, `format.ts`, `images.ts`, `utils.ts`.
- `market.ts` / `db.ts` / auth quedan para capas API/BD (server functions + SQL).
- Umbral en `vitest.config.ts`: lines/functions/branches/statements ≥ 30.

## Registro de vocero aleatorio

| Semana | Vocero | Capa preguntada | Respuesta escrita | Resultado (Alto / Medio / Bajo) |
|--------|--------|-----------------|-------------------|---------------------------------|
| S1     |        |                 |                   |                                 |
| S2     |        |                 |                   |                                 |