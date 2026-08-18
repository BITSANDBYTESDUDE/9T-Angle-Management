import mongoose, { Schema } from "mongoose";

const attachmentSchema = new Schema({ url: { type: String, required: true }, publicId: String, name: String, type: String, size: Number }, { _id: false });
const progressSchema = new Schema({
  quantity: { type: Number, min: 0, required: true },
  note: { type: String, default: "" },
  evidence: [attachmentSchema],
  status: { type: String, enum: ["pending", "in-progress", "completed", "overdue", "cancelled"] },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const taskSchema = new Schema({
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, default: "" },
  taskType: { type: String, required: true, trim: true, index: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium", index: true },
  startDate: { type: Date, required: true, index: true },
  dueDate: { type: Date, required: true, index: true },
  targetQuantity: { type: Number, required: true, min: 1 },
  completedQuantity: { type: Number, default: 0, min: 0 },
  estimatedHours: { type: Number, min: 0, default: 0 },
  attachments: [attachmentSchema],
  instructions: { type: String, default: "" },
  status: { type: String, enum: ["pending", "in-progress", "completed", "overdue", "cancelled"], default: "pending", index: true },
  completionDate: Date,
  notes: { type: String, default: "" },
  progressHistory: [progressSchema],
  allowOverTarget: { type: Boolean, default: false },
  source: { type: String, enum: ["manual", "product", "listing", "order"], default: "manual" },
  sourceId: { type: Schema.Types.ObjectId, default: null }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

taskSchema.virtual("progress").get(function () { return this.targetQuantity ? Math.min(100, Math.round((this.completedQuantity / this.targetQuantity) * 1000) / 10) : 0; });
taskSchema.virtual("remaining").get(function () { return Math.max(0, this.targetQuantity - this.completedQuantity); });
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });
taskSchema.index({ createdAt: -1 });
export const Task = mongoose.model("Task", taskSchema);
