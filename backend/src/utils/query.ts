import type { Request } from "express";

export function pagination(req: Request) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
}

export function dateRange(query: Request["query"], field = "date") {
  const range: Record<string, Date> = {};
  if (query.startDate) range.$gte = new Date(String(query.startDate));
  if (query.endDate) {
    const end = new Date(String(query.endDate));
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? { [field]: range } : {};
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
