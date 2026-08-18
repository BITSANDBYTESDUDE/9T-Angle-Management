import type { Request, Response } from "express";
import { adminDashboard, employeeDashboard } from "../services/dashboard.service.js";
import { analytics } from "../services/analytics.service.js";
import { success } from "../utils/response.js";
export async function dashboard(req: Request, res: Response) { return success(res, req.user!.role === "employee" ? await employeeDashboard(req.user!.employeeId!, req.user!.id) : await adminDashboard()); }
export async function getAnalytics(req: Request, res: Response) { return success(res, await analytics(String(req.query.filter || "month"), req.query.startDate ? String(req.query.startDate) : undefined, req.query.endDate ? String(req.query.endDate) : undefined)); }
