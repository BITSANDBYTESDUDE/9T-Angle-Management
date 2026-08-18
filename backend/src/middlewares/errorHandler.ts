import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const notFound: RequestHandler = (req, _res, next) => next(new ApiError(404, `Route ${req.method} ${req.originalUrl} was not found.`));

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let status = error instanceof ApiError ? error.statusCode : 500;
  let message = error instanceof ApiError ? error.message : "An unexpected server error occurred.";
  let details = error instanceof ApiError ? error.details : undefined;
  if (error instanceof mongoose.Error.ValidationError) { status = 422; message = "Database validation failed."; details = error.errors; }
  if (error instanceof mongoose.Error.CastError) { status = 400; message = `Invalid ${error.path}.`; }
  if (error?.code === 11000) { status = 409; message = `A record with that ${Object.keys(error.keyPattern || {})[0] || "value"} already exists.`; }
  if (error instanceof multer.MulterError) { status = 400; message = error.code === "LIMIT_FILE_SIZE" ? "File is larger than the allowed upload limit." : error.message; }
  if (status >= 500) console.error(error);
  res.status(status).json({ success: false, message, ...(details ? { details } : {}), ...(env.NODE_ENV === "development" && status >= 500 ? { stack: error.stack } : {}) });
};
