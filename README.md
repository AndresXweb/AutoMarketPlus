# AutoMarketPlus

Marketplace de compra, venta y permuta de vehiculos entre personas en Colombia.

## Caracteristicas

- Publicacion de anuncios de vehiculos
- Sistema de ofertas y compra directa
- Vigencia de 30 dias con reactivacion
- Validacion de cedula (fotos comprimidas)
- Panel de administracion (anuncios, ofertas, deals)
- WhatsApp opcional al publicar
- Autenticacion de usuarios

## Stack

- TanStack Start (React + Router + Query)
- Tailwind CSS
- Better Auth
- PostgreSQL / Neon
- Vite + Nitro (deploy en Vercel)

## Requisitos

- Node.js 20+
- Base de datos PostgreSQL (o Neon)

## Instalacion

```bash
npm install
cp .env.example .env
# Configura DATABASE_URL y variables de auth en .env
npm run dev
```

## Pruebas de integración (BD de pruebas)

Los tests de integración usan una base PostgreSQL desechable en Docker (puerto 5433, BD `automarket_test`). Se saltan solos si no existe `DATABASE_URL` y se detienen si el nombre de la BD no termina en `_test`.

```powershell
docker compose up -d --wait
$env:DATABASE_URL = "postgresql://automarket:automarket@localhost:5433/automarket_test"
npm run db:migrate
npm run test:integration
docker compose down -v
```