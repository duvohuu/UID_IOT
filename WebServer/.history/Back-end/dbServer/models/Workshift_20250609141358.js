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
        type: Number // minutes
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
        default: 0 // grams
    },
    efficiency: {
        type: Number,
        default: 0 // kg/hour
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

// ✅ ĐƠN GIẢN: Chỉ tính hiệu suất = khối lượng / thời gian
workShiftSchema.methods.calculateEfficiency = function() {
    if (!this.startTime || !this.totalWeightFilled) {
        return 0;
    }
    
    // ✅ Thời gian hoạt động của ca (hours)
    const currentTime = this.endTime || new Date();
    const workingHours = (currentTime - new Date(this.startTime)) / (1000 * 60 * 60);
    
    if (workingHours <= 0) {
        return 0;
    }
    
    // ✅ Khối lượng hiện tại (kg)
    const weightKg = this.totalWeightFilled / 1000;
    
    // ✅ Hiệu suất = kg/hour
    const efficiency = weightKg / workingHours;
    
    return Math.round(efficiency * 100) / 100;
};

// ✅ ĐƠN GIẢN: Chỉ cập nhật efficiency
workShiftSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // ✅ Tự động tính efficiency khi save
    this.efficiency = this.calculateEfficiency();
    
    // ✅ Tính duration (minutes)
    if (this.startTime) {
        const currentTime = this.endTime || new Date();
        this.duration = Math.round((currentTime - new Date(this.startTime)) / (1000 * 60));
    }
    
    next();
});

// ✅ BỎ: getAverageEfficiencyByMachine (không cần thiết)

// Index cơ bản
workShiftSchema.index({ shiftId: 1 }, { unique: true });
workShiftSchema.index({ machineId: 1, startTime: -1 });
workShiftSchema.index({ status: 1 });

const WorkShift = mongoose.model('WorkShift', workShiftSchema);
export default WorkShift;