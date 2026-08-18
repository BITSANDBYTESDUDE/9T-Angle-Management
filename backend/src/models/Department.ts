import mongoose, { Schema } from "mongoose";

const departmentSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  manager: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Department = mongoose.model("Department", departmentSchema);
