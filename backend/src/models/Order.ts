import mongoose, { Schema } from "mongoose";
const orderSchema = new Schema({
  orderId: { type: String, required: true, unique: true, trim: true },
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  ebayAccount: { type: String, required: true, trim: true, index: true },
  customer: { type: String, required: true },
  orderDate: { type: Date, required: true, index: true },
  dispatchDeadline: { type: Date, required: true, index: true },
  assignedEmployee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  status: { type: String, enum: ["new", "processing", "dispatched", "completed", "problem"], default: "new", index: true },
  linkedTask: { type: Schema.Types.ObjectId, ref: "Task", default: null },
  notes: { type: String, default: "" }
}, { timestamps: true });
export const Order = mongoose.model("Order", orderSchema);
