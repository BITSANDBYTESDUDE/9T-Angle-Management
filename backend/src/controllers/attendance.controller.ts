import type { Request, Response } from "express";
import * as attendanceService from "../services/attendance.service.js";
import { pagination } from "../utils/query.js";
import { success } from "../utils/response.js";
export async function list(req: Request, res: Response) {
  const { page, limit } = pagination(req);
  const result = await attendanceService.listAttendance({ page, limit, employee: req.query.employee ? String(req.query.employee) : undefined, status: req.query.status ? String(req.query.status) : undefined, startDate: req.query.startDate ? String(req.query.startDate) : undefined, endDate: req.query.endDate ? String(req.query.endDate) : undefined, ownEmployeeId: req.user!.role === "employee" ? req.user!.employeeId : undefined });
  return success(res, result.items, "Attendance loaded.", 200, { page, limit, total: result.total, pages: result.pages });
}
export async function checkIn(req: Request, res: Response) { return success(res, await attendanceService.checkIn(req.user!.employeeId, req.user!.id), "Checked in successfully.", 201); }
export async function checkOut(req: Request, res: Response) { return success(res, await attendanceService.checkOut(req.user!.employeeId), "Checked out successfully."); }
export async function upsert(req: Request, res: Response) { return success(res, await attendanceService.upsertAttendance(req.body, req.user!.id), "Attendance updated successfully."); }
