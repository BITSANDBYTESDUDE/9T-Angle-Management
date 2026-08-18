import type { Request, Response } from "express";
import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import { success } from "../utils/response.js";

const cookieOptions = () => ({ httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: env.JWT_COOKIE_DAYS * 86400000, path: "/" });
export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body.email, req.body.password);
  res.cookie("accessToken", result.token, cookieOptions());
  return success(res, { user: result.user, token: result.token }, "Welcome back.");
}
export async function logout(_req: Request, res: Response) {
  res.clearCookie("accessToken", { ...cookieOptions(), maxAge: 0 });
  return success(res, null, "Signed out successfully.");
}
export async function me(req: Request, res: Response) { return success(res, await authService.getMe(req.user!.id)); }
export async function changePassword(req: Request, res: Response) {
  const token = await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  res.cookie("accessToken", token, cookieOptions());
  return success(res, null, "Password changed successfully.");
}
export async function forgotPassword(req: Request, res: Response) {
  await authService.requestPasswordReset(req.body.email);
  return success(res, null, "If that email belongs to an active account, a reset link has been sent.");
}
export async function resetPassword(req: Request, res: Response) {
  await authService.resetPassword(String(req.params.token), req.body.password);
  return success(res, null, "Password reset successfully. You can now sign in.");
}
export async function updateProfile(req: Request, res: Response) { return success(res, await authService.updateProfile(req.user!.id, req.body), "Profile updated successfully."); }
