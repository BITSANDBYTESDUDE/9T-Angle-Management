import type { Request, Response } from "express";
import * as reportService from "../services/report.service.js";
import { uploadFile } from "../services/upload.service.js";
import { pagination } from "../utils/query.js";
import { success } from "../utils/response.js";
export async function list(req: Request, res: Response) {
  const { page, limit } = pagination(req);
  const result = await reportService.listReports({ page, limit, employee: req.query.employee ? String(req.query.employee) : undefined, status: req.query.status ? String(req.query.status) : undefined, startDate: req.query.startDate ? String(req.query.startDate) : undefined, endDate: req.query.endDate ? String(req.query.endDate) : undefined, ownEmployeeId: req.user!.role === "employee" ? req.user!.employeeId : undefined });
  return success(res, result.items, "Reports loaded.", 200, { page, limit, total: result.total, pages: result.pages });
}
export async function get(req: Request, res: Response) { return success(res, await reportService.getReport(String(req.params.id), req.user!)); }
export async function create(req: Request, res: Response) { return success(res, await reportService.createReport(req.body, req.user!), "Daily report saved successfully.", 201); }
export async function update(req: Request, res: Response) { return success(res, await reportService.updateReport(String(req.params.id), req.body, req.user!), "Daily report updated successfully."); }
export async function review(req: Request, res: Response) { return success(res, await reportService.reviewReport(String(req.params.id), req.body.action, req.body.feedback, req.user!.id), req.body.action === "approve" ? "Report approved." : "Report returned to employee."); }
export async function remove(req: Request, res: Response) { await reportService.deleteReport(String(req.params.id), req.user!); return success(res, null, "Report deleted."); }
export async function uploadEvidence(req: Request, res: Response) { const files = req.files as Express.Multer.File[]; const uploaded = await Promise.all((files || []).map((file) => uploadFile(file))); return success(res, uploaded, "Evidence uploaded successfully.", 201); }
