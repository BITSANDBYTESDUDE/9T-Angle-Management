import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { Attendance, DailyReport, Department, Employee, Listing, Notification, Order, Performance, Product, Role, Settings, Target, Task, User, WeeklyReport } from "../models/index.js";
import { endOfDay, startOfDay, startOfMonth, startOfWeek } from "../utils/dates.js";
import { calculate } from "../services/performance.service.js";

if (env.NODE_ENV === "production") throw new Error("The development seed cannot run in production.");
const password = "Angle@2026";
const daysAgo = (days: number, hour = 9) => { const d = new Date(); d.setDate(d.getDate() - days); d.setHours(hour, 0, 0, 0); return d; };
async function seed() {
  await connectDatabase();
  await Promise.all([Attendance.deleteMany({}), DailyReport.deleteMany({}), WeeklyReport.deleteMany({}), Performance.deleteMany({}), Notification.deleteMany({}), Target.deleteMany({}), Task.deleteMany({}), Listing.deleteMany({}), Order.deleteMany({}), Product.deleteMany({}), Employee.deleteMany({}), User.deleteMany({}), Role.deleteMany({}), Department.deleteMany({}), Settings.deleteMany({})]);
  const roles = await Role.insertMany([
    { name: "Product Researcher", description: "Finds profitable products and validates suppliers.", isSystem: true },
    { name: "eBay Listing Specialist", description: "Creates accurate, optimized eBay listings.", isSystem: true },
    { name: "Order Processing Specialist", description: "Processes customer orders accurately.", isSystem: true },
    { name: "Dispatch Specialist", description: "Coordinates dispatch and tracking.", isSystem: true },
    { name: "Customer Support", description: "Resolves customer queries and cases.", isSystem: true },
    { name: "Other", description: "General e-commerce operations.", isSystem: true }
  ]);
  const departments = await Department.insertMany([
    { name: "Product Research", description: "Product sourcing and market validation." },
    { name: "eBay Operations", description: "Listings, orders and account operations." },
    { name: "Fulfilment", description: "Order processing and dispatch." }
  ]);
  await Settings.create({ key: "organization", organizationName: "9T-Angle", timezone: "UTC", workdayStart: "09:00", lateAfterMinutes: 15, performanceWeights: { taskCompletion: 30, targetAchievement: 30, onTimeCompletion: 15, attendance: 15, reportSubmission: 10 } });
  const admin = await User.create({ email: "admin@9tangle.com", password, authRole: "admin" });
  const profiles = [
    { fullName: "Ahmed Khan", email: "ahmed@9tangle.com", position: "Senior Product Researcher", role: roles[0], department: departments[0] },
    { fullName: "Sara Malik", email: "sara@9tangle.com", position: "Product Researcher", role: roles[0], department: departments[0] },
    { fullName: "Usman Ali", email: "usman@9tangle.com", position: "Listing Specialist", role: roles[1], department: departments[1] },
    { fullName: "Hira Noor", email: "hira@9tangle.com", position: "Dispatch Specialist", role: roles[3], department: departments[2] },
    { fullName: "Bilal Raza", email: "bilal@9tangle.com", position: "E-commerce Assistant", role: roles[5], department: departments[1] }
  ];
  const employees: any[] = [];
  for (const profile of profiles) {
    const user = await User.create({ email: profile.email, password, authRole: "employee" });
    const employee = await Employee.create({ user: user._id, fullName: profile.fullName, phone: "+92 300 555 01" + (employees.length + 1), role: profile.role._id, department: profile.department._id, position: profile.position, joiningDate: daysAgo(120 + employees.length * 14), status: "active", workingHours: { start: "09:00", end: "17:00", hoursPerDay: 8 } });
    user.employee = employee._id; await user.save({ validateBeforeSave: false }); employees.push(employee);
  }
  const todayStart = startOfDay(); const todayEnd = endOfDay(); const weekStart = startOfWeek(); const monthStart = startOfMonth();
  const taskTemplates = [
    ["Research profitable home products", "Product Research", 30], ["Validate supplier margins", "Product Research", 20],
    ["Research trending garden products", "Product Research", 30], ["Review competitor pricing", "Product Research", 20],
    ["Create optimized eBay listings", "eBay Listing", 20], ["Resolve listing quality errors", "eBay Listing", 10],
    ["Dispatch ready customer orders", "Dispatch", 25], ["Upload tracking numbers", "Dispatch", 25],
    ["Process eBay customer orders", "Order Processing", 22], ["Review account exceptions", "Other", 12]
  ];
  const createdTasks: any[] = [];
  for (let i = 0; i < employees.length; i++) {
    const pair = taskTemplates.slice(i * 2, i * 2 + 2);
    for (let j = 0; j < pair.length; j++) {
      const [title, taskType, target] = pair[j] as [string, string, number]; const completed = Math.max(0, Math.round(target * ([.87, .73, .95, .68, .82][i] - j * .1)));
      createdTasks.push(await Task.create({ title, description: `Complete today's ${taskType.toLowerCase()} workload with accurate notes and evidence.`, taskType, assignedTo: employees[i]._id, createdBy: admin._id, priority: j ? "medium" : i === 3 ? "urgent" : "high", startDate: todayStart, dueDate: new Date(todayEnd.getTime() - (j ? 0 : 2 * 3600000)), targetQuantity: target, completedQuantity: completed, estimatedHours: j ? 2 : 5, instructions: "Follow the current account SOP and flag any blockers immediately.", status: completed >= target ? "completed" : completed > 0 ? "in-progress" : "pending", ...(completed >= target ? { completionDate: new Date() } : {}) }));
    }
    await Target.insertMany([
      { employee: employees[i]._id, role: profiles[i].role._id, targetType: "daily", metric: profiles[i].position.includes("Research") ? "products" : profiles[i].position.includes("Listing") ? "listings" : profiles[i].position.includes("Dispatch") ? "orders" : "units", targetQuantity: Number(taskTemplates[i * 2][2]), completedQuantity: createdTasks[i * 2].completedQuantity, startDate: todayStart, endDate: todayEnd, description: "Today's primary output target", createdBy: admin._id },
      { employee: employees[i]._id, role: profiles[i].role._id, targetType: "weekly", metric: "units", targetQuantity: Number(taskTemplates[i * 2][2]) * 5, completedQuantity: Math.round(Number(taskTemplates[i * 2][2]) * 3.6), startDate: weekStart, endDate: new Date(weekStart.getTime() + 7 * 86400000 - 1), description: "Current weekly output target", createdBy: admin._id },
      { employee: employees[i]._id, role: profiles[i].role._id, targetType: "monthly", metric: "units", targetQuantity: Number(taskTemplates[i * 2][2]) * 22, completedQuantity: Math.round(Number(taskTemplates[i * 2][2]) * 12.5), startDate: monthStart, endDate: endOfDay(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)), description: "Current monthly output target", createdBy: admin._id }
    ]);
  }
  for (let day = 0; day < 12; day++) {
    const date = daysAgo(day, 0); if ([0, 6].includes(date.getDay())) continue;
    for (let i = 0; i < employees.length; i++) {
      const checkIn = daysAgo(day, i === 1 && day % 3 === 0 ? 9 : 8); checkIn.setMinutes(i === 1 && day % 3 === 0 ? 28 : 55 + i);
      const checkOut = new Date(checkIn.getTime() + (7.5 + (i % 3) * .25) * 3600000);
      await Attendance.create({ employee: employees[i]._id, date: startOfDay(date), checkIn, checkOut, totalWorkingHours: Math.round((checkOut.getTime() - checkIn.getTime()) / 36000) / 100, status: checkIn.getHours() >= 9 && checkIn.getMinutes() > 15 ? "late" : "present", updatedBy: admin._id });
      if (!(i === 4 && day % 4 === 0)) await DailyReport.create({ date: startOfDay(date), employee: employees[i]._id, tasksCompleted: day === 0 ? createdTasks.filter((t) => String(t.assignedTo) === String(employees[i]._id) && t.status === "completed").map((t) => t._id) : [], targetAchieved: Math.round(20 + i * 2 + day / 2), productsResearched: i < 2 ? 24 + i : 0, listingsCreated: i === 2 ? 18 : 0, ordersProcessed: i >= 3 ? 20 + i : 0, otherCompletedWork: "Completed account checks and updated shared tracking sheets.", problemsFaced: day % 5 === 0 ? "Two supplier pages were temporarily unavailable." : "", notes: "Quality checks completed before submission.", tomorrowPlan: "Continue priority queue and close remaining items.", totalWorkingHours: 7.5 + (i % 3) * .25, status: day === 0 ? "submitted" : "reviewed", submittedAt: daysAgo(day, 17), ...(day > 0 ? { reviewedAt: daysAgo(day - 1, 10), reviewedBy: admin._id, feedback: "Good work. Maintain accuracy and pace." } : {}) });
    }
  }
  const products = await Product.insertMany([
    { productName: "Rechargeable Cabinet Lights", productUrl: "https://www.ebay.com/sch/i.html?_nkw=rechargeable+cabinet+lights", sourceUrl: "https://www.aliexpress.com/", costPrice: 8.4, sellingPrice: 24.99, competition: "medium", researcher: employees[0]._id, status: "approved", notes: "Strong margin and stable demand." },
    { productName: "Silicone Air Fryer Liners", productUrl: "https://www.ebay.com/sch/i.html?_nkw=air+fryer+liners", sourceUrl: "https://www.aliexpress.com/", costPrice: 2.2, sellingPrice: 9.99, competition: "high", researcher: employees[1]._id, status: "listed", notes: "Bundle as a pack of two." }
  ]);
  await Listing.create({ product: products[1]._id, sku: "9TA-AFL-002", ebayAccount: "9T Home Store", listingTitle: "Reusable Silicone Air Fryer Liner Set of 2", category: "Home & Garden", price: 9.99, employee: employees[2]._id, status: "listed" });
  await Order.create({ orderId: "EB-1049281", product: products[1]._id, ebayAccount: "9T Home Store", customer: "J. Smith", orderDate: daysAgo(1), dispatchDeadline: todayEnd, assignedEmployee: employees[3]._id, status: "processing", notes: "Use tracked 48 service." });
  await Notification.insertMany(employees.map((employee, i) => ({ recipient: employee.user, type: "task-assigned", title: "Today's work is ready", message: `You have ${createdTasks.filter((t) => String(t.assignedTo) === String(employee._id)).length} assigned tasks.`, link: "/tasks", read: i % 2 === 0 })));
  for (const employee of employees) { await calculate(String(employee._id), "daily"); await calculate(String(employee._id), "weekly"); await calculate(String(employee._id), "monthly"); }
  console.info("\nSeed completed.\nAdmin: admin@9tangle.com / " + password + "\nEmployee: ahmed@9tangle.com / " + password + "\n");
}
seed().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => disconnectDatabase());
