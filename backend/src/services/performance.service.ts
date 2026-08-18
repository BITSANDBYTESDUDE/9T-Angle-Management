import { Attendance, DailyReport, Employee, Performance, Settings, Target, Task, WeeklyReport } from "../models/index.js";
import { endOfDay, startOfDay, startOfMonth, startOfWeek } from "../utils/dates.js";
import { ApiError } from "../utils/ApiError.js";

export type PeriodType = "daily" | "weekly" | "monthly";
function expectedWorkdays(start: Date, end: Date) {
  const current = startOfDay(start);
  const effectiveEnd = end < new Date() ? end : new Date();
  let count = 0;
  while (current <= effectiveEnd) { const day = current.getDay(); if (day !== 0 && day !== 6) count++; current.setDate(current.getDate() + 1); }
  return Math.max(1, count);
}
export function ratingFor(score: number) {
  if (score >= 90) return "excellent";
  if (score >= 80) return "very-good";
  if (score >= 70) return "good";
  if (score >= 60) return "needs-improvement";
  return "poor";
}
export function periodRange(type: PeriodType, reference = new Date()) {
  const start = type === "daily" ? startOfDay(reference) : type === "weekly" ? startOfWeek(reference) : startOfMonth(reference);
  let end: Date;
  if (type === "daily") end = endOfDay(reference);
  else if (type === "weekly") { end = endOfDay(start); end.setDate(end.getDate() + 6); }
  else { end = endOfDay(new Date(start.getFullYear(), start.getMonth() + 1, 0)); }
  return { start, end };
}
export async function calculate(employeeId: string, periodType: PeriodType, start?: Date, end?: Date, persist = true) {
  const range = start && end ? { start: startOfDay(start), end: endOfDay(end) } : periodRange(periodType);
  const expected = expectedWorkdays(range.start, range.end);
  const [tasks, targets, attendance, reportCount, settings] = await Promise.all([
    Task.find({ assignedTo: employeeId, dueDate: { $gte: range.start, $lte: range.end }, status: { $ne: "cancelled" } }).select("status completionDate dueDate").lean(),
    Target.find({ employee: employeeId, startDate: { $lte: range.end }, endDate: { $gte: range.start }, isActive: true }).select("targetQuantity completedQuantity").lean(),
    Attendance.find({ employee: employeeId, date: { $gte: range.start, $lte: range.end } }).select("status").lean(),
    DailyReport.countDocuments({ employee: employeeId, date: { $gte: range.start, $lte: range.end }, status: { $in: ["submitted", "reviewed"] } }),
    Settings.findOne({ key: "organization" }).lean()
  ]);
  const completedTasks = tasks.filter((task) => task.status === "completed");
  const onTime = completedTasks.filter((task) => task.completionDate && task.completionDate <= task.dueDate).length;
  const targetTotal = targets.reduce((sum, target) => sum + target.targetQuantity, 0);
  const targetCompleted = targets.reduce((sum, target) => sum + target.completedQuantity, 0);
  const attendedUnits = attendance.reduce((sum, item) => sum + (item.status === "present" ? 1 : item.status === "late" ? .85 : item.status === "half-day" ? .5 : item.status === "leave" ? 1 : 0), 0);
  const metrics = {
    taskCompletion: tasks.length ? Math.min(100, completedTasks.length / tasks.length * 100) : 0,
    targetAchievement: targetTotal ? Math.min(100, targetCompleted / targetTotal * 100) : 0,
    onTimeCompletion: completedTasks.length ? onTime / completedTasks.length * 100 : 0,
    attendance: Math.min(100, attendedUnits / expected * 100),
    reportSubmission: Math.min(100, reportCount / expected * 100)
  };
  Object.keys(metrics).forEach((key) => { metrics[key as keyof typeof metrics] = Math.round(metrics[key as keyof typeof metrics] * 10) / 10; });
  const weights = settings?.performanceWeights || { taskCompletion: 30, targetAchievement: 30, onTimeCompletion: 15, attendance: 15, reportSubmission: 10 };
  const score = Math.round((Object.entries(metrics).reduce((sum, [key, value]) => sum + value * ((weights as any)[key] / 100), 0)) * 10) / 10;
  const result = { employee: employeeId, periodType, periodStart: range.start, periodEnd: range.end, metrics, overallScore: score, rating: ratingFor(score), details: { tasksTotal: tasks.length, tasksCompleted: completedTasks.length, targetTotal, targetCompleted, attendanceDays: attendance.length, expectedDays: expected, reportsSubmitted: reportCount } };
  if (persist) await Performance.findOneAndUpdate({ employee: employeeId, periodType, periodStart: range.start }, { ...result, calculatedAt: new Date() }, { upsert: true, new: true, runValidators: true });
  return result;
}
export async function getPerformance(employeeId: string, type: PeriodType, start?: string, end?: string) {
  if (!(await Employee.exists({ _id: employeeId }))) throw new ApiError(404, "Employee not found.");
  const current = await calculate(employeeId, type, start ? new Date(start) : undefined, end ? new Date(end) : undefined);
  const history = await Performance.find({ employee: employeeId, periodType: type }).sort({ periodStart: -1 }).limit(12).lean();
  return { current, history };
}
export async function teamPerformance(type: PeriodType, start?: Date, end?: Date) {
  const employees = await Employee.find({ status: "active" }).select("fullName profileImage position role department").populate("role department").lean();
  return Promise.all(employees.map(async (employee) => ({ ...(await calculate(String(employee._id), type, start, end)), employee })));
}
export async function generateWeekly(reference = new Date()) {
  const { start, end } = periodRange("weekly", reference);
  const employees = await Employee.find({ status: "active" }).select("_id").lean();
  const output = [];
  for (const employee of employees) {
    const result = await calculate(String(employee._id), "weekly", start, end);
    const weekly = await WeeklyReport.findOneAndUpdate({ employee: employee._id, weekStart: start }, {
      employee: employee._id, weekStart: start, weekEnd: end, weeklyTarget: result.details.targetTotal, completed: result.details.targetCompleted,
      achievementPercentage: result.metrics.targetAchievement, tasksCompleted: result.details.tasksCompleted, tasksMissed: Math.max(0, result.details.tasksTotal - result.details.tasksCompleted),
      attendancePercentage: result.metrics.attendance, averageDailyPerformance: result.overallScore, reportSubmissionRate: result.metrics.reportSubmission, overallScore: result.overallScore, generatedAt: new Date()
    }, { upsert: true, new: true }).populate("employee", "fullName profileImage position");
    output.push(weekly);
  }
  return output;
}
