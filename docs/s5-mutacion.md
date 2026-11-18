# Mutación documentada — S5 (Reloj)

## Mutación aplicada
En `shouldPauseForInactivity` se eliminó el parámetro opcional `now` y se forzó siempre:

```ts
const current = new Date(); // en vez de params.now ?? new Date()