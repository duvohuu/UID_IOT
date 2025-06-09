import axios from "axios";
import jwt from "jsonwebtoken";

const DB_SERVER_URL = process.env.DB_SERVER_URL || "http://localhost:5001";

// THÊM: Helper function để get user từ token
const getUserFromToken = async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userResponse = await axios.get(`${DB_SERVER_URL}/db/internal/users/${decoded.id}`);
    return userResponse.data;
};

// UPDATE: getMachines để dùng internal API
export const getMachines = async (req, res) => {
    try {
        const token = req.cookies.authToken;
        const currentUser = await getUserFromToken(token);
        
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/machines`);
        let machines = response.data;
        
        // Role-based filtering
        if (currentUser.role !== 'admin') {
            machines = machines.filter(m => m.userId === currentUser.userId);
        }
        
        res.json(machines);
    } catch (error) {
        console.error("Lỗi lấy danh sách máy:", error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.status(500).json({ message: "Lỗi lấy danh sách máy", error: error.message });
    }
};

// UPDATE: getMachineByIp để dùng internal API
export const getMachineByIp = async (req, res) => {
    try {
        const { ip } = req.params;
        const token = req.cookies.authToken;
        const currentUser = await getUserFromToken(token);
        
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/machines/ip/${ip}`);
        const machine = response.data;
        
        // Check permission
        if (currentUser.role !== 'admin' && machine.userId !== currentUser.userId) {
            return res.status(403).json({ message: "Access denied - Not your machine" });
        }
        
        res.json(machine);
    } catch (error) {
        console.error("Lỗi tìm máy theo IP:", error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.status(error.response?.status || 500).json({
            message: error.response?.status === 404 ? "Không tìm thấy máy" : "Lỗi tìm máy theo IP",
            error: error.message
        });
    }
};

// THÊM: createMachine method
export const createMachine = async (req, res) => {
    try {
        const token = req.cookies.authToken;
        const currentUser = await getUserFromToken(token);
        
        const machineData = {
            ...req.body,
            userId: currentUser.userId
        };
        
        const response = await axios.post(`${DB_SERVER_URL}/db/internal/machines`, machineData);
        
        res.status(201).json(response.data);
    } catch (error) {
        console.error("Error creating machine:", error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.status(400).json({ 
            message: "Error creating machine", 
            error: error.response?.data?.message || error.message 
        });
    }
};

// THÊM: updateMachine method
export const updateMachine = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.cookies.authToken;
        const currentUser = await getUserFromToken(token);
        
        // Check if machine exists and user has permission
        const machineResponse = await axios.get(`${DB_SERVER_URL}/db/internal/machines`);
        const machine = machineResponse.data.find(m => m._id === id);
        
        if (!machine) {
            return res.status(404).json({ message: "Machine not found" });
        }
        
        if (currentUser.role !== 'admin' && machine.userId !== currentUser.userId) {
            return res.status(403).json({ message: "Access denied - Not your machine" });
        }
        
        const response = await axios.put(`${DB_SERVER_URL}/db/internal/machines/${id}`, req.body);
        
        res.json(response.data);
    } catch (error) {
        console.error("Error updating machine:", error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.status(500).json({ 
            message: "Error updating machine", 
            error: error.message 
        });
    }
};

// UPDATE: getMachineById để dùng internal API
export const getMachineById = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.cookies.authToken;
        const currentUser = await getUserFromToken(token);
        
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/machines`);
        const machine = response.data.find(m => m._id === id);
        
        if (!machine) {
            return res.status(404).json({ message: "Machine not found" });
        }
        
        // Check permission
        if (currentUser.role !== 'admin' && machine.userId !== currentUser.userId) {
            return res.status(403).json({ message: "Access denied - Not your machine" });
        }
        
        res.json(machine);
    } catch (error) {
        console.error("Error fetching machine details:", error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.status(500).json({ 
            message: "Error fetching machine details", 
            error: error.message 
        });
    }
};

// UPDATE: deleteMachine để dùng internal API
export const deleteMachine = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.cookies.authToken;
        const currentUser = await getUserFromToken(token);
        
        console.log(`🗑️ deleteMachine: Starting delete for ID: ${id}`);
        
        // Check if machine exists and user has permission
        const machineResponse = await axios.get(`${DB_SERVER_URL}/db/internal/machines`);
        const machine = machineResponse.data.find(m => m._id === id);
        
        if (!machine) {
            return res.status(404).json({ message: "Machine not found" });
        }
        
        if (currentUser.role !== 'admin' && machine.userId !== currentUser.userId) {
            return res.status(403).json({ message: "Access denied - Not your machine" });
        }
        
        const response = await axios.delete(`${DB_SERVER_URL}/db/internal/machines/${id}`);
        
        console.log(`✅ MainServer: Machine ${id} deleted successfully`);
        
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            console.log(`📡 MainServer: Broadcasting machine deletion`);
            io.emit("machineDeleted", {
                _id: id,
                ...response.data.deletedMachine
            });
        }
        
        res.json(response.data);
    } catch (error) {
        console.error("❌ MainServer: Error deleting machine:", error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        
        res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || "Error deleting machine",
            error: error.message
        });
    }
};

// GIỮ NGUYÊN: getMachineStatus (đã đúng)
export const getMachineStatus = async (req, res) => {
    try {
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/machines`);
        const machines = response.data;
        
        res.json({
            totalMachines: machines.length,
            onlineMachines: machines.filter(m => m.isConnected).length,
            machines: machines,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Error fetching machines", 
            error: error.message 
        });
    }
};