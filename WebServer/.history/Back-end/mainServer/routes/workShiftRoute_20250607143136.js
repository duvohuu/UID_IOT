import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { 
    getWorkShifts, 
    getWorkShiftById, 
    getWorkShiftStats, 
    getActiveWorkShifts 
} from "../controllers/workShiftController.js";

const router = express.Router();

// Middleware logging
router.use((req, res, next) => {
    console.log(`🛣️ WorkShift Route: ${req.method} ${req.path}`);
    next();
});

router.get("/", authenticateToken, getWorkShifts);
router.get("/stats/summary", authenticateToken, getWorkShiftStats);
router.get("/active/current", authenticateToken, getActiveWorkShifts);
router.get("/:shiftId", authenticateToken, getWorkShiftById);

export default router;