# Matriz de rotación de capas

**Grupo**: AutoMarketPlus · **Ficha**: (número de ficha) · **Stack**: React (TanStack Start) + PostgreSQL

Capas: **Front** (React) · **API** (backend) · **BD** (integración) · **E2E** (Playwright)

Reglas:

- Cada semana cambias de capa. No repites capa hasta haber pasado por las cuatro.
- En la columna escribe la capa y, al cerrar la semana, el enlace a tu PR de tests.
- Quien revisa tu PR debe haber trabajado en otra capa esa semana.

| Integrante (usuario GitHub) | S1  | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 |
|-----------------------------|-----|----|----|----|----|----|----|----|----|
| @AndresXweb                 | E2E |    |    |    |    |    |    |    |    |
| @NicoSogamoso               | E2E |    |    |    |    |    |    |    |    |
| @(tercer integrante)        | E2E |    |    |    |    |    |    |    |    |

## Cobertura semanal

| Semana          | Frontend (%) | Backend (%) | Umbral configurado para la semana siguiente |
|-----------------|--------------|-------------|---------------------------------------------|
| S1 (línea base) | 1.28*        | 1.28*       | Pendiente: se fija en la rama de la semana 2 |

*La app es un solo proyecto, así que se midió `src/lib` completo con Vitest 5.0.5 (líneas). La medición se hizo al montar Vitest, ya con tests unitarios de `swap.ts` (rama de la semana 2).

## Registro de vocero aleatorio

| Semana | Vocero | Capa preguntada | Respuesta escrita | Resultado (Alto / Medio / Bajo) |
|--------|--------|-----------------|-------------------|---------------------------------|
| S1     |        |                 |                   |                                 |