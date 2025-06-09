import express from "express";
import { 
    getAllMachines, 
    createMachine, 
    updateMachine, 
    deleteMachine, 
    getMachineByIp 
} from "../controllers/internalMachineController.js";

const router = express.Router();

router.use((req, res, next) => {
    console.log(`🔗 Internal Machine Route: ${req.method} ${req.path}`);
    next();
});

router.get('/', getAllMachines);
router.post('/', createMachine);
router.put('/:id', updateMachine);
router.delete('/:id', deleteMachine);
router.get('/ip/:ip', getMachineByIp);

export default router;