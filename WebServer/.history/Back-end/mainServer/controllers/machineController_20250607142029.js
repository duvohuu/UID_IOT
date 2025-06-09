import axios from "axios";

const DB_SERVER_URL = process.env.DB_SERVER_URL || "http://localhost:5001";

const getUserFromToken = async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userResponse = await axios.get(`${DB_SERVER_URL}/db/internal/users/${decoded.id}`);
    return userResponse.data;
};

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

// ✅ THÊM: Function thiếu
export const getMachineStatus = async (req, res) => {
    try {
        // Dùng internal API (không cần auth)
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

// ✅ THÊM: Function thiếu
export const getMachineById = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.cookies.authToken;
        const response = await axios.get(`${DB_SERVER_URL}/db/machines/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        res.json(response.data);
    } catch (error) {
        if (error.response?.status === 401) {
            return res.status(401).json({ message: "Unauthorized - Please login again" });
        }
        if (error.response?.status === 404) {
            return res.status(404).json({ message: "Không tìm thấy máy" });
        }
        res.status(500).json({ 
            message: "Error fetching machine details", 
            error: error.message 
        });
    }
};

// ✅ THÊM: Function thiếu
export const deleteMachine = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.cookies.authToken;
        
        console.log(`🗑️ deleteMachine: Starting delete for ID: ${id}`);
        console.log(`🗑️ deleteMachine: Token exists: ${!!token}`);
        console.log(`🗑️ deleteMachine: User from token:`, req.user);
        
        if (!token) {
            console.log(`❌ deleteMachine: No token found`);
            return res.status(401).json({ message: "No authentication token found" });
        }
        
        console.log(`🗑️ MainServer: Deleting machine ${id}`);
        
        const response = await axios.delete(`${DB_SERVER_URL}/db/machines/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
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
        console.error("❌ MainServer: Error response:", error.response?.data);
        
        if (error.response?.status === 401) {
            return res.status(401).json({ message: "Unauthorized - Please login again" });
        }
        if (error.response?.status === 404) {
            return res.status(404).json({ message: "Không tìm thấy máy" });
        }
        
        res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || "Error deleting machine",
            error: error.message
        });
    }
};