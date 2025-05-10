import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Payroll from "@/lib/models/Payroll";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    await connectDB();
    const body = await request.json();
    const { address, amount } = body;
    const { name } = await params;

    const payroll = await Payroll.findOneAndUpdate(
      { name },
      {
        $push: {
          recipients: {
            address,
            amount,
          },
        },
      },
      { new: true }
    );

    if (!payroll) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    return NextResponse.json(payroll);
  } catch (e) {
    console.error("Error adding recipient:", e);
    return NextResponse.json(
      { error: "Failed to add recipient" },
      { status: 500 }
    );
  }
}
