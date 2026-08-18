import { DailyReport, Employee, Task } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { endOfDay, startOfDay } from "../utils/dates.js";
import { notifyEmployee } from "./notification.service.js";

type Options = { page: number; limit: number; employee?: string; status?: string; startDate?: string; endDate?: string; ownEmployeeId?: string };
export async function listReports(options: Options) {
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
    DailyReport.find(filter).populate("employee", "fullName profileImage position").populate("tasksCompleted", "title targetQuantity completedQuantity status").populate("reviewedBy", "email").sort({ date: -1 }).skip((options.page - 1) * options.limit).limit(options.limit),
    DailyReport.countDocuments(filter)
  ]);
  return { items, total, pages: Math.ceil(total / options.limit) || 1 };
}
export async function getReport(id: string, requester: NonNullable<Express.Request["user"]>) {
  const report = await DailyReport.findById(id).populate("employee", "fullName profileImage position").populate("tasksCompleted", "title targetQuantity completedQuantity status").populate("reviewedBy", "email");
  if (!report) throw new ApiError(404, "Daily report not found.");
  if (requester.role === "employee" && String((report.employee as any)._id || report.employee) !== requester.employeeId) throw new ApiError(403, "You can only view your own reports.");
  return report;
}
export async function createReport(input: any, requester: NonNullable<Express.Request["user"]>) {
  const employeeId = requester.role === "employee" ? requester.employeeId : input.employee;
  if (!employeeId || !(await Employee.exists({ _id: employeeId }))) throw new ApiError(422, "A valid employee is required.");
  const date = startOfDay(input.date);
  if (requester.role === "employee" && date > startOfDay()) throw new ApiError(422, "You cannot submit a report for a future date.");
  if (input.tasksCompleted?.length) {
    const ownedTasks = await Task.countDocuments({ _id: { $in: input.tasksCompleted }, assignedTo: employeeId });
    if (ownedTasks !== new Set(input.tasksCompleted.map(String)).size) throw new ApiError(422, "A report can include only tasks assigned to that employee.");
  }
  const report = await DailyReport.create({ ...input, employee: employeeId, date, ...(input.status === "submitted" ? { submittedAt: new Date() } : {}) });
  return getReport(String(report._id), requester);
}
export async function updateReport(id: string, input: any, requester: NonNullable<Express.Request["user"]>) {
  const report = await DailyReport.findById(id);
  if (!report) throw new ApiError(404, "Daily report not found.");
  if (requester.role === "employee" && String(report.employee) !== requester.employeeId) throw new ApiError(403, "You can only edit your own reports.");
  if (requester.role === "employee" && report.status === "reviewed") throw new ApiError(409, "An approved report cannot be changed.");
  if (requester.role === "employee" && !["draft", "rejected"].includes(report.status)) throw new ApiError(409, "A submitted report cannot be changed until a manager requests a correction.");
  if (input.tasksCompleted?.length) {
    const ownedTasks = await Task.countDocuments({ _id: { $in: input.tasksCompleted }, assignedTo: report.employee });
    if (ownedTasks !== new Set(input.tasksCompleted.map(String)).size) throw new ApiError(422, "A report can include only tasks assigned to that employee.");
  }
  Object.assign(report, input);
  if (input.date) report.date = startOfDay(input.date);
  if (input.status === "submitted") report.submittedAt = new Date();
  await report.save();
  return getReport(id, requester);
}
export async function reviewReport(id: string, action: "approve" | "reject" | "request-correction", feedback: string, reviewerId: string) {
  const report = await DailyReport.findById(id);
  if (!report) throw new ApiError(404, "Daily report not found.");
  if (report.status === "draft") throw new ApiError(409, "A draft report cannot be reviewed.");
  report.status = action === "approve" ? "reviewed" : "rejected";
  report.feedback = feedback;
  report.reviewedAt = new Date();
  report.reviewedBy = reviewerId as any;
  await report.save();
  const approved = action === "approve";
  await notifyEmployee(String(report.employee), approved ? "report-approved" : "report-rejected", approved ? "Daily report approved" : "Report needs attention", feedback, `/reports/${id}`, { reportId: id });
  return getReport(id, { id: reviewerId, role: "admin" });
}
export async function deleteReport(id: string, requester: NonNullable<Express.Request["user"]>) {
  const report = await DailyReport.findById(id);
  if (!report) throw new ApiError(404, "Daily report not found.");
  if (requester.role === "employee" && (String(report.employee) !== requester.employeeId || report.status !== "draft")) throw new ApiError(403, "Only your draft reports can be deleted.");
  await report.deleteOne();
}
