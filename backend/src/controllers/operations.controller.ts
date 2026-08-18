import type { Request, Response } from "express";
import * as service from "../services/operations.service.js";
import { pagination } from "../utils/query.js";
import { success } from "../utils/response.js";
export async function list(req: Request, res: Response) { const { page, limit } = pagination(req); const result = await service.list(String(req.params.type), { page, limit, status: req.query.status ? String(req.query.status) : undefined, search: String(req.query.search || ""), employeeId: req.query.employee ? String(req.query.employee) : undefined }); return success(res, result.items, "Operations loaded.", 200, { page, limit, total: result.total, pages: result.pages }); }
export async function create(req: Request, res: Response) { return success(res, await service.create(String(req.params.type), req.body), "Operation record created successfully.", 201); }
export async function update(req: Request, res: Response) { return success(res, await service.update(String(req.params.type), String(req.params.id), req.body), "Operation record updated successfully."); }
export async function remove(req: Request, res: Response) { await service.remove(String(req.params.type), String(req.params.id)); return success(res, null, "Operation record deleted successfully."); }
