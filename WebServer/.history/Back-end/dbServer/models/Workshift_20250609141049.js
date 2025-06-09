import mongoose from 'mongoose';

const workShiftSchema = new mongoose.Schema({
    shiftId: {
        type: String,
        required: true,
        unique: true,
        match: /^M\d+_S\d+$/
    },
    machineId: {
        type: String, 
        required: true
    },
    machineName: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    machineNumber: {
        type: Number,
        required: true
    },
    shiftNumber: {
        type: Number,
        required: true
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'incomplete', 'interrupted'],
        default: 'active'
    },
    totalBottlesProduced: {
        type: Number,
        default: 0
    },
    totalWeightFilled: {
        type: Number,
        default: 0
    },
    efficiency: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    finalData: {
        type: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// ✅ THÊM: Method tính hiệu suất kg/hour
workShiftSchema.methods.calculateEfficiency = function() {
    if (!this.startTime || !this.totalWeightFilled) {
        return 0;
    }
    
    // ✅ Tính thời gian làm việc (hours)
    const endTime = this.endTime || new Date();
    const workingTimeHours = (endTime - new Date(this.startTime)) / (1000 * 60 * 60);
    
    if (workingTimeHours <= 0) {
        return 0;
    }
    
    // ✅ Convert gram to kg
    const totalWeightKg = this.totalWeightFilled / 1000;
    
    // ✅ Hiệu suất = kg/hour
    const efficiency = totalWeightKg / workingTimeHours;
    
    return Math.round(efficiency * 100) / 100; // Round to 2 decimals
};

// ✅ THÊM: Method cập nhật duration và efficiency
workShiftSchema.methods.updateDurationAndEfficiency = function() {
    if (!this.startTime) return;
    
    const endTime = this.endTime || new Date();
    
    // ✅ Update duration in minutes
    this.duration = Math.round((endTime - new Date(this.startTime)) / (1000 * 60));
    
    // ✅ Update efficiency
    this.efficiency = this.calculateEfficiency();
    
    console.log(`📊 Updated efficiency for ${this.shiftId}: ${this.efficiency} kg/h`);
};

// ✅ THÊM: Pre-save middleware để tự động tính efficiency
workShiftSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // ✅ Auto-calculate efficiency khi save
    if (this.isModified('totalWeightFilled') || 
        this.isModified('endTime') || 
        this.isModified('status')) {
        this.updateDurationAndEfficiency();
    }
    
    next();
});

// ✅ THÊM: Static method để tính efficiency trung bình theo máy
workShiftSchema.statics.getAverageEfficiencyByMachine = async function(machineId, hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const result = await this.aggregate([
        {
            $match: {
                machineId: machineId,
                startTime: { $gte: cutoffTime },
                efficiency: { $gt: 0 },
                status: { $in: ['completed', 'incomplete'] }
            }
        },
        {
            $group: {
                _id: null,
                avgEfficiency: { $avg: '$efficiency' },
                minEfficiency: { $min: '$efficiency' },
                maxEfficiency: { $max: '$efficiency' },
                totalShifts: { $sum: 1 },
                totalWeight: { $sum: '$totalWeightFilled' },
                totalDuration: { $sum: '$duration' }
            }
        }
    ]);
    
    return result.length > 0 ? result[0] : null;
};

// Index cho hiệu suất
workShiftSchema.index({ shiftId: 1 }, { unique: true });
workShiftSchema.index({ machineId: 1, startTime: -1 });
workShiftSchema.index({ userId: 1, startTime: -1 });
workShiftSchema.index({ status: 1 });
// ✅ THÊM: Index cho efficiency queries
workShiftSchema.index({ efficiency: -1 });
workShiftSchema.index({ machineId: 1, efficiency: -1 });

const WorkShift = mongoose.model('WorkShift', workShiftSchema);
export default WorkShift;