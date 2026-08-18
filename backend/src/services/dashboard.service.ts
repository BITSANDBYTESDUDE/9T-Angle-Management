import { Attendance, DailyReport, Employee, Listing, Notification, Order, Product, Target, Task } from "../models/index.js";
import { endOfDay, startOfDay, startOfMonth, startOfWeek } from "../utils/dates.js";
import { calculate } from "./performance.service.js";
import { markOverdue } from "./task.service.js";

export async function adminDashboard() {
  await markOverdue();
  const start = startOfDay(); const end = endOfDay();
  const monthStart = startOfMonth();
  const [totalEmployees, activeEmployees, employees, tasks, targets, attendance, reports, operationCounts] = await Promise.all([
    Employee.countDocuments(), Employee.countDocuments({ status: "active" }),
    Employee.find({ status: "active" }).select("fullName profileImage position role").populate("role").lean(),
    Task.find({ startDate: { $lte: end }, dueDate: { $gte: start }, status: { $ne: "cancelled" } }).select("assignedTo status targetQuantity completedQuantity dueDate").lean(),
    Target.find({ startDate: { $lte: end }, endDate: { $gte: start }, isActive: true }).select("employee targetQuantity completedQuantity metric").lean(),
    Attendance.find({ date: { $gte: start, $lte: end } }).select("employee status checkIn checkOut").lean(),
    DailyReport.find({ date: { $gte: start, $lte: end } }).select("employee status").lean(),
    Promise.all([Product.countDocuments({ date: { $gte: monthStart } }), Listing.countDocuments({ date: { $gte: monthStart } }), Order.countDocuments({ orderDate: { $gte: monthStart } })])
  ]);
  const completed = tasks.filter((task) => task.status === "completed").length;
  const pending = tasks.filter((task) => ["pending", "in-progress"].includes(task.status)).length;
  const overdue = await Task.countDocuments({ status: "overdue" });
  const team = await Promise.all(employees.map(async (employee) => {
    const employeeTargets = targets.filter((target) => String(target.employee) === String(employee._id));
    const target = employeeTargets.reduce((sum, item) => sum + item.targetQuantity, 0);
    const done = employeeTargets.reduce((sum, item) => sum + item.completedQuantity, 0);
    const perf = await calculate(String(employee._id), "daily");
    const report = reports.find((item) => String(item.employee) === String(employee._id));
    const present = attendance.find((item) => String(item.employee) === String(employee._id));
    return { employee, target, completed: done, remaining: Math.max(0, target - done), progress: target ? Math.round(done / target * 1000) / 10 : 0, performanceScore: perf.overallScore, performanceStatus: perf.rating, attendance: present?.status || "not-checked-in", reportStatus: report?.status || "missing" };
  }));
  const monthlyPerformance = await Promise.all(employees.map((employee) => calculate(String(employee._id), "monthly")));
  const averagePerformance = monthlyPerformance.length ? Math.round(monthlyPerformance.reduce((sum, item) => sum + item.overallScore, 0) / monthlyPerformance.length * 10) / 10 : 0;
  return {
    stats: { totalEmployees, activeEmployees, tasksToday: tasks.length, completedTasks: completed, pendingTasks: pending, overdueTasks: overdue, teamCompletionRate: tasks.length ? Math.round(completed / tasks.length * 1000) / 10 : 0, averagePerformance, workingToday: attendance.filter((a) => !["absent", "leave"].includes(a.status)).length, reportsSubmitted: reports.filter((r) => r.status !== "draft").length },
    team, operations: { products: operationCounts[0], listings: operationCounts[1], orders: operationCounts[2] }
  };
}
export async function employeeDashboard(employeeId: string, userId: string) {
  await markOverdue();
  const start = startOfDay(); const end = endOfDay(); const weekStart = startOfWeek();
  const [employee, tasks, targets, attendance, report, unread, dailyPerformance, weeklyPerformance] = await Promise.all([
    Employee.findById(employeeId).populate("role department").lean(),
    Task.find({ assignedTo: employeeId, startDate: { $lte: end }, dueDate: { $gte: start }, status: { $ne: "cancelled" } }).sort({ dueDate: 1 }),
    Target.find({ employee: employeeId, startDate: { $lte: end }, endDate: { $gte: start }, isActive: true }),
    Attendance.findOne({ employee: employeeId, date: { $gte: start, $lte: end } }).lean(),
    DailyReport.findOne({ employee: employeeId, date: { $gte: start, $lte: end } }).lean(),
    Notification.countDocuments({ recipient: userId, read: false }),
    calculate(employeeId, "daily"), calculate(employeeId, "weekly")
  ]);
  const target = targets.reduce((sum, item) => sum + item.targetQuantity, 0);
  const completed = targets.reduce((sum, item) => sum + item.completedQuantity, 0);
  return { employee, stats: { tasksToday: tasks.length, target, completed, remaining: Math.max(0, target - completed), progress: target ? Math.round(completed / target * 1000) / 10 : 0, performanceScore: dailyPerformance.overallScore, weeklyProgress: weeklyPerformance.metrics.targetAchievement, unreadNotifications: unread }, tasks, targets, attendance, report, dailyPerformance, weeklyPerformance };
}
