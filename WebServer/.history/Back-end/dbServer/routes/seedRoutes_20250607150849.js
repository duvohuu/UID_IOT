import express from "express";
import { seedMachines } from "../controllers/seedController.js";

const router = express.Router();

router.use((req, res, next) => {
    console.log(`🔗 Seed Route: ${req.method} ${req.path}`);
    next();
});

router.post('/machines', seedMachines);

export default router;