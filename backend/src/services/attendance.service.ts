import { Attendance, Employee, Settings } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { endOfDay, hoursBetween, startOfDay } from "../utils/dates.js";

type Options = { page: number; limit: number; employee?: string; status?: string; startDate?: string; endDate?: string; ownEmployeeId?: string };
export async function listAttendance(options: Options) {
  const filter: Record<string, any> = {};
  if (options.ownEmployeeId) filter.employee = options.ownEmployeeId;
  else if (options.employee) filter.employee = options.employee;
  if (options.status) filter.status = options.status;
  if (options.startDate || options.endDate) {
    filter.date = {};
    if (options.startDate) filter.date.$gte = startOfDay(options.startDate);
    if (options.endDate) filter.date.$lte = endOfDay(options.endDate);
  }
  const [items, total] = await Promise.all([
    Attendance.find(filter).populate("employee", "fullName profileImage position workingHours").sort({ date: -1 }).skip((options.page - 1) * options.limit).limit(options.limit),
    Attendance.countDocuments(filter)
  ]);
  return { items, total, pages: Math.ceil(total / options.limit) || 1 };
}
export async function checkIn(employeeId: string | undefined, userId: string) {
  if (!employeeId) throw new ApiError(422, "Your account is not linked to an employee profile.");
  const now = new Date();
  const date = startOfDay(now);
  if (await Attendance.exists({ employee: employeeId, date })) throw new ApiError(409, "You have already checked in today.");
  const employee = await Employee.findById(employeeId).lean();
  if (!employee || employee.status !== "active") throw new ApiError(403, "Your employee profile is not active.");
  const settings = await Settings.findOne({ key: "organization" }).lean();
  const [hours, minutes] = (employee.workingHours?.start || settings?.workdayStart || "09:00").split(":").map(Number);
  const lateAt = new Date(date); lateAt.setHours(hours, minutes + (settings?.lateAfterMinutes || 15), 0, 0);
  return Attendance.create({ employee: employeeId, date, checkIn: now, status: now > lateAt ? "late" : "present", updatedBy: userId });
}
export async function checkOut(employeeId: string | undefined) {
  if (!employeeId) throw new ApiError(422, "Your account is not linked to an employee profile.");
  const attendance = await Attendance.findOne({ employee: employeeId, date: startOfDay() });
  if (!attendance?.checkIn) throw new ApiError(409, "Check in before checking out.");
  if (attendance.checkOut) throw new ApiError(409, "You have already checked out today.");
  attendance.checkOut = new Date();
  attendance.totalWorkingHours = hoursBetween(attendance.checkIn, attendance.checkOut);
  const employee = await Employee.findById(employeeId).lean();
  if (attendance.totalWorkingHours < (employee?.workingHours?.hoursPerDay || 8) / 2) attendance.status = "half-day";
  await attendance.save();
  return attendance;
}
export async function upsertAttendance(input: any, userId: string) {
  if (!(await Employee.exists({ _id: input.employee }))) throw new ApiError(422, "Employee not found.");
  const date = startOfDay(input.date);
  const totalWorkingHours = hoursBetween(input.checkIn ? new Date(input.checkIn) : undefined, input.checkOut ? new Date(input.checkOut) : undefined);
  return Attendance.findOneAndUpdate({ employee: input.employee, date }, { ...input, date, totalWorkingHours, updatedBy: userId }, { upsert: true, new: true, runValidators: true }).populate("employee", "fullName profileImage position");
}
