/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/lib/models/Transaction";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const transaction = new Transaction(body);
    await transaction.save();

    // Return plain code only on creation
    const response = transaction.toJSON();
    const verificationCode = transaction._plainCode;
    delete response.verificationCode;

    return NextResponse.json(
      { ...response, verificationCode },
      { status: 201 }
    );
  } catch (error) {
    console.error("Transaction creation error:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
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

    const transactions = await Transaction.find({
      $or: [{ sender: address }, { receiver: address }],
    }).select("-verificationCode");

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Transaction fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 400 }
    );
  }
}
