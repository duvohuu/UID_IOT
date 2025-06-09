import WorkShift from "../models/Workshift.js";
import mongoose from "mongoose";

export const getWorkShifts = async (req, res) => {
    try {
        const { page = 1, limit = 20, machineId, status, userId } = req.query;
        
        let query = {};
        if (machineId) query.machineId = machineId;
        if (status) query.status = status;
        if (userId) query.userId = userId;
        
        const shifts = await WorkShift.find(query)
            .populate('machineId', 'name type location ip machineId')
            .sort({ startTime: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
        
        const total = await WorkShift.countDocuments(query);
        
        res.json({
            shifts,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalShifts: total
        });
        
    } catch (error) {
        console.error('❌ Internal get work shifts error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getWorkShiftById = async (req, res) => {
    try {
        const shift = await WorkShift.findOne({ shiftId: req.params.shiftId })
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
        
        let matchQuery = { status: 'completed' };
        
        if (machineId) matchQuery.machineId = new mongoose.Types.ObjectId(machineId);
        if (userId) matchQuery.userId = userId;
        
        if (startDate || endDate) {
            matchQuery.startTime = {};
            if (startDate) matchQuery.startTime.$gte = new Date(startDate);
            if (endDate) matchQuery.startTime.$lte = new Date(endDate);
        }
        
        const stats = await WorkShift.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalShifts: { $sum: 1 },
                    totalBottles: { $sum: "$totalBottlesProduced" },
                    totalWeight: { $sum: "$totalWeightFilled" },
                    avgDuration: { $avg: "$duration" },
                    totalDuration: { $sum: "$duration" }
                }
            }
        ]);
        
        const result = stats[0] || {
            totalShifts: 0,
            totalBottles: 0,
            totalWeight: 0,
            avgDuration: 0,
            totalDuration: 0
        };
        
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getActiveWorkShifts = async (req, res) => {
    try {
        const activeShifts = await WorkShift.find({ status: 'active' })
            .populate('machineId', 'name type location ip machineId')
            .sort({ startTime: -1 })
            .lean();
        
        res.json(activeShifts);
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};