import mongoose, { Schema } from "mongoose";

const roleSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  permissions: [{ type: String, trim: true }],
  isSystem: { type: Boolean, default: false }
}, { timestamps: true });

export const Role = mongoose.model("Role", roleSchema);
