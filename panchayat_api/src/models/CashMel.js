import mongoose from "mongoose";

const schema = new mongoose.Schema({
  panchayatId: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: String, // ISO date
  name: String,
  receiptPaymentNo: String,
  vyavharType: { type: String, enum: ["aavak", "javak"] },
  category: String,
  amount: Number,
  paymentMethod: { type: String, enum: ["rokad", "bank"] },
  bank: String,
  ddCheckNum: String,
  remarks: String,
  createdAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
});

export default mongoose.model("CashMel", schema);
