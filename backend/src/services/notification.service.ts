import { Notification, User } from "../models/index.js";

export async function notifyUser(recipient: string, type: string, title: string, message: string, link = "", data: Record<string, unknown> = {}) {
  return Notification.create({ recipient, type, title, message, link, data });
}

export async function notifyEmployee(employeeId: string, type: string, title: string, message: string, link = "", data: Record<string, unknown> = {}) {
  const user = await User.findOne({ employee: employeeId }).select("_id").lean();
  if (user) return notifyUser(String(user._id), type, title, message, link, data);
}

export async function announce(title: string, message: string) {
  const users = await User.find({ isActive: true }).select("_id").lean();
  return Notification.insertMany(users.map((user) => ({ recipient: user._id, type: "announcement", title, message, link: "/notifications" })));
}
