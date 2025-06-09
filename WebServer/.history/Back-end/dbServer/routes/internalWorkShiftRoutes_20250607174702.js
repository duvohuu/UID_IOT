import express from "express";
import { 
    getWorkShifts, 
    getWorkShiftById, 
    getWorkShiftStats, 
    getActiveWorkShifts 
} from "../controllers/internalWorkShiftController.js";

const router = express.Router();

router.use((req, res, next) => {
    console.log(`🔗 Internal WorkShift Route: ${req.method} ${req.path}`);
    next();
});

router.get('/', getWorkShifts);
router.get('/stats', getWorkShiftStats); // ✅ THÊM dòng này
router.get('/stats/summary', getWorkShiftStats);
router.get('/active/current', getActiveWorkShifts);
router.get('/:shiftId', getWorkShiftById);

export default router;