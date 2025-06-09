import axios from "axios";
import jwt from "jsonwebtoken";

const DB_SERVER_URL = process.env.DB_SERVER_URL || "http://localhost:5001";

export const getWorkShifts = async (req, res) => {
    try {
        const token = req.cookies.authToken;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const userResponse = await axios.get(`${DB_SERVER_URL}/db/internal/users/${decoded.id}`);
        const currentUser = userResponse.data;
        
        const { machineId, status, limit = 20, page = 1, sortBy = 'startTime', sortOrder = 'desc' } = req.query;
        
        let queryParams = {
            limit,
            page,
            sortBy,
            sortOrder
        };
        
        // ✅ Role-based filtering
        if (currentUser.role !== 'admin') {
            queryParams.userId = currentUser.userId;
        }
        
        if (machineId) queryParams.machineId = machineId;
        if (status) queryParams.status = status; // ✅ Cho phép filter theo status
        
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/work-shifts`, {
            params: queryParams
        });
        
        res.json(response.data);
    } catch (error) {
        console.error("Get work shifts error:", error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.status(500).json({ 
            message: "Error fetching work shifts", 
            error: error.message 
        });
    }
};

export const getWorkShiftById = async (req, res) => {
    try {
        const token = req.cookies.authToken;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const userResponse = await axios.get(`${DB_SERVER_URL}/db/internal/users/${decoded.id}`);
        const currentUser = userResponse.data;
        
        const { shiftId } = req.params;
        
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/work-shifts/${shiftId}`);
        const shift = response.data;
        
        // ✅ Check access permissions
        if (currentUser.role !== 'admin' && shift.userId !== currentUser.userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        
        res.json(shift);
    } catch (error) {
        console.error("Get work shift by ID error:", error.message);
        if (error.response?.status === 404) {
            return res.status(404).json({ message: "Work shift not found" });
        }
        res.status(500).json({ 
            message: "Error fetching work shift", 
            error: error.message 
        });
    }
};

export const getWorkShiftStats = async (req, res) => {
    try {
        const token = req.cookies.authToken;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const userResponse = await axios.get(`${DB_SERVER_URL}/db/internal/users/${decoded.id}`);
        const currentUser = userResponse.data;
        
        const { machineId, startDate, endDate } = req.query;
        
        let queryParams = {};
        
        // ✅ Role-based filtering
        if (currentUser.role !== 'admin') {
            queryParams.userId = currentUser.userId;
        }
        
        if (machineId) queryParams.machineId = machineId;
        if (startDate) queryParams.startDate = startDate;
        if (endDate) queryParams.endDate = endDate;
        
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/work-shifts/stats`, {
            params: queryParams
        });
        
        res.json(response.data);
    } catch (error) {
        console.error("Get work shift stats error:", error.message);
        res.status(500).json({ 
            message: "Error fetching work shift stats", 
            error: error.message 
        });
    }
};

export const getActiveWorkShifts = async (req, res) => {
    try {
        const token = req.cookies.authToken;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const userResponse = await axios.get(`${DB_SERVER_URL}/db/internal/users/${decoded.id}`);
        const currentUser = userResponse.data;
        
        let queryParams = {
            status: 'active'
        };
        
        // ✅ Role-based filtering
        if (currentUser.role !== 'admin') {
            queryParams.userId = currentUser.userId;
        }
        
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/work-shifts`, {
            params: queryParams
        });
        
        res.json(response.data);
    } catch (error) {
        console.error("Get active work shifts error:", error.message);
        res.status(500).json({ 
            message: "Error fetching active work shifts", 
            error: error.message 
        });
    }
};