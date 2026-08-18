import { Employee, Target, Task } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { escapeRegex } from "../utils/query.js";
import { notifyEmployee } from "./notification.service.js";

const populate = [{ path: "assignedTo", select: "fullName profileImage position", populate: { path: "user", select: "email" } }, { path: "createdBy", select: "email authRole" }];
export async function markOverdue() {
  const result = await Task.updateMany({ dueDate: { $lt: new Date() }, status: { $in: ["pending", "in-progress"] } }, { $set: { status: "overdue" } });
  return result.modifiedCount;
}

type TaskList = { page: number; limit: number; search?: string; status?: string; priority?: string; employee?: string; startDate?: string; endDate?: string; ownEmployeeId?: string };
export async function listTasks(options: TaskList) {
  await markOverdue();
  const filter: Record<string, any> = {};
  if (options.ownEmployeeId) filter.assignedTo = options.ownEmployeeId;
  else if (options.employee) filter.assignedTo = options.employee;
  if (options.status) filter.status = options.status;
  if (options.priority) filter.priority = options.priority;
  if (options.search) filter.$or = [{ title: new RegExp(escapeRegex(options.search), "i") }, { taskType: new RegExp(escapeRegex(options.search), "i") }];
  if (options.startDate || options.endDate) {
    filter.dueDate = {};
    if (options.startDate) filter.dueDate.$gte = new Date(options.startDate);
    if (options.endDate) { const end = new Date(options.endDate); end.setHours(23, 59, 59, 999); filter.dueDate.$lte = end; }
  }
  const [items, total] = await Promise.all([
    Task.find(filter).populate(populate).sort({ dueDate: 1, priority: -1 }).skip((options.page - 1) * options.limit).limit(options.limit),
    Task.countDocuments(filter)
  ]);
  return { items, total, pages: Math.ceil(total / options.limit) || 1 };
}
export async function getTask(id: string, requester: Express.Request["user"]) {
  await markOverdue();
  const task = await Task.findById(id).populate(populate);
  if (!task) throw new ApiError(404, "Task not found.");
  if (requester?.role === "employee" && String((task.assignedTo as any)._id || task.assignedTo) !== requester.employeeId) throw new ApiError(403, "You can only view your assigned tasks.");
  return task;
}
export async function createTask(input: any, userId: string) {
  if (!(await Employee.exists({ _id: input.assignedTo, status: "active" }))) throw new ApiError(422, "Assign this task to an active employee.");
  const task = await Task.create({ ...input, createdBy: userId });
  await notifyEmployee(input.assignedTo, "task-assigned", "New task assigned", input.title, `/tasks/${task._id}`, { taskId: task._id });
  return getTask(String(task._id), { id: userId, role: "admin" });
}
export async function updateTask(id: string, input: any) {
  const original = await Task.findById(id);
  if (!original) throw new ApiError(404, "Task not found.");
  if (input.completedQuantity !== undefined) delete input.completedQuantity;
  const nextStart = input.startDate ? new Date(input.startDate) : original.startDate;
  const nextDue = input.dueDate ? new Date(input.dueDate) : original.dueDate;
  if (nextDue < nextStart) throw new ApiError(422, "Due date must be after the task start date.");
  if (input.targetQuantity !== undefined && input.targetQuantity < original.completedQuantity) throw new ApiError(422, "Target quantity cannot be lower than work already completed.");
  if (input.assignedTo && String(input.assignedTo) !== String(original.assignedTo) && original.completedQuantity > 0) throw new ApiError(409, "A task with recorded progress cannot be reassigned. Create a new task or reset progress first.");
  if (input.status === "completed" && original.completedQuantity < (input.targetQuantity || original.targetQuantity)) throw new ApiError(422, "Update progress to the target before marking this task complete.");
  const task = await Task.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (input.assignedTo && String(input.assignedTo) !== String(original.assignedTo)) await notifyEmployee(input.assignedTo, "task-assigned", "Task assigned to you", task!.title, `/tasks/${id}`, { taskId: id });
  return getTask(id, { id: "", role: "admin" });
}
export async function updateProgress(id: string, input: any, requester: NonNullable<Express.Request["user"]>) {
  const task = await Task.findById(id);
  if (!task) throw new ApiError(404, "Task not found.");
  if (requester.role === "employee" && String(task.assignedTo) !== requester.employeeId) throw new ApiError(403, "You can only update your assigned tasks.");
  if (["cancelled"].includes(task.status)) throw new ApiError(409, "A cancelled task cannot be updated.");
  const canExceed = requester.role === "admin" && (input.allowOverTarget === true || task.allowOverTarget);
  if (input.quantity > task.targetQuantity && !canExceed) throw new ApiError(422, `Completed quantity cannot exceed the target of ${task.targetQuantity}.`);
  const delta = input.quantity - task.completedQuantity;
  task.completedQuantity = input.quantity;
  if (input.quantity >= task.targetQuantity) { task.status = "completed"; task.completionDate = new Date(); }
  else { task.status = input.status || (input.quantity > 0 ? "in-progress" : "pending"); task.completionDate = undefined; }
  task.progressHistory.push({ quantity: input.quantity, note: input.note || "", status: task.status, evidence: input.evidence || [], updatedBy: requester.id } as any);
  await task.save();
  if (delta !== 0) {
    const now = new Date();
    await Target.updateMany({ employee: task.assignedTo, isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }, [{ $set: { completedQuantity: { $max: [0, { $add: ["$completedQuantity", delta] }] } } }]);
  }
  return getTask(id, requester);
}
export async function deleteTask(id: string) {
  const task = await Task.findByIdAndDelete(id);
  if (!task) throw new ApiError(404, "Task not found.");
  if (task.completedQuantity > 0) {
    const now = new Date();
    await Target.updateMany({ employee: task.assignedTo, isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }, [{ $set: { completedQuantity: { $max: [0, { $subtract: ["$completedQuantity", task.completedQuantity] }] } } }]);
  }
}
