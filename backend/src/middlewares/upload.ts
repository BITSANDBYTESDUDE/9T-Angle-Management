import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => allowed.has(file.mimetype) ? callback(null, true) : callback(new ApiError(415, "Only JPEG, PNG, WebP and PDF files are allowed.") as never)
});
