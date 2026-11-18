# Inventario de dependencias externas — AutoMarketPlus (S5)

| Dependencia              | Dónde aparece                         | Tipo de riesgo          | Cómo la reemplazamos en tests      | Tipo de doble |
|--------------------------|---------------------------------------|-------------------------|------------------------------------|---------------|
| Reloj (`now`)            | `shouldPauseForInactivity`, `pauseInactiveVehicles`, reactivaciones | Tiempo no determinista | Parámetro `now` inyectable         | Stub          |
| Sesión / Auth            | `getSessionUser`, `authMiddleware`    | Fallo de login/sesión   | `vi.mock("@/lib/auth/verify.server")` | Stub / Mock |
| Correo (nodemailer)      | Verificación de email, notificaciones | SMTP caído              | Mock del servicio de email         | Stub / Mock   |
| Base de datos (PostgreSQL)| Todo `getSql()`                       | BD caída / lenta        | `createMockSql` / fake en memoria  | Fake          |
| WhatsApp (opcional)      | `showWhatsapp`, datos de contacto     | Side-effect externo     | No se llama en tests unitarios     | Dummy         |
| Imágenes de cédula       | `submitVerification`                  | Validación de data URL  | Validación pura (sin I/O)          | Ninguno       |