import mongoose, { Schema } from "mongoose";

const employeeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  fullName: { type: String, required: true, trim: true, index: true },
  phone: { type: String, default: "" },
  profileImage: { type: String, default: "" },
  role: { type: Schema.Types.ObjectId, ref: "Role", required: true, index: true },
  department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
  position: { type: String, required: true, trim: true },
  joiningDate: { type: Date, required: true },
  status: { type: String, enum: ["active", "disabled"], default: "active", index: true },
  workingHours: {
    start: { type: String, default: "09:00" },
    end: { type: String, default: "17:00" },
    hoursPerDay: { type: Number, min: 1, max: 24, default: 8 }
  },
  timezone: { type: String, default: "UTC" },
  address: { type: String, default: "" }
}, { timestamps: true });

employeeSchema.index({ fullName: "text", position: "text" });
export const Employee = mongoose.model("Employee", employeeSchema);
