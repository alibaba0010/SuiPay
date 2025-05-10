import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Payroll from "@/lib/models/Payroll";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get("owner");
    const { name } = await params;

    if (!ownerAddress) {
      return NextResponse.json(
        { error: "Owner address is required" },
        { status: 400 }
      );
    }

    const payroll = await Payroll.findOne({
      name,
      ownerAddress,
    });

    if (!payroll) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    return NextResponse.json(payroll);
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    await connectDB();
    const body = await request.json();
    const { name } = await params;

    const { recipientAddress, amount } = body;
    const payroll = await Payroll.findOneAndUpdate(
      {
        name,
        "recipients.address": recipientAddress,
      },
      {
        $set: {
          "recipients.$.amount": amount,
        },
      },
      { new: true }
    );

    if (!payroll) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }
    const total = payroll.recipients.reduce(
      (sum, recipient) => sum + (recipient.amount || 0),
      0
    );
    payroll.totalAmount = total;
    await payroll.save();

    return NextResponse.json(payroll);
  } catch (error) {
    console.error("Error updating recipient:", error);
    return NextResponse.json(
      { error: "Failed to update recipient" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const recipientAddress = searchParams.get("recipient");
    const { name } = await params;

    if (!recipientAddress) {
      return NextResponse.json(
        { error: "Recipient address is required" },
        { status: 400 }
      );
    }

    const payroll = await Payroll.findOneAndUpdate(
      { name },
      {
        $pull: { recipients: { address: recipientAddress } },
      },
      { new: true }
    );

    if (!payroll) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    return NextResponse.json(payroll);
  } catch (error) {
    console.error("Error deleting recipient:", error);
    return NextResponse.json(
      { error: "Failed to delete recipient" },
      { status: 500 }
    );
  }
}
