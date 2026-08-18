import { Employee, Target } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";

type Options = { page: number; limit: number; employee?: string; targetType?: string; active?: string; ownEmployeeId?: string };
export async function listTargets(options: Options) {
  const filter: Record<string, unknown> = {};
  if (options.ownEmployeeId) filter.employee = options.ownEmployeeId;
  else if (options.employee) filter.employee = options.employee;
  if (options.targetType) filter.targetType = options.targetType;
  if (options.active !== undefined && options.active !== "") filter.isActive = options.active === "true";
  const [items, total] = await Promise.all([
    Target.find(filter).populate("employee", "fullName profileImage position").populate("role").sort({ startDate: -1 }).skip((options.page - 1) * options.limit).limit(options.limit),
    Target.countDocuments(filter)
  ]);
  return { items, total, pages: Math.ceil(total / options.limit) || 1 };
}
export async function createTarget(input: any, userId: string) {
  if (!(await Employee.exists({ _id: input.employee, status: "active" }))) throw new ApiError(422, "Select an active employee.");
  return (await Target.create({ ...input, createdBy: userId })).populate(["employee", "role"]);
}
export async function updateTarget(id: string, input: any) {
  const target = await Target.findByIdAndUpdate(id, input, { new: true, runValidators: true }).populate("employee", "fullName profileImage position").populate("role");
  if (!target) throw new ApiError(404, "Target not found.");
  return target;
}
export async function deleteTarget(id: string) {
  const target = await Target.findByIdAndDelete(id);
  if (!target) throw new ApiError(404, "Target not found.");
}
