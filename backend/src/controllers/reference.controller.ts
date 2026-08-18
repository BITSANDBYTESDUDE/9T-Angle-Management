import type { Request, Response } from "express";
import { Department, Role, Settings } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { success } from "../utils/response.js";
export async function references(_req: Request, res: Response) { const [roles, departments] = await Promise.all([Role.find().sort("name"), Department.find({ isActive: true }).sort("name")]); return success(res, { roles, departments }); }
export async function createRole(req: Request, res: Response) { return success(res, await Role.create(req.body), "Job role created.", 201); }
export async function updateRole(req: Request, res: Response) { const role = await Role.findByIdAndUpdate(String(req.params.id), req.body, { new: true, runValidators: true }); if (!role) throw new ApiError(404, "Role not found."); return success(res, role, "Job role updated."); }
export async function createDepartment(req: Request, res: Response) { return success(res, await Department.create(req.body), "Department created.", 201); }
export async function updateDepartment(req: Request, res: Response) { const item = await Department.findByIdAndUpdate(String(req.params.id), req.body, { new: true, runValidators: true }); if (!item) throw new ApiError(404, "Department not found."); return success(res, item, "Department updated."); }
export async function getSettings(_req: Request, res: Response) { const item = await Settings.findOneAndUpdate({ key: "organization" }, { $setOnInsert: { key: "organization" } }, { upsert: true, new: true }); return success(res, item); }
export async function updateSettings(req: Request, res: Response) { const item = await Settings.findOneAndUpdate({ key: "organization" }, req.body, { upsert: true, new: true, runValidators: true }); return success(res, item, "Settings updated successfully."); }
