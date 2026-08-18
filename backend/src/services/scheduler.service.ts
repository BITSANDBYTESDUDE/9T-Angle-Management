import { DailyReport, Employee, Notification, Settings, Target, Task, User } from "../models/index.js";
import { startOfDay } from "../utils/dates.js";
import { markOverdue } from "./task.service.js";
import { notifyEmployee } from "./notification.service.js";

async function notifyOnce(employeeId: string, type: string, title: string, message: string, link: string, key: Record<string, unknown>) {
  const user = await User.findOne({ employee: employeeId }).select("_id").lean(); if (!user) return;
  if (!(await Notification.exists({ recipient: user._id, type, ...Object.fromEntries(Object.entries(key).map(([k, v]) => [`data.${k}`, v])) }))) await notifyEmployee(employeeId, type, title, message, link, key);
}
export async function runScheduledJobs() {
  await markOverdue();
  const now = new Date(); const in24 = new Date(now.getTime() + 86400000); const today = startOfDay(now);
  const tasks = await Task.find({ status: { $in: ["pending", "in-progress", "overdue"] }, dueDate: { $lte: in24 } }).select("_id title assignedTo status dueDate").lean();
  for (const task of tasks) await notifyOnce(String(task.assignedTo), task.status === "overdue" ? "overdue" : "deadline", task.status === "overdue" ? "Task overdue" : "Deadline approaching", task.title, `/tasks/${task._id}`, { taskId: String(task._id), state: task.status });
  const endedTargets = await Target.find({ isActive: true, endDate: { $lt: now }, $expr: { $lt: ["$completedQuantity", "$targetQuantity"] } }).select("_id employee").lean();
  for (const target of endedTargets) { await Target.findByIdAndUpdate(target._id, { isActive: false }); await notifyOnce(String(target.employee), "target", "Target not achieved", "Your target period ended below the expected quantity.", "/targets", { targetId: String(target._id) }); }
  const settings = await Settings.findOne({ key: "organization" }).lean();
  if (now.getHours() >= (settings?.reportReminderHour || 16)) {
    const employees = await Employee.find({ status: "active" }).select("_id").lean();
    const reports = await DailyReport.find({ date: today }).select("employee").lean(); const reported = new Set(reports.map((r) => String(r.employee)));
    for (const employee of employees) if (!reported.has(String(employee._id))) await notifyOnce(String(employee._id), "report-reminder", "Daily report reminder", "Please submit your daily work report before the end of your shift.", "/reports", { date: today.toISOString().slice(0, 10) });
  }
}
