import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/usersRoute.js";
import machineRoutes from "./routes/machineRoute.js";
import workShiftRoutes from "./routes/workShiftRoute.js";
import { createRequire } from "module";
import http from "http";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const socketIo = require("socket.io");

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const server = http.createServer(app);
const DB_SERVER_URL = process.env.DB_SERVER_URL || "http://localhost:5001";

// Danh sách các origin được phép
const allowedOrigins = [
    "http://localhost:5173",
    "http://192.168.1.8:5173",
    "http://localhost:3000",
    "http://192.168.61.208:5173",
    "http://192.168.1.13:5173"
];

// ✅ SỬA: CORS middleware cải thiện cho DELETE requests
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Cookie");
        res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
    }
    
    // ✅ QUAN TRỌNG: Xử lý preflight requests
    if (req.method === 'OPTIONS') {
        console.log(`🔍 OPTIONS request for: ${req.url}`);
        res.status(200).end();
        return;
    }
    
    next();
});

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "DELETE", "OPTIONS"], // ✅ THÊM DELETE
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// ✅ THÊM: Setup io trong app để routes có thể sử dụng
app.set('io', io);

// =================================================================
// EXPRESS ROUTES & SOCKET.IO
// =================================================================

app.use("/avatars", express.static(path.join(__dirname, "upload/avatars")));
app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`Nhận yêu cầu: ${req.method} ${req.url}`);
    console.log(`🍪 Cookies:`, req.cookies ? Object.keys(req.cookies) : 'No cookies'); // ✅ THÊM debug
    next();
});

app.use("/api/users", userRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/work-shifts", workShiftRoutes);

app.post("/api/internal/machine-update", (req, res) => {
    const machineUpdate = req.body;
    console.log(`📡 Received machine update from dbServer: ${machineUpdate.name} - ${machineUpdate.status}`);
    io.emit("machineStatusUpdate", machineUpdate);
    console.log(`🔄 Broadcasted to Frontend: ${machineUpdate.name} is ${machineUpdate.status}`);
    res.json({ success: true, message: "Machine update broadcasted" });
});

app.post("/api/internal/shift-completed", (req, res) => {
    const shiftData = req.body;
    console.log(`📡 Received shift completion from dbServer: ${shiftData.shiftId}`);
    io.emit("workShiftCompleted", shiftData);
    console.log(`🔄 Broadcasted shift completion to Frontend`);
    res.json({ success: true, message: "Shift completion broadcasted" });
});

app.get("/", (req, res) => {
    res.send(`
        <h1>🚀 Main Server is running</h1>
        <p>Database Server URL: ${DB_SERVER_URL}</p>
        <p>Last update: ${new Date().toLocaleString()}</p>
    `);
});



app.get("/api/work-shifts/:shiftId", async (req, res) => {
    try {
        const { shiftId } = req.params;
        const token = req.cookies.authToken;
        
        const response = await axios.get(`${DB_SERVER_URL}/db/work-shifts/${shiftId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error("Get work shift detail error:", error.message);
        if (error.response?.status === 401) {
            return res.status(401).json({ message: "Unauthorized - Please login again" });
        }
        if (error.response?.status === 404) {
            return res.status(404).json({ message: "Work shift not found" });
        }
        res.status(500).json({ 
            message: "Error fetching work shift detail", 
            error: error.message 
        });
    }
});

io.on("connection", (socket) => {
    console.log("Frontend client connected:", socket.id);
    
    // Gửi trạng thái hiện tại của tất cả machines cho client mới
    fetchAndSendCurrentMachineStatus(socket);
    
    socket.on("message", (msg) => {
        console.log("Received message:", msg);
    });
    
    socket.on("Value", (data) => {
        console.log("Received value:", data);
    });
    
    socket.on("disconnect", (reason) => {
        console.log("Frontend client disconnected:", socket.id, "Reason:", reason);
    });
});

// Lấy và gửi trạng thái hiện tại của machines
async function fetchAndSendCurrentMachineStatus(socket) {
    try {
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/machines`);
        const machines = response.data;
        
        // Gửi từng machine update đến client mới
        machines.forEach(machine => {
            socket.emit("machineStatusUpdate", {
                id: machine._id,
                machineId: machine.machineId,
                ip: machine.ip,
                name: machine.name,
                type: machine.type,
                location: machine.location,
                isConnected: machine.isConnected,
                status: machine.status,
                lastUpdate: machine.lastUpdate,
                lastHeartbeat: machine.lastHeartbeat,
                parameters: machine.parameters,
                uptime: machine.uptime,
                userInfo: machine.userInfo
            });
        });
        
        console.log(`📤 Sent current status of ${machines.length} machines to new client`);
    } catch (error) {
        console.error("❌ Error fetching current machine status:", error.message);
    }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Main Server running at http://0.0.0.0:${PORT}`);
});