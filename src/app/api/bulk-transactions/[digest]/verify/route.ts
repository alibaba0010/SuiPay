/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import BulkTransaction from "@/lib/models/BulkTransaction";
import bcrypt from "bcryptjs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ digest: string }> }
) {
  try {
    await connectDB();
    const { code, receiverAddress } = await request.json();
    const { digest } = await params;

    const transaction = await BulkTransaction.findOne({
      transactionDigest: digest,
    });
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const recipient = transaction.recipients.find(
      (r: any) => r.address === receiverAddress
    );
    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Compare the provided code with the recipient's verification code
    const isValidCode = await bcrypt.compare(code, recipient.verificationCode);

    if (!isValidCode) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }
}
