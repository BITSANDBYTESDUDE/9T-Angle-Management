import mongoose, { Schema } from "mongoose";

const fileSchema = new Schema({ url: { type: String, required: true }, publicId: String, name: String, type: String, size: Number }, { _id: false });
const dailyReportSchema = new Schema({
  date: { type: Date, required: true, index: true },
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  tasksCompleted: [{ type: Schema.Types.ObjectId, ref: "Task" }],
  targetAchieved: { type: Number, min: 0, default: 0 },
  productsResearched: { type: Number, min: 0, default: 0 },
  listingsCreated: { type: Number, min: 0, default: 0 },
  ordersProcessed: { type: Number, min: 0, default: 0 },
  otherCompletedWork: { type: String, default: "" },
  problemsFaced: { type: String, default: "" },
  notes: { type: String, default: "" },
  tomorrowPlan: { type: String, default: "" },
  evidence: [fileSchema],
  totalWorkingHours: { type: Number, min: 0, max: 24, default: 0 },
  status: { type: String, enum: ["draft", "submitted", "reviewed", "rejected"], default: "draft", index: true },
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  feedback: { type: String, default: "" }
}, { timestamps: true });
dailyReportSchema.index({ employee: 1, date: 1 }, { unique: true });
export const DailyReport = mongoose.model("DailyReport", dailyReportSchema);
