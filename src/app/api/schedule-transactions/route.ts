/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SingleTransaction from "@/lib/models/Scheduled-Transaction/SingleSchedule";
import BulkTransaction from "@/lib/models/Scheduled-Transaction/BulkSchedule";

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    const { type, ...transactionData } = data;

    let transaction;
    if (type === "single") {
      transaction = await SingleTransaction.create(transactionData);
    } else if (type === "bulk") {
      transaction = await BulkTransaction.create(transactionData);
    } else {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Transaction scheduled successfully", data: transaction },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to schedule transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json(
        { error: "Missing id or type parameter" },
        { status: 400 }
      );
    }

    let result;
    if (type === "single") {
      result = await SingleTransaction.findByIdAndDelete(id);
    } else if (type === "bulk") {
      result = await BulkTransaction.findByIdAndDelete(id);
    } else {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Transaction deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete transaction" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    // Fetch single transactions where user is sender or receiver
    const singleTransactions = await SingleTransaction.find({
      $or: [{ sender: address }, { receiver: address }],
    });

    // Fetch bulk transactions where user is sender or in recipients
    const bulkTransactions = await BulkTransaction.find({
      $or: [{ sender: address }, { "recipients.address": address }],
    });

    return NextResponse.json(
      {
        data: {
          singleTransactions,
          bulkTransactions,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
