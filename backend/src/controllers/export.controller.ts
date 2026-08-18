import type { Request, Response } from "express";
import { buildExport, type ExportFormat } from "../services/export.service.js";
import { ApiError } from "../utils/ApiError.js";
export async function exportReport(req: Request, res: Response) { const format = String(req.query.format || "csv") as ExportFormat; if (!["csv", "xlsx", "pdf"].includes(format)) throw new ApiError(422, "Export format must be CSV, XLSX or PDF."); const output = await buildExport(String(req.query.type || "daily"), format); res.setHeader("Content-Type", output.mime); res.setHeader("Content-Disposition", `attachment; filename="${output.filename}"`); return res.send(output.buffer); }
