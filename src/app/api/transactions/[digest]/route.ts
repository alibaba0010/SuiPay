/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/lib/models/Transaction";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ digest: string }> }
) {
  try {
    await connectDB();
    const { status, updatedDigest } = await request.json();
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

    transaction.status = status;
    if (updatedDigest) {
      transaction.updatedDigest = updatedDigest;
    }
    await transaction.save();

    return NextResponse.json(transaction, { status: 200 });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 400 }
    );
  }
}
