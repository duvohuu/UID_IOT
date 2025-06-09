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

workShiftSchema.method.calculateEfficiency = function() {
    if (duration !)

workShiftSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // ✅ Tính duration (minutes)
    if (this.startTime) {
        const currentTime = this.endTime || new Date();
        this.duration = Math.round((currentTime - new Date(this.startTime)) / (1000 * 60));
    }
    
    next();
});


// Index cơ bản
workShiftSchema.index({ shiftId: 1 }, { unique: true });
workShiftSchema.index({ machineId: 1, startTime: -1 });
workShiftSchema.index({ status: 1 });

const WorkShift = mongoose.model('WorkShift', workShiftSchema);
export default WorkShift;