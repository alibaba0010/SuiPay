import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Payroll from "@/lib/models/Payroll";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Find and delete the payroll
    const payroll = await Payroll.findOneAndDelete({ _id: id });

    if (!payroll) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Payroll deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting payroll:", error);
    return NextResponse.json(
      { error: "Failed to delete payroll" },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS support
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
