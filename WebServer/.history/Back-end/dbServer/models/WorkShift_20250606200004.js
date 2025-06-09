import mongoose from 'mongoose';

const workShiftSchema = new mongoose.Schema({
    // Thông tin ca làm việc
    shiftId: {
        type: String,
        required: true,
        unique: true
    },
    machineId: {
        type: String, 
        required: true,
    },
    machineName: {
        type: String,
        required: true
    },
    userId: {
        type: String, 
        ref: 'User', 
        required: true 
    },
    
    // Thời gian ca làm việc
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        default: null
    },
    duration: {
        type: Number,
        default: null
    },
    
    // Dữ liệu cuối ca (lưu khi kết thúc)
    finalData: {
        monitoringData: {
            type: Object,
            default: {}
        },
        adminData: {
            type: Object,
            default: {}
        }
    },
    
    // Thống kê ca làm việc
    totalBottlesProduced: {
        type: Number,
        default: 0
    },
    totalWeightFilled: {
        type: Number,
        default: 0
    },
    averageFillTime: {
        type: Number,
        default: 0
    },
    
    // Trạng thái ca
    status: {
        type: String,
        enum: ['active', 'completed', 'interrupted'],
        default: 'active'
    },
    
    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index cho hiệu suất
workShiftSchema.index({ machineId: 1, startTime: -1 });
workShiftSchema.index({ userId: 1, startTime: -1 });
workShiftSchema.index({ status: 1 });

// Middleware cập nhật updatedAt
workShiftSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const WorkShift = mongoose.model('WorkShift', workShiftSchema);
export default WorkShift;