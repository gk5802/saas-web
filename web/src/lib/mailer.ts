import nodemailer from "nodemailer";

const domain = process.env.WKT3_APP_URL;

// Transporter (nodemailer) config — only used if SMTP env vars set
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || "0");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

/**
 * 📧 Mailer setup (development के लिए Gmail/SMTP का use कर सकते हो)
 */
const transporter = nodemailer.createTransport({
  service: "smtp.gmail.com",
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  requireTLS: true,
  tls: {
    ciphers: "SSLv3",
  },
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

/**
 * 🔗 Verification Email भेजना
 * Hindi: यह function user को एक verify link भेजेगा
 */
export async function sendVerificationEmail(to: string, userId: string) {
  const verifyUrl = `${domain}/api/auth/verify-email?userId=${userId}`;

   const info = await transporter.sendMail({
    from: `"WKT3 App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your email - WKT3",
    html: `
      <h2>Verify your email</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `,
   });
      console.log("Message Sent", info.messageId);
      console.log("Mail sent to", to);
      return info;
}
