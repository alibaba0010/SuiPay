import mongoose, { Schema, Model } from "mongoose";
import { Payroll as PayrollType } from "@/types/payroll";

const RecipientSchema = new Schema({
  address: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
});

const PayrollSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    ownerAddress: {
      type: String,
      required: true,
      index: true,
    },
    recipients: [RecipientSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

// Create compound index for unique payroll names per owner
PayrollSchema.index({ ownerAddress: 1, name: 1 }, { unique: true });

// Calculate total amount before saving
PayrollSchema.pre("save", function (next) {
  this.totalAmount = this.recipients.reduce(
    (sum, recipient) => sum + recipient.amount,
    0
  );
  next();
});

const Payroll =
  (mongoose.models.Payroll as Model<PayrollType>) ||
  mongoose.model<PayrollType>("Payroll", PayrollSchema);

export default Payroll;
