import type { Request, Response } from "express";
import * as taskService from "../services/task.service.js";
import { pagination } from "../utils/query.js";
import { success } from "../utils/response.js";

export async function list(req: Request, res: Response) {
  const { page, limit } = pagination(req);
  const result = await taskService.listTasks({ page, limit, search: String(req.query.search || ""), status: req.query.status ? String(req.query.status) : undefined, priority: req.query.priority ? String(req.query.priority) : undefined, employee: req.query.employee ? String(req.query.employee) : undefined, startDate: req.query.startDate ? String(req.query.startDate) : undefined, endDate: req.query.endDate ? String(req.query.endDate) : undefined, ownEmployeeId: req.user!.role === "employee" ? req.user!.employeeId : undefined });
  return success(res, result.items, "Tasks loaded.", 200, { page, limit, total: result.total, pages: result.pages });
}
export async function get(req: Request, res: Response) { return success(res, await taskService.getTask(String(req.params.id), req.user)); }
export async function create(req: Request, res: Response) { return success(res, await taskService.createTask(req.body, req.user!.id), "Task created successfully.", 201); }
export async function update(req: Request, res: Response) { return success(res, await taskService.updateTask(String(req.params.id), req.body), "Task updated successfully."); }
export async function progress(req: Request, res: Response) { return success(res, await taskService.updateProgress(String(req.params.id), req.body, req.user!), "Task progress updated successfully."); }
export async function remove(req: Request, res: Response) { await taskService.deleteTask(String(req.params.id)); return success(res, null, "Task deleted successfully."); }
