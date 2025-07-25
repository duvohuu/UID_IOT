import PowderMachine from "../models/PowderMachine.js";
import mongoose from "mongoose";

export const getWorkShifts = async (req, res) => {
    try {
        const { page = 1, limit = 20, machineId, status, userId, sortBy = 'shiftId', sortOrder = 'asc' } = req.query;
        
        let query = {};
        if (machineId) query.machineId = machineId; 
        if (status) query.status = status;
        if (userId) query.userId = userId;

        console.log(`📊 MongoDB query:`, query);

        let sortQuery = {};
        if (sortBy == 'shiftId') {
            sortQuery = { 
                machineNumber: sortOrder === 'asc' ? 1 : -1,
                shiftNumber: sortOrder === 'asc' ? 1 : -1
            };
        } else if (sortBy == 'startTime') {
            sortQuery = { startTime: sortOrder === 'asc' ? 1 : -1 };
        } else {
            sortQuery = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        }
        
        const shifts = await PowderMachine.find(query)
            .populate({
                path: 'machineId',
                select: 'name type location ip machineId',
                match: { machineId: { $exists: true } }
            })
            .sort(sortQuery) 
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
        
        console.log(`Found ${shifts.length} shifts`);
        
        const total = await PowderMachine.countDocuments(query);
        
        const response = {
            shifts,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalShifts: total
        };

        res.json(response);
        
    } catch (error) {
        console.error('Internal get work shifts error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getWorkShiftById = async (req, res) => {
    try {
        const shift = await PowderMachine.findOne({ shiftId: req.params.shiftId })
            .populate('machineId', 'name type location ip machineId')
            .lean();
        
        if (!shift) {
            return res.status(404).json({ message: 'Work shift not found' });
        }
        
        res.json(shift);
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getWorkShiftStats = async (req, res) => {
    try {
        const { startDate, endDate, machineId, userId } = req.query;
        
        let matchQuery = {};
        
        if (machineId) matchQuery.machineId = new mongoose.Types.ObjectId(machineId);
        if (userId) matchQuery.userId = userId;
        
        if (startDate || endDate) {
            matchQuery.startTime = {};
            if (startDate) matchQuery.startTime.$gte = new Date(startDate);
            if (endDate) matchQuery.startTime.$lte = new Date(endDate);
        }
        
        // Count by status 
        const statusCounts = await PowderMachine.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // General stats  
        const generalStats = await PowderMachine.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalShifts: { $sum: 1 },
                    totalWeight: { $sum: "$totalWeightFilled" },
                    avgDuration: { $avg: "$duration" },
                    totalDuration: { $sum: "$duration" }
                }
            }
        ]);
        
        const stats = generalStats[0] || {
            totalShifts: 0,
            totalWeight: 0,
            avgDuration: 0,
            totalDuration: 0
        };
        
        // Add status counts
        const statusMap = {};
        statusCounts.forEach(item => {
            statusMap[item._id] = item.count;
        });
        
        stats.complete = statusMap.complete || 0;
        stats.incomplete = statusMap.incomplete || 0;
        stats.paused = statusMap.paused || 0;
        stats.active = statusMap.active || 0;
        
        res.json(stats);
        
    } catch (error) {
        console.error('Internal get work shift stats error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getActiveWorkShifts = async (req, res) => {
    try {
        const activeShifts = await PowderMachine.find({ status: 'active' })
            .populate('machineId', 'name type location ip machineId')
            .sort({ startTime: -1 })
            .lean();
        
        res.json(activeShifts);
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};