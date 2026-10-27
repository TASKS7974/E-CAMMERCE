import nodemailer from 'nodemailer';

export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST
    && process.env.SMTP_USER
    && process.env.SMTP_PASSWORD
    && process.env.SMTP_FROM
    && process.env.PASSWORD_RESET_URL,
  );
}

export async function sendPasswordResetEmail(email, token) {
  if (!isMailConfigured()) {
    throw new Error('SMTP settings and PASSWORD_RESET_URL are required to send password recovery email.');
  }

  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('SMTP_PORT must be a valid TCP port.');
  }

  const resetUrl = new URL(process.env.PASSWORD_RESET_URL);
  resetUrl.searchParams.set('token', token);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Reset your D&G password',
    text: `Use this link within 30 minutes to reset your D&G password:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
  });
}
