/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Payroll from "@/lib/models/Payroll";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    // Create new payroll with only the necessary fields
    const payroll = new Payroll({
      name: body.name,
      ownerAddress: body.ownerAddress,
      recipients: body.recipients,
      tokenType: body.tokenType,
      totalAmount: body.recipients.reduce(
        (sum: number, recipient: any) => sum + recipient.amount,
        0
      ),
    });

    await payroll.save();

    return NextResponse.json(payroll, { status: 201 });
  } catch (error: any) {
    console.error("Payroll creation error:", error);

    // Handle duplicate payroll name error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A payroll with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payroll" },
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

    const payrolls = await Payroll.find({ ownerAddress: address });
    return NextResponse.json(payrolls);
  } catch (error) {
    console.error("Payroll fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payrolls" },
      { status: 400 }
    );
  }
}
