import type { Request, Response } from "express";
import { Notification } from "../models/index.js";
import { announce } from "../services/notification.service.js";
import { ApiError } from "../utils/ApiError.js";
import { pagination } from "../utils/query.js";
import { success } from "../utils/response.js";
export async function list(req: Request, res: Response) { const { page, limit } = pagination(req); const filter: any = { recipient: req.user!.id }; if (req.query.unread === "true") filter.read = false; const [items, total, unread] = await Promise.all([Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Notification.countDocuments(filter), Notification.countDocuments({ recipient: req.user!.id, read: false })]); return success(res, items, "Notifications loaded.", 200, { page, limit, total, pages: Math.ceil(total / limit) || 1, unread }); }
export async function read(req: Request, res: Response) { const item = await Notification.findOneAndUpdate({ _id: String(req.params.id), recipient: req.user!.id }, { read: true, readAt: new Date() }, { new: true }); if (!item) throw new ApiError(404, "Notification not found."); return success(res, item, "Notification marked as read."); }
export async function readAll(req: Request, res: Response) { await Notification.updateMany({ recipient: req.user!.id, read: false }, { read: true, readAt: new Date() }); return success(res, null, "All notifications marked as read."); }
export async function createAnnouncement(req: Request, res: Response) { const result = await announce(req.body.title, req.body.message); return success(res, { recipients: result.length }, "Announcement sent.", 201); }
