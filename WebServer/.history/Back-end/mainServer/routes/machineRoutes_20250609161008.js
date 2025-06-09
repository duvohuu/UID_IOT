import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { 
    getMachines, 
    getMachineByIp, 
    getMachineStatus, 
    getMachineById, 
    createMachine,    
    updateMachine,    
    deleteMachine 
} from "../controllers/machineController.js";

const router = express.Router();

router.use((req, res, next) => {
    console.log(`🛣️ Machine Route: ${req.method} ${req.path}`);
    next();
});

router.get("/", authenticateToken, getMachines);
router.post("/", authenticateToken, createMachine);       
router.get("/status", getMachineStatus);
router.get("/ip/:ip", authenticateToken, getMachineByIp);
router.get("/:id", authenticateToken, getMachineById);
router.put("/:id", authenticateToken, updateMachine);     
router.delete("/:id", authenticateToken, deleteMachine);

export default router;