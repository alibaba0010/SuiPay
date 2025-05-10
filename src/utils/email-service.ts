import nodemailer from "nodemailer";

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Enhanced email template for payment verification
export const createPaymentEmailTemplate = (
  senderEmail: string,
  amount: string,
  token: string,
  verificationCode: string
) => {
  // Format the amount to 4 decimal places for better readability
  const formattedAmount = Number.parseFloat(amount).toFixed(4);

  // Determine if this is a secure payment that requires verification
  const isSecurePayment = verificationCode.length > 0;

  // Create verification section only if a code is provided
  const verificationSection = isSecurePayment
    ? `
      <p style="margin: 10px 0;"><strong>Verification Code:</strong></p>
      <div style="background-color: #e9ecef; padding: 15px; border-radius: 4px; text-align: center; font-size: 24px; letter-spacing: 2px;">
        ${verificationCode}
      </div>
      <p>To claim this payment, please use the verification code above at our payment portal.</p>
    `
    : `
      <p>The payment has been processed and the funds are now available in your wallet.</p>
    `;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a2a40;">New Payment Received</h2>
      <p>You have received a new payment from ${senderEmail}</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Amount:</strong> ${formattedAmount} ${token}</p>
        ${verificationSection}
      </div>
      <p style="color: #666; font-size: 14px;">This is an automated message, please do not reply.</p>
    </div>
  `;
};

// Send email function
export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"Secure Token Transfer" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
