import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
});

export default mongoose.model("Bank", schema);