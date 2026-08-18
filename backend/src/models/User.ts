import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 8, select: false },
  authRole: { type: String, enum: ["admin", "manager", "employee"], default: "employee", index: true },
  employee: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
  isActive: { type: Boolean, default: true, index: true },
  passwordChangedAt: Date,
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  lastLoginAt: Date
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});
userSchema.methods.comparePassword = function (candidate: string) { return bcrypt.compare(candidate, this.password); };
userSchema.set("toJSON", { transform: (_doc, ret: any) => { delete ret.password; delete ret.passwordResetToken; delete ret.passwordResetExpires; return ret; } });

export const User = mongoose.model("User", userSchema);
