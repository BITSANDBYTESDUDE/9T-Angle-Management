import type { Request, Response } from "express";
import * as service from "../services/performance.service.js";
import { ApiError } from "../utils/ApiError.js";
import { success } from "../utils/response.js";
export async function list(req: Request, res: Response) {
  const type = String(req.query.period || "monthly") as service.PeriodType;
  if (!["daily", "weekly", "monthly"].includes(type)) throw new ApiError(422, "Invalid performance period.");
  if (req.user!.role === "employee") return success(res, await service.getPerformance(req.user!.employeeId!, type, req.query.startDate ? String(req.query.startDate) : undefined, req.query.endDate ? String(req.query.endDate) : undefined));
  return success(res, await service.teamPerformance(type, req.query.startDate ? new Date(String(req.query.startDate)) : undefined, req.query.endDate ? new Date(String(req.query.endDate)) : undefined));
}
export async function get(req: Request, res: Response) {
  if (req.user!.role === "employee" && String(req.params.employeeId) !== req.user!.employeeId) throw new ApiError(403, "You can only view your performance.");
  const type = String(req.query.period || "monthly") as service.PeriodType;
  if (!["daily", "weekly", "monthly"].includes(type)) throw new ApiError(422, "Invalid performance period.");
  return success(res, await service.getPerformance(String(req.params.employeeId), type, req.query.startDate ? String(req.query.startDate) : undefined, req.query.endDate ? String(req.query.endDate) : undefined));
}
export async function weekly(_req: Request, res: Response) { return success(res, await service.generateWeekly(), "Weekly reports generated successfully."); }
