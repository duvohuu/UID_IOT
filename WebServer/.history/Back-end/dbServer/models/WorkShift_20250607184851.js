import mongoose from 'mongoose';

const workShiftSchema = new mongoose.Schema({
    shiftId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    machineName: {
        type: String,
        required: true
    },
    userId: {
        type: String,
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

// Index cho hiệu suất
workShiftSchema.index({ shiftId: 1 }, { unique: true });
workShiftSchema.index({ machineId: 1, startTime: -1 });
workShiftSchema.index({ userId: 1, startTime: -1 });
workShiftSchema.index({ status: 1 });

const WorkShift = mongoose.model('WorkShift', workShiftSchema);
export default WorkShift;