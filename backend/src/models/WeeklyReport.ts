import mongoose, { Schema } from "mongoose";

const weeklyReportSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  weekStart: { type: Date, required: true, index: true },
  weekEnd: { type: Date, required: true },
  weeklyTarget: { type: Number, min: 0, default: 0 },
  completed: { type: Number, min: 0, default: 0 },
  achievementPercentage: { type: Number, min: 0, default: 0 },
  tasksCompleted: { type: Number, min: 0, default: 0 },
  tasksMissed: { type: Number, min: 0, default: 0 },
  attendancePercentage: { type: Number, min: 0, max: 100, default: 0 },
  averageDailyPerformance: { type: Number, min: 0, default: 0 },
  reportSubmissionRate: { type: Number, min: 0, max: 100, default: 0 },
  overallScore: { type: Number, min: 0, max: 100, default: 0 },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
weeklyReportSchema.index({ employee: 1, weekStart: 1 }, { unique: true });
export const WeeklyReport = mongoose.model("WeeklyReport", weeklyReportSchema);
