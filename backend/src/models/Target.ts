import mongoose, { Schema } from "mongoose";

const targetSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  role: { type: Schema.Types.ObjectId, ref: "Role", default: null },
  targetType: { type: String, enum: ["daily", "weekly", "monthly"], required: true, index: true },
  metric: { type: String, default: "units", trim: true },
  targetQuantity: { type: Number, required: true, min: 1 },
  completedQuantity: { type: Number, default: 0, min: 0 },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  description: { type: String, default: "" },
  isActive: { type: Boolean, default: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
targetSchema.virtual("achievement").get(function () { return this.targetQuantity ? Math.round((this.completedQuantity / this.targetQuantity) * 1000) / 10 : 0; });
targetSchema.virtual("remaining").get(function () { return Math.max(0, this.targetQuantity - this.completedQuantity); });
targetSchema.index({ employee: 1, startDate: 1, endDate: 1, targetType: 1 });
export const Target = mongoose.model("Target", targetSchema);
