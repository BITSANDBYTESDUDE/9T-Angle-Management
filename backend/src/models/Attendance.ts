import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  date: { type: Date, required: true, index: true },
  checkIn: Date,
  checkOut: Date,
  totalWorkingHours: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ["present", "late", "absent", "half-day", "leave"], default: "present", index: true },
  note: { type: String, default: "" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
export const Attendance = mongoose.model("Attendance", attendanceSchema);
