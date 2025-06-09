import axios from "axios";
import jwt from "jsonwebtoken";

const DB_SERVER_URL = process.env.DB_SERVER_URL || "http://localhost:5001";

export const getWorkShifts = async (req, res) => {
    try {
        const token = req.cookies.authToken;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user info
        const userResponse = await axios.get(`${DB_SERVER_URL}/db/internal/users/${decoded.id}`);
        const currentUser = userResponse.data;
        
        const { machineId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
        
        let queryParams = { page, limit };
        
        // Role-based filtering
        if (currentUser.role !== 'admin') {
            queryParams.userId = currentUser.userId;
        }
        
        if (machineId) queryParams.machineId = machineId;
        if (status) queryParams.status = status;
        if (startDate) queryParams.startDate = startDate;
        if (endDate) queryParams.endDate = endDate;
        
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
        const { shiftId } = req.params;
        const token = req.cookies.authToken;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const userResponse = await axios.get(`${DB_SERVER_URL}/db/internal/users/${decoded.id}`);
        const currentUser = userResponse.data;
        
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/work-shifts/${shiftId}`);
        const workShift = response.data;
        
        // Check access permission
        if (currentUser.role !== 'admin' && workShift.userId !== currentUser.userId) {
            return res.status(403).json({ message: "Access denied - Not your work shift" });
        }
        
        res.json(workShift);
    } catch (error) {
        console.error("Get work shift detail error:", error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (error.response?.status === 404) {
            return res.status(404).json({ message: "Work shift not found" });
        }
        res.status(500).json({ 
            message: "Error fetching work shift detail", 
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
        
        let queryParams = {};
        if (currentUser.role !== 'admin') {
            queryParams.userId = currentUser.userId;
        }
        
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/work-shifts/stats/summary`, {
            params: queryParams
        });
        
        res.json(response.data);
    } catch (error) {
        console.error("Get work shift stats error:", error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
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
        
        let queryParams = {};
        if (currentUser.role !== 'admin') {
            queryParams.userId = currentUser.userId;
        }
        
        const response = await axios.get(`${DB_SERVER_URL}/db/internal/work-shifts/active/current`, {
            params: queryParams
        });
        
        res.json(response.data);
    } catch (error) {
        console.error("Get active work shifts error:", error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.status(500).json({ 
            message: "Error fetching active work shifts", 
            error: error.message 
        });
    }
};