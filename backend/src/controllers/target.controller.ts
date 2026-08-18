import type { Request, Response } from "express";
import * as targetService from "../services/target.service.js";
import { pagination } from "../utils/query.js";
import { success } from "../utils/response.js";
export async function list(req: Request, res: Response) {
  const { page, limit } = pagination(req);
  const result = await targetService.listTargets({ page, limit, employee: req.query.employee ? String(req.query.employee) : undefined, targetType: req.query.targetType ? String(req.query.targetType) : undefined, active: req.query.active ? String(req.query.active) : undefined, ownEmployeeId: req.user!.role === "employee" ? req.user!.employeeId : undefined });
  return success(res, result.items, "Targets loaded.", 200, { page, limit, total: result.total, pages: result.pages });
}
export async function create(req: Request, res: Response) { return success(res, await targetService.createTarget(req.body, req.user!.id), "Target created successfully.", 201); }
export async function update(req: Request, res: Response) { return success(res, await targetService.updateTarget(String(req.params.id), req.body), "Target updated successfully."); }
export async function remove(req: Request, res: Response) { await targetService.deleteTarget(String(req.params.id)); return success(res, null, "Target deleted successfully."); }
