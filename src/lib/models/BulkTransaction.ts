import mongoose from "mongoose";
import bcrypt from "bcryptjs";

interface Recipient {
  address: string;
  amount: number;
  status: "active" | "completed" | "claimed" | "rejected" | "refunded";
  verificationCode: string;
  plainCode: string;
}

interface UpdatedDigestMapping {
  address: string;
  digest: string;
}

const UpdatedDigestMappingSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  digest: {
    type: String,
    required: true,
  },
});

const RecipientSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  plainCode: {
    type: String,
  },
  verificationCode: {
    type: String,
  },
  status: {
    type: String,
    enum: ["active", "completed", "claimed", "rejected", "refunded"],
    default: "active",
  },
});

const BulkTransactionSchema = new mongoose.Schema({
  transactionDigest: {
    type: String,
    required: true,
    unique: true,
  },
  sender: {
    type: String,
    required: true,
  },
  recipients: [RecipientSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  updatedDigests: [UpdatedDigestMappingSchema],
});

// Generate verification codes for each recipient before saving
BulkTransactionSchema.pre("save", async function (next) {
  if (this.isNew) {
    const recipients = this.recipients || [];
    for (const recipient of recipients) {
      if (recipient.plainCode) {
        const salt = await bcrypt.genSalt(10);
        recipient.verificationCode = await bcrypt.hash(
          recipient.plainCode,
          salt
        );
      }
    }
  }
  next();
});

const BulkTransaction =
  mongoose.models.BulkTransaction ||
  mongoose.model("BulkTransaction", BulkTransactionSchema);

export default BulkTransaction;
