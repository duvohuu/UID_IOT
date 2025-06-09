import express from "express";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

// Import configurations
import connectDB from "./config/db.js";

// Import middleware
import { corsMiddleware, loggingMiddleware, ipWhitelistMiddleware } from "./middleware/security.js";

// Import routes
import internalUserRoutes from "./routes/internalUserRoutes.js";
import internalMachineRoutes from "./routes/internalMachineRoutes.js";
import internalWorkShiftRoutes from "./routes/internalWorkShiftRoutes.js";
import seedRoutes from "./routes/seedRoutes.js";

// Import services
import { modbusService } from "./services/modbusService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize
dotenv.config({ path: path.join(__dirname, "../.env") });
connectDB();

const app = express();
const server = http.createServer(app);

// =================================================================
// MIDDLEWARE SETUP
// =================================================================
app.use(express.json());
app.use(corsMiddleware);
app.use(loggingMiddleware);

// Security for internal APIs
app.use('/db/internal/*', ipWhitelistMiddleware);

// =================================================================
// ROUTES SETUP  
// =================================================================
app.use('/db/internal/users', internalUserRoutes);
app.use('/db/internal/machines', internalMachineRoutes);
app.use('/db/internal/work-shifts', internalWorkShiftRoutes);
app.use('/db/seed', seedRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'DB Server running',
        services: {
            database: 'Connected',
            modbus: 'Active',
            polling: 'Running'
        },
        timestamp: new Date().toISOString() 
    });
});

// =================================================================
// START SERVER & SERVICES
// =================================================================
const PORT = process.env.DB_PORT || 5001;
server.listen(PORT, () => {
    console.log(`✅ DB Server running on port ${PORT}`);
    console.log(`🔄 Modbus polling active`);
    
    // Start Modbus polling system
    modbusService.startPolling();
});