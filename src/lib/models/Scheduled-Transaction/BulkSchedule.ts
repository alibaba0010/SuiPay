import mongoose from "mongoose";

const RecipientSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const BulkScheduleSchema = new mongoose.Schema({
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
  scheduledDate: {
    type: Date,
    required: true,
  },
  tokenType: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const BulkSchedule =
  mongoose.models.BulkSchedule ||
  mongoose.model("BulkSchedule", BulkScheduleSchema);

export default BulkSchedule;
