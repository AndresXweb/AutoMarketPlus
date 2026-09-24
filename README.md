# Parches AutoMarketPlus — inactividad, ofertas, deals, WhatsApp, cédula

Copia estos archivos sobre el repo (misma ruta relativa).

## Archivos incluidos

```
migrations/0004_inactividad_ofertas_deals.sql   ← NUEVA (ejecutar migración)
src/lib/market.ts                               ← lógica de negocio
src/lib/images.ts                               ← compresión cédula
src/routes/publicar.tsx                         ← reglas oferta + WhatsApp
src/routes/vehiculo.$id.tsx                     ← validación oferta + badge dueño
src/routes/mis-anuncios.tsx                     ← pausa inactividad + reactivar
src/routes/perfil.tsx                           ← fix fotos cédula
src/routes/admin/ofertas.tsx                    ← negocios concretados
src/routes/admin/index.tsx                      ← métricas deals
src/routes/admin/anuncios.tsx                   ← extender N días (admin elige)
```

## Qué implementa

1. **30 días** de vigencia. Al vencer → pausado por inactividad.
2. **1 reactivación gratis** (+30 días). Después → solicitud; admin elige días.
3. **Compra directa**: aceptar menores / % mínimo / nunca > precio.
4. **Badge de ofertas solo para el dueño**.
5. **Fotos cédula**: compresión más liviana + validación clara; admin valida igual.
6. **Trazabilidad**: `deals` + `accepted_at/by/final_amount` al aceptar.
7. **WhatsApp opcional** al publicar (`show_whatsapp`).

## Después de copiar

1. Aplicar la migración `0004_...sql` en tu Postgres / Neon.
2. Reiniciar el servidor de desarrollo.
