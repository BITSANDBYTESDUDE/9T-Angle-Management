import mongoose, { Schema } from "mongoose";
const listingSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  sku: { type: String, required: true, unique: true, trim: true },
  ebayAccount: { type: String, required: true, trim: true, index: true },
  listingTitle: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  status: { type: String, enum: ["draft", "ready", "listed", "error"], default: "draft", index: true },
  date: { type: Date, default: Date.now, index: true },
  linkedTask: { type: Schema.Types.ObjectId, ref: "Task", default: null }
}, { timestamps: true });
export const Listing = mongoose.model("Listing", listingSchema);
