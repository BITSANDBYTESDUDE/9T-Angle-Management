import mongoose, { Schema } from "mongoose";

const metricsSchema = new Schema({
  taskCompletion: { type: Number, min: 0, max: 100, default: 0 },
  targetAchievement: { type: Number, min: 0, max: 100, default: 0 },
  onTimeCompletion: { type: Number, min: 0, max: 100, default: 0 },
  attendance: { type: Number, min: 0, max: 100, default: 0 },
  reportSubmission: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });
const performanceSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  periodType: { type: String, enum: ["daily", "weekly", "monthly"], required: true, index: true },
  periodStart: { type: Date, required: true, index: true },
  periodEnd: { type: Date, required: true },
  metrics: { type: metricsSchema, default: () => ({}) },
  overallScore: { type: Number, min: 0, max: 100, default: 0 },
  rating: { type: String, enum: ["excellent", "very-good", "good", "needs-improvement", "poor"], default: "poor" },
  calculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
performanceSchema.index({ employee: 1, periodType: 1, periodStart: 1 }, { unique: true });
export const Performance = mongoose.model("Performance", performanceSchema);
