import { Department, Employee, Role, Task, DailyReport, User } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { escapeRegex } from "../utils/query.js";

type ListOptions = { page: number; limit: number; search?: string; status?: string; role?: string; department?: string };
const populate = [{ path: "user", select: "email authRole isActive lastLoginAt" }, { path: "role" }, { path: "department" }];

export async function listEmployees(options: ListOptions) {
  const filter: Record<string, unknown> = {};
  if (options.status) filter.status = options.status;
  if (options.role) filter.role = options.role;
  if (options.department) filter.department = options.department;
  if (options.search) {
    const regex = new RegExp(escapeRegex(options.search), "i");
    const users = await User.find({ email: regex }).select("_id").lean();
    filter.$or = [{ fullName: regex }, { position: regex }, { user: { $in: users.map((u) => u._id) } }];
  }
  const [items, total] = await Promise.all([
    Employee.find(filter).populate(populate).sort({ createdAt: -1 }).skip((options.page - 1) * options.limit).limit(options.limit).lean(),
    Employee.countDocuments(filter)
  ]);
  return { items, total, page: options.page, pages: Math.ceil(total / options.limit) || 1 };
}

export async function getEmployee(id: string) {
  const employee = await Employee.findById(id).populate(populate).lean();
  if (!employee) throw new ApiError(404, "Employee not found.");
  return employee;
}

export async function createEmployee(input: any) {
  const exists = await User.exists({ email: input.email.toLowerCase() });
  if (exists) throw new ApiError(409, "An account with this email already exists.");
  const [role, department] = await Promise.all([Role.exists({ _id: input.role }), Department.exists({ _id: input.department })]);
  if (!role || !department) throw new ApiError(422, "Select a valid job role and department.");
  const user = await User.create({ email: input.email, password: input.password, authRole: input.authRole, isActive: input.status !== "disabled" });
  try {
    const employee = await Employee.create({ ...input, user: user._id });
    user.employee = employee._id;
    await user.save({ validateBeforeSave: false });
    return getEmployee(String(employee._id));
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
}

export async function updateEmployee(id: string, input: any) {
  const employee = await Employee.findById(id);
  if (!employee) throw new ApiError(404, "Employee not found.");
  const user = await User.findById(employee.user).select("+password");
  if (!user) throw new ApiError(404, "Employee login account not found.");
  if (input.email && input.email.toLowerCase() !== user.email) user.email = input.email;
  if (input.authRole) user.authRole = input.authRole;
  if (input.status) user.isActive = input.status === "active";
  if (input.password) user.password = input.password;
  await user.save();
  const { email: _email, authRole: _authRole, password: _password, ...profile } = input;
  await Employee.findByIdAndUpdate(id, profile, { runValidators: true });
  return getEmployee(id);
}

export async function setEmployeeStatus(id: string, status: "active" | "disabled") {
  const employee = await Employee.findByIdAndUpdate(id, { status }, { new: true });
  if (!employee) throw new ApiError(404, "Employee not found.");
  await User.findByIdAndUpdate(employee.user, { isActive: status === "active" });
  return getEmployee(id);
}

export async function deleteEmployee(id: string) {
  const employee = await Employee.findById(id);
  if (!employee) throw new ApiError(404, "Employee not found.");
  const [tasks, reports] = await Promise.all([Task.countDocuments({ assignedTo: id }), DailyReport.countDocuments({ employee: id })]);
  if (tasks || reports) throw new ApiError(409, "This employee has historical work records and cannot be deleted. Disable the account instead.");
  await Promise.all([Employee.findByIdAndDelete(id), User.findByIdAndDelete(employee.user)]);
}
