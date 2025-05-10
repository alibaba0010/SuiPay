/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import BulkTransaction from "@/lib/models/BulkTransaction";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    // Create and save the transaction
    const transaction = new BulkTransaction(body);
    await transaction.save();

    // Prepare response by getting the plain codes for each recipient
    const response = transaction.toJSON();
    const recipientsWithCodes = transaction.recipients.map(
      (recipient: any) => ({
        ...recipient.toObject(),
        plainCode: recipient.plainCode,
      })
    );

    // Remove sensitive data and return response with plain codes
    const sanitizedResponse = {
      ...response,
      recipients: recipientsWithCodes.map((recipient: any) => {
        //disable-eslint-next-line @typescript-eslint/no-unused-vars
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { verificationCode, ...rest } = recipient;
        return rest;
      }),
    };

    return NextResponse.json(sanitizedResponse, { status: 201 });
  } catch (error) {
    console.error("Bulk transaction creation error:", error);
    return NextResponse.json(
      { error: "Failed to create bulk transaction" },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    const transactions = await BulkTransaction.find({
      $or: [{ sender: address }, { "recipients.address": address }],
    }).select("-recipients.verificationCode");

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Bulk transaction fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bulk transactions" },
      { status: 400 }
    );
  }
}
