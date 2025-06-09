import express from "express";
import { 
    getUserById, 
    getUserByEmail, 
    createUser, 
    updateUser 
} from "../controllers/internalUserController.js";

const router = express.Router();

router.use((req, res, next) => {
    console.log(`🔗 Internal User Route: ${req.method} ${req.path}`);
    next();
});

router.get('/:id', getUserById);
router.get('/email/:email', getUserByEmail);
router.post('/', createUser);
router.put('/:id', updateUser);

export default router;