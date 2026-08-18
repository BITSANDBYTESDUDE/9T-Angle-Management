import { Attendance, Employee, Target, Task } from "../models/index.js";
import { endOfDay, startOfDay, startOfMonth, startOfWeek } from "../utils/dates.js";
import { calculate } from "./performance.service.js";
import { markOverdue } from "./task.service.js";

export function analyticsRange(filter: string, customStart?: string, customEnd?: string) {
  const now = new Date(); let start: Date; let end = endOfDay(now);
  if (filter === "today") start = startOfDay(now);
  else if (filter === "week") start = startOfWeek(now);
  else if (filter === "last-month") { start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)); end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)); }
  else if (filter === "custom" && customStart && customEnd) { start = startOfDay(customStart); end = endOfDay(customEnd); }
  else start = startOfMonth(now);
  return { start, end };
}
export async function analytics(filter = "month", customStart?: string, customEnd?: string) {
  await markOverdue();
  const { start, end } = analyticsRange(filter, customStart, customEnd);
  const [tasks, targets, attendance, employees] = await Promise.all([
    Task.find({ dueDate: { $gte: start, $lte: end } }).select("status dueDate targetQuantity completedQuantity assignedTo").lean(),
    Target.find({ startDate: { $lte: end }, endDate: { $gte: start } }).select("targetQuantity completedQuantity employee").lean(),
    Attendance.find({ date: { $gte: start, $lte: end } }).select("status date employee").lean(),
    Employee.find({ status: "active" }).select("fullName profileImage position").lean()
  ]);
  const days: Array<{ date: string; completed: number; target: number; rate: number }> = [];
  const cursor = startOfDay(start);
  while (cursor <= end && days.length < 93) {
    const dayStart = startOfDay(cursor); const dayEnd = endOfDay(cursor);
    const dayTasks = tasks.filter((task) => task.dueDate >= dayStart && task.dueDate <= dayEnd);
    const target = dayTasks.reduce((sum, task) => sum + task.targetQuantity, 0);
    const completed = dayTasks.reduce((sum, task) => sum + task.completedQuantity, 0);
    days.push({ date: dayStart.toISOString().slice(0, 10), completed, target, rate: target ? Math.round(completed / target * 1000) / 10 : 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  const comparison = await Promise.all(employees.map(async (employee) => {
    const result = await calculate(String(employee._id), "monthly", start, end, false);
    return { employee, targetAchievement: result.metrics.targetAchievement, taskCompletion: result.metrics.taskCompletion, attendance: result.metrics.attendance, performanceScore: result.overallScore };
  }));
  const countBy = (values: Array<{ status: string }>, statuses: string[]) => statuses.map((status) => ({ name: status, value: values.filter((item) => item.status === status).length }));
  const targetAnalytics = [
    { name: "achieved", value: targets.filter((t) => t.completedQuantity >= t.targetQuantity).length },
    { name: "partial", value: targets.filter((t) => t.completedQuantity > 0 && t.completedQuantity < t.targetQuantity).length },
    { name: "missed", value: targets.filter((t) => t.completedQuantity === 0).length }
  ];
  return { range: { start, end }, productivity: days, employeeComparison: comparison.sort((a, b) => b.performanceScore - a.performanceScore), taskAnalytics: countBy(tasks, ["completed", "in-progress", "pending", "overdue", "cancelled"]), targetAnalytics, attendanceAnalytics: countBy(attendance, ["present", "late", "absent", "half-day", "leave"]) };
}
