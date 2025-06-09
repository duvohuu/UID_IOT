import express from "express";
import { seedMachines, seedCompleteSystem } from "../controllers/seedController.js";

const router = express.Router();

router.use((req, res, next) => {
    console.log(`🔗 Seed Route: ${req.method} ${req.path}`);
    next();
});

// Seed machines only
router.post('/machines', seedMachines);

// Seed complete system (user + machine) - giống như file Seed.js
router.post('/complete', seedCompleteSystem);

export default router;