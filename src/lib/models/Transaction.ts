import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const TransactionSchema = new mongoose.Schema({
  transactionDigest: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    required: true,
  },
  receiver: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "completed", "claimed", "rejected", "refunded"],
    default: "active",
  },
  verificationCode: {
    type: String,
  },
  plainCode: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  updatedDigest: {
    type: String,
    default: null,
  },
});

// Generate verification code before saving
interface ITransactionDocument extends mongoose.Document {
  transactionDigest: string;
  sender: string;
  receiver: string;
  amount: number;
  status: "active" | "completed" | "claimed" | "rejected" | "refunded";
  verificationCode: string;
  timestamp: Date;
  updatedDigest: string | null;
  plainCode?: string;
  isNew: boolean;
}

TransactionSchema.pre<ITransactionDocument>(
  "save",
  async function (
    this: ITransactionDocument,
    next: mongoose.CallbackWithoutResultAndOptionalError
  ) {
    if (this.isNew) {
      if (this.verificationCode) {
        this.plainCode = this.verificationCode;
        const salt = await bcrypt.genSalt(10);
        this.verificationCode = await bcrypt.hash(this.verificationCode, salt);
      }
    }
    next();
  }
);

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
export default Transaction;
