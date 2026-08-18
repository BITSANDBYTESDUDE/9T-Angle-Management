import type { Request, Response } from "express";
import * as employeeService from "../services/employee.service.js";
import { pagination } from "../utils/query.js";
import { success } from "../utils/response.js";

export async function list(req: Request, res: Response) {
  const { page, limit } = pagination(req);
  const result = await employeeService.listEmployees({ page, limit, search: String(req.query.search || ""), status: req.query.status ? String(req.query.status) : undefined, role: req.query.role ? String(req.query.role) : undefined, department: req.query.department ? String(req.query.department) : undefined });
  return success(res, result.items, "Employees loaded.", 200, { page, limit, total: result.total, pages: result.pages });
}
export async function get(req: Request, res: Response) { return success(res, await employeeService.getEmployee(String(req.params.id))); }
export async function create(req: Request, res: Response) { return success(res, await employeeService.createEmployee(req.body), "Employee created successfully.", 201); }
export async function update(req: Request, res: Response) { return success(res, await employeeService.updateEmployee(String(req.params.id), req.body), "Employee updated successfully."); }
export async function changeStatus(req: Request, res: Response) { return success(res, await employeeService.setEmployeeStatus(String(req.params.id), req.body.status), `Employee ${req.body.status === "active" ? "activated" : "disabled"} successfully.`); }
export async function remove(req: Request, res: Response) { await employeeService.deleteEmployee(String(req.params.id)); return success(res, null, "Employee deleted successfully."); }
