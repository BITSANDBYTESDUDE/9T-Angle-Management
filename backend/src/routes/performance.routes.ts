import { Router } from "express";
import * as controller from "../controllers/performance.controller.js";
import { authorize, requireAuth } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const router = Router(); router.use(requireAuth);
router.get("/", asyncHandler(controller.list));
router.post("/weekly/generate", authorize("admin", "manager"), asyncHandler(controller.weekly));
router.get("/:employeeId", asyncHandler(controller.get));
export default router;
