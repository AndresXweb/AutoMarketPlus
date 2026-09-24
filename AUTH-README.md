# Auth: Google + verificación de correo + recuperar contraseña

## Archivos

### Nuevos
| Archivo | Rol |
|---------|-----|
| `src/lib/auth/mail.ts` | SMTP (Gmail) para enviar correos |
| `src/routes/recuperar.tsx` | Pedir correo de recuperación |
| `src/routes/restablecer.tsx` | Nueva contraseña con `?token=` |
| `.env.example` | Plantilla de variables (copiar a `.env`) |

### Modificados
| Archivo | Rol |
|---------|-----|
| `src/lib/auth/server.ts` | Verificación al registrarse, reset password, Google social |
| `src/routes/login.tsx` | Google GIS, términos, link recuperar |
| `src/lib/market.ts` | Bloquear publicar/ofertar sin correo verificado |
| `package.json` | Dependencia `nodemailer` |

### No eliminar
No borres los providers Grok (`providers.ts`); el botón broker queda de respaldo si no hay Client ID de Google.

## Setup local

1. Copia `.env.example` → `.env` y completa valores.
2. Instala dependencia:
   ```bash
   npm install nodemailer
   npm install -D @types/nodemailer
   ```
3. En Google Cloud: Client ID **web** + Client Secret; orígenes `http://localhost:8080`.
4. Reinicia `npm run dev`.

## Comportamiento

- Registro email → correo de confirmación → hasta confirmar **no** puede publicar ni ofertar.
- Google → `email_verified` de Google; crea o inicia sesión.
- Recuperar → mismo mensaje siempre; link a `/restablecer?token=...`.

## GitHub

- **No subas** `.env` (debe estar en `.gitignore`).
- **Sí sube** `.env.example` sin secretos reales.
- En Vercel/hosting: configura las mismas variables en el panel.
