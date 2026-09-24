/**
 * Envío de correo (verificación y recuperación).
 *
 * .env (servidor, SIN prefijo VITE_):
 *   MAIL_USERNAME
 *   MAIL_APP_PASSWORD
 *   MAIL_HOST=smtp.gmail.com
 *   MAIL_PORT=587
 *   MAIL_FROM_NAME=AutoMarket
 */

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function env(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const v = process.env[name];
  return v && String(v).trim() ? String(v).trim() : undefined;
}

export function isMailConfigured(): boolean {
  return Boolean(env("MAIL_USERNAME") && env("MAIL_APP_PASSWORD"));
}

export async function sendAppMail({ to, subject, text, html }: SendArgs): Promise<void> {
  const user = env("MAIL_USERNAME");
  const pass = env("MAIL_APP_PASSWORD");

  if (!user || !pass) {
    const msg =
      "[mail] Faltan MAIL_USERNAME o MAIL_APP_PASSWORD en .env. " +
      "Reinicia npm run dev después de editar .env.";
    console.error(msg);
    console.error("[mail] Correo que NO se envió a:", to, "| Asunto:", subject);
    console.error("[mail] Cuerpo:\n", text);
    throw new Error(
      "El servidor de correo no está configurado. Revisa MAIL_USERNAME y MAIL_APP_PASSWORD en .env.",
    );
  }

  let nodemailer: typeof import("nodemailer");
  try {
    nodemailer = await import("nodemailer");
  } catch {
    console.error("[mail] Instala nodemailer: npm install nodemailer");
    throw new Error("Falta la dependencia nodemailer. Ejecuta: npm install nodemailer");
  }

  const host = env("MAIL_HOST") ?? "smtp.gmail.com";
  const port = Number(env("MAIL_PORT") ?? "587");
  const fromName = env("MAIL_FROM_NAME") ?? "AutoMarket";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to,
      subject,
      text,
      html: html ?? text.replace(/\n/g, "<br/>"),
    });
    console.log("[mail] Enviado a", to, "| id:", info.messageId);
  } catch (err) {
    console.error("[mail] Error SMTP al enviar a", to, err);
    throw new Error(
      "No se pudo enviar el correo (SMTP). Revisa la contraseña de aplicación de Gmail y que la verificación en 2 pasos esté activa.",
    );
  }
}
