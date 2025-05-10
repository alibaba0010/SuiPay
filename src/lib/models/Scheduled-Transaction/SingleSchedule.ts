import mongoose from "mongoose";

const SingleScheduleSchema = new mongoose.Schema({
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
  tokenType: {
    type: String,
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const SingleSchedule =
  mongoose.models.SingleSchedule ||
  mongoose.model("SingleSchedule", SingleScheduleSchema);
export default SingleSchedule;
