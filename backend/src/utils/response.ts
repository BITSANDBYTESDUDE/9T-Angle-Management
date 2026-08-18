import type { Response } from "express";

export function success<T>(res: Response, data: T, message = "Success", statusCode = 200, meta?: unknown) {
  return res.status(statusCode).json({ success: true, message, data, ...(meta ? { meta } : {}) });
}
