import { z } from "zod";

const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid record id");
const dateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");
const pagination = { page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().min(1).max(100).optional() };

export const loginSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(8) }) });
export const forgotSchema = z.object({ body: z.object({ email: z.string().email() }) });
export const resetSchema = z.object({ params: z.object({ token: z.string().min(20) }), body: z.object({ password: z.string().min(8).max(128) }) });
export const changePasswordSchema = z.object({ body: z.object({ currentPassword: z.string().min(8), newPassword: z.string().min(8).max(128) }) });
export const profileSchema = z.object({ body: z.object({ fullName: z.string().min(2).max(100).optional(), phone: z.string().max(30).optional(), profileImage: z.string().url().or(z.literal("")).optional(), address: z.string().max(300).optional(), timezone: z.string().max(80).optional() }) });

export const employeeCreateSchema = z.object({ body: z.object({
  fullName: z.string().min(2).max(100), email: z.string().email(), phone: z.string().max(30).optional().default(""), password: z.string().min(8).max(128),
  authRole: z.enum(["admin", "manager", "employee"]).default("employee"), role: id, department: id, position: z.string().min(2).max(100), joiningDate: dateString,
  profileImage: z.string().url().or(z.literal("")).optional().default(""), status: z.enum(["active", "disabled"]).default("active"),
  workingHours: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/), hoursPerDay: z.number().min(1).max(24) }).optional()
}) });
export const employeeUpdateSchema = z.object({ params: z.object({ id }), body: employeeCreateSchema.shape.body.omit({ password: true }).partial().extend({ password: z.string().min(8).max(128).optional() }) });
export const idSchema = z.object({ params: z.object({ id }) });

const taskBase = z.object({
  title: z.string().min(2).max(160), description: z.string().max(5000).optional().default(""), taskType: z.string().min(2).max(100), assignedTo: id,
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"), startDate: dateString, dueDate: dateString, targetQuantity: z.coerce.number().positive(),
  estimatedHours: z.coerce.number().min(0).optional().default(0), instructions: z.string().max(5000).optional().default(""), notes: z.string().max(3000).optional().default(""),
  status: z.enum(["pending", "in-progress", "completed", "overdue", "cancelled"]).optional(), allowOverTarget: z.boolean().optional()
});
const taskBody = taskBase.refine((data) => new Date(data.dueDate) >= new Date(data.startDate), { path: ["dueDate"], message: "Due date must be after start date" });
export const taskCreateSchema = z.object({ body: taskBody });
export const taskUpdateSchema = z.object({ params: z.object({ id }), body: taskBase.partial() });
export const taskProgressSchema = z.object({ params: z.object({ id }), body: z.object({ quantity: z.coerce.number().min(0), note: z.string().max(2000).optional().default(""), status: z.enum(["pending", "in-progress", "completed"]).optional(), evidence: z.array(z.object({ url: z.string().url(), publicId: z.string().optional(), name: z.string().optional(), type: z.string().optional(), size: z.number().optional() })).max(5).optional(), allowOverTarget: z.boolean().optional() }) });

const targetBase = z.object({ employee: id, role: id.optional().nullable(), targetType: z.enum(["daily", "weekly", "monthly"]), metric: z.string().min(1).max(80).default("units"), targetQuantity: z.coerce.number().positive(), completedQuantity: z.coerce.number().min(0).optional(), startDate: dateString, endDate: dateString, description: z.string().max(2000).optional().default(""), isActive: z.boolean().optional().default(true) });
const targetBody = targetBase.refine((d) => new Date(d.endDate) >= new Date(d.startDate), { path: ["endDate"], message: "End date must be after start date" });
export const targetCreateSchema = z.object({ body: targetBody });
export const targetUpdateSchema = z.object({ params: z.object({ id }), body: targetBase.partial() });

const reportBody = z.object({ date: dateString, tasksCompleted: z.array(id).optional().default([]), targetAchieved: z.coerce.number().min(0).optional().default(0), productsResearched: z.coerce.number().min(0).optional().default(0), listingsCreated: z.coerce.number().min(0).optional().default(0), ordersProcessed: z.coerce.number().min(0).optional().default(0), otherCompletedWork: z.string().max(4000).optional().default(""), problemsFaced: z.string().max(4000).optional().default(""), notes: z.string().max(4000).optional().default(""), tomorrowPlan: z.string().max(4000).optional().default(""), evidence: z.array(z.object({ url: z.string().url(), publicId: z.string().optional(), name: z.string().optional(), type: z.string().optional(), size: z.number().optional() })).max(5).optional(), totalWorkingHours: z.coerce.number().min(0).max(24), status: z.enum(["draft", "submitted"]).default("submitted"), employee: id.optional() });
export const reportCreateSchema = z.object({ body: reportBody });
export const reportUpdateSchema = z.object({ params: z.object({ id }), body: reportBody.partial() });
export const reportReviewSchema = z.object({ params: z.object({ id }), body: z.object({ action: z.enum(["approve", "reject", "request-correction"]), feedback: z.string().min(2).max(4000) }) });

export const attendanceAdminSchema = z.object({ body: z.object({ employee: id, date: dateString, checkIn: dateString.optional(), checkOut: dateString.optional(), status: z.enum(["present", "late", "absent", "half-day", "leave"]), note: z.string().max(1000).optional() }) });
export const notificationReadSchema = z.object({ params: z.object({ id }) });
export const announcementSchema = z.object({ body: z.object({ title: z.string().min(2).max(120), message: z.string().min(2).max(2000) }) });

export const roleSchema = z.object({ body: z.object({ name: z.string().min(2).max(100), description: z.string().max(1000).optional().default(""), permissions: z.array(z.string()).optional().default([]) }) });
export const departmentSchema = z.object({ body: z.object({ name: z.string().min(2).max(100), description: z.string().max(1000).optional().default(""), manager: id.optional().nullable(), isActive: z.boolean().optional() }) });
export const settingsSchema = z.object({ body: z.object({ organizationName: z.string().min(2).max(100).optional(), timezone: z.string().max(80).optional(), workdayStart: z.string().regex(/^\d{2}:\d{2}$/).optional(), lateAfterMinutes: z.coerce.number().min(0).max(240).optional(), reportReminderHour: z.coerce.number().min(0).max(23).optional(), performanceWeights: z.object({ taskCompletion: z.number().min(0).max(100), targetAchievement: z.number().min(0).max(100), onTimeCompletion: z.number().min(0).max(100), attendance: z.number().min(0).max(100), reportSubmission: z.number().min(0).max(100) }).refine((weights) => Object.values(weights).reduce((a, b) => a + b, 0) === 100, "Performance weights must total 100").optional() }) });

export const operationCreateSchemas = {
  products: z.object({ body: z.object({ productName: z.string().min(2), productUrl: z.string().url(), sourceUrl: z.string().url().or(z.literal("")).optional(), costPrice: z.coerce.number().min(0), sellingPrice: z.coerce.number().min(0), competition: z.enum(["low", "medium", "high"]), researcher: id, status: z.enum(["researching", "approved", "rejected", "listed"]).optional(), notes: z.string().max(2000).optional(), date: dateString.optional() }) }),
  listings: z.object({ body: z.object({ product: id, sku: z.string().min(1), ebayAccount: z.string().min(1), listingTitle: z.string().min(2), category: z.string().min(1), price: z.coerce.number().min(0), employee: id, status: z.enum(["draft", "ready", "listed", "error"]).optional(), date: dateString.optional(), linkedTask: id.optional() }) }),
  orders: z.object({ body: z.object({ orderId: z.string().min(1), product: id, ebayAccount: z.string().min(1), customer: z.string().min(1), orderDate: dateString, dispatchDeadline: dateString, assignedEmployee: id, status: z.enum(["new", "processing", "dispatched", "completed", "problem"]).optional(), notes: z.string().max(2000).optional() }) })
};
export const operationUpdateSchema = z.object({ params: z.object({ id }), body: z.record(z.string(), z.unknown()) });
