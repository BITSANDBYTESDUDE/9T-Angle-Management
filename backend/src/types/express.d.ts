import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "admin" | "manager" | "employee";
        employeeId?: string;
      };
      validated?: { body?: unknown; query?: unknown; params?: unknown };
    }
  }
}

export {};
