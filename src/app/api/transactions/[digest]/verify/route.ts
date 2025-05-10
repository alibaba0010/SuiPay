/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/lib/models/Transaction";
import bcrypt from "bcryptjs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ digest: string }> }
) {
  try {
    await connectDB();
    const { code, receiverAddress } = await request.json();
    const { digest } = await params;

    const transaction = await Transaction.findOne({
      transactionDigest: digest,
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.receiver !== receiverAddress) {
      return NextResponse.json({ error: "Invalid receiver" }, { status: 403 });
    }

    const isValidCode = await bcrypt.compare(
      code,
      transaction.verificationCode
    );

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
