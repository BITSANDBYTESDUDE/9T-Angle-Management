import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["task-assigned", "deadline", "overdue", "target", "report-reminder", "report-approved", "report-rejected", "feedback", "announcement"], required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: "" },
  read: { type: Boolean, default: false, index: true },
  readAt: Date,
  data: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });
notificationSchema.index({ recipient: 1, createdAt: -1 });
export const Notification = mongoose.model("Notification", notificationSchema);
