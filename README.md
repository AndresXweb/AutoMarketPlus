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