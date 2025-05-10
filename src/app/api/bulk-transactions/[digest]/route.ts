/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import BulkTransaction from "@/lib/models/BulkTransaction";
type Context = {
  params: {
    digest: string;
  };
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ digest: string }> }
): Promise<Response> {
  try {
    const { digest } = await params;
    await connectDB();
    const { recipientAddress, status, newDigest } = await request.json();

    const transaction = await BulkTransaction.findOne({
      transactionDigest: digest,
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Update the specific recipient's status
    transaction.recipients = transaction.recipients.map((recipient: any) =>
      recipient.address === recipientAddress
        ? { ...recipient, status }
        : recipient
    );

    // Add new digest to updatedDigests array if provided
    if (newDigest) {
      transaction.updatedDigests = [
        ...(transaction.updatedDigests || []),
        { address: recipientAddress, digest: newDigest },
      ];
    }

    await transaction.save();

    return NextResponse.json(transaction, { status: 200 });
  } catch (error) {
    console.error("Error updating bulk transaction:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
