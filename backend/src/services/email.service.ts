import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    if (env.NODE_ENV !== "production") console.info(`Password reset for ${email}: ${resetUrl}`);
    return false;
  }
  const transporter = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } });
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: "Reset your 9T-Angle password",
    text: `Use this secure link to reset your password. It expires in 15 minutes: ${resetUrl}`,
    html: `<p>Use the secure link below to reset your password. It expires in 15 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`
  });
  return true;
}
