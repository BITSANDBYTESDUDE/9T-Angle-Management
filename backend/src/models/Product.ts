import mongoose, { Schema } from "mongoose";
const productSchema = new Schema({
  productName: { type: String, required: true, trim: true, index: true },
  productUrl: { type: String, required: true },
  sourceUrl: { type: String, default: "" },
  costPrice: { type: Number, min: 0, required: true },
  sellingPrice: { type: Number, min: 0, required: true },
  estimatedProfit: { type: Number, default: 0 },
  competition: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  researcher: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  status: { type: String, enum: ["researching", "approved", "rejected", "listed"], default: "researching", index: true },
  notes: { type: String, default: "" },
  date: { type: Date, default: Date.now, index: true },
  linkedTask: { type: Schema.Types.ObjectId, ref: "Task", default: null }
}, { timestamps: true });
productSchema.pre("save", function () { this.estimatedProfit = Math.round((this.sellingPrice - this.costPrice) * 100) / 100; });
export const Product = mongoose.model("Product", productSchema);
