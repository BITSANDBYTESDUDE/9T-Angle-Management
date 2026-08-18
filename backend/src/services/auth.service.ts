import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Employee, User } from "../models/index.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { sendPasswordResetEmail } from "./email.service.js";

function publicUser(user: any) {
  return { id: String(user._id), email: user.email, role: user.authRole, isActive: user.isActive, employee: user.employee || null };
}
export function createToken(user: any) {
  return jwt.sign({ role: user.authRole, ...(user.employee ? { employeeId: String(user.employee._id || user.employee) } : {}) }, env.JWT_SECRET, { subject: String(user._id), expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] });
}
export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password").populate({ path: "employee", populate: [{ path: "role" }, { path: "department" }] });
  if (!user || !(await (user as any).comparePassword(password))) throw new ApiError(401, "Invalid email or password.");
  if (!user.isActive) throw new ApiError(403, "This account has been disabled. Contact an administrator.");
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  return { token: createToken(user), user: publicUser(user) };
}
export async function getMe(userId: string) {
  const user = await User.findById(userId).populate({ path: "employee", populate: [{ path: "role" }, { path: "department" }] }).lean();
  if (!user) throw new ApiError(404, "Account not found.");
  return publicUser(user);
}
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await User.findById(userId).select("+password");
  if (!user || !(await (user as any).comparePassword(currentPassword))) throw new ApiError(400, "Current password is incorrect.");
  user.password = newPassword;
  await user.save();
  return createToken(user);
}
export async function requestPasswordReset(email: string) {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (!user) return;
  const token = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${env.FRONTEND_URL}/reset-password/${token}`;
  try { await sendPasswordResetEmail(user.email, resetUrl); }
  catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(503, "Unable to send password reset email. Please try again later.");
  }
}
export async function resetPassword(token: string, password: string) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ passwordResetToken: hash, passwordResetExpires: { $gt: new Date() } }).select("+passwordResetToken +passwordResetExpires");
  if (!user) throw new ApiError(400, "This reset link is invalid or has expired.");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
}
export async function updateProfile(userId: string, input: Record<string, unknown>) {
  const user = await User.findById(userId);
  if (!user?.employee) throw new ApiError(404, "Employee profile not found.");
  return Employee.findByIdAndUpdate(user.employee, input, { new: true, runValidators: true }).populate("role department");
}
