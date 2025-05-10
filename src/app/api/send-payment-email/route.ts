import { NextResponse } from "next/server";
import { createPaymentEmailTemplate, sendEmail } from "@/utils/email-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Handle bulk emails
    if (Array.isArray(body)) {
      const emailPromises = body.map((email) =>
        sendEmail({
          to: email.recipientEmail,
          subject: "New Payment Received",
          html: createPaymentEmailTemplate(
            email.senderEmail,
            email.amount,
            email.token,
            email.verificationCode
          ),
        })
      );

      await Promise.all(emailPromises);
      return NextResponse.json({
        success: true,
        message: "Bulk emails sent successfully",
      });
    }

    // Handle single email
    const { recipientEmail, senderEmail, amount, token, verificationCode } =
      body;

    await sendEmail({
      to: recipientEmail,
      subject: "New Payment Received",
      html: createPaymentEmailTemplate(
        senderEmail,
        amount,
        token,
        verificationCode
      ),
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error in email API route:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send email" },
      { status: 500 }
    );
  }
}
