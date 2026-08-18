import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

type TokenPayload = { sub: string; role: "admin" | "manager" | "employee"; employeeId?: string; iat: number; exp: number };

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : undefined;
  const token = req.cookies?.accessToken || bearer;
  if (!token) throw new ApiError(401, "Authentication required.");
  let payload: TokenPayload;
  try { payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload; }
  catch { throw new ApiError(401, "Your session is invalid or expired. Please sign in again."); }
  const user = await User.findById(payload.sub).select("isActive authRole employee passwordChangedAt").lean();
  if (!user) throw new ApiError(401, "The account for this session no longer exists.");
  if (!user.isActive) throw new ApiError(403, "This account has been disabled. Contact an administrator.");
  if (user.passwordChangedAt && payload.iat * 1000 < new Date(user.passwordChangedAt).getTime()) throw new ApiError(401, "Password changed since this session began. Please sign in again.");
  req.user = { id: String(user._id), role: user.authRole as TokenPayload["role"], ...(user.employee ? { employeeId: String(user.employee) } : {}) };
  next();
});

export const authorize = (...roles: Array<TokenPayload["role"]>) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, "You do not have permission to perform this action."));
  next();
};
