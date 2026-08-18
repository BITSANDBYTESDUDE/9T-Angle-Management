import mongoose, { Schema } from "mongoose";

const settingsSchema = new Schema({
  key: { type: String, unique: true, default: "organization" },
  organizationName: { type: String, default: "9T-Angle" },
  timezone: { type: String, default: "UTC" },
  workdayStart: { type: String, default: "09:00" },
  lateAfterMinutes: { type: Number, min: 0, default: 15 },
  performanceWeights: {
    taskCompletion: { type: Number, min: 0, max: 100, default: 30 },
    targetAchievement: { type: Number, min: 0, max: 100, default: 30 },
    onTimeCompletion: { type: Number, min: 0, max: 100, default: 15 },
    attendance: { type: Number, min: 0, max: 100, default: 15 },
    reportSubmission: { type: Number, min: 0, max: 100, default: 10 }
  },
  reportReminderHour: { type: Number, min: 0, max: 23, default: 16 },
  maxUploadBytes: { type: Number, default: 5242880 }
}, { timestamps: true });
export const Settings = mongoose.model("Settings", settingsSchema);
