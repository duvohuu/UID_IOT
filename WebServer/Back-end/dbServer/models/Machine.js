import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema({
    // Thông tin ca làm việc
    machineId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        required: true 
    },
    location: { 
        type: String, 
        required: true 
    },
    userId: {
        type: String, 
        ref: 'User', 
        required: true 
    },
    
    // Thông tin kết nối
    ip: { 
        type: String, 
        required: true },
    port: { 
        type: Number, 
        default: 502 }, 
    slaveId: { 
        type: Number, 
        default: 1 
    },
    
    // Trạng thái kết nối
    status: { 
        type: String, 
        enum: ['online', 'offline', 'error', 'maintenance'], 
        default: 'offline' 
    },
    isConnected: { 
        type: Boolean, 
        default: false 
    },
    lastHeartbeat: { 
        type: Date 
    },
    lastUpdate: { 
        type: Date 
    },
    connectionAttempts: { 
        type: Number, 
        default: 0 
    },
    maxConnectionAttempts: { 
        type: Number, 
        default: 3 
    },
    
    // Thông tin vận hành
    uptime: { type: Number, default: 0 }, // milliseconds
    connectedAt: { type: Date },
    disconnectedAt: { type: Date },
    
    // Dữ liệu từ HMI/PLC
    parameters: {
        // Data for monitoring (All users can view) - 40001 to 40007
        monitoringData: {
            '40001': { type: Number, default: 0 }, // Trạng thái hoạt động máy
            '40002': { type: Number, default: 0 }, // Trạng thái bồn cấp muối
            '40003': { type: Number, default: 0 }, // Loại muối đang chiết
            '40004': { type: Number, default: 0 }, // Khối lượng cần chiết rót
            '40005': { type: Number, default: 0 }, // Tổng KL đã chiết (Low)
            '40006': { type: Number, default: 0 }, // Tổng KL đã chiết (High)
            '40007': { type: Number, default: 0 }  // Tổng số chai đã chiết
        },
        
        // Admin only data - 40008 to 40036
        adminData: {
            // Loadcell analog values (40008-40011)
            '40008': { type: Number, default: 0 },
            '40009': { type: Number, default: 0 },
            '40010': { type: Number, default: 0 },
            '40011': { type: Number, default: 0 },
            
            // Loadcell gain and offset (40012-40019)
            '40012': { type: Number, default: 0 },
            '40013': { type: Number, default: 0 },
            '40014': { type: Number, default: 0 },
            '40015': { type: Number, default: 0 },
            '40016': { type: Number, default: 0 },
            '40017': { type: Number, default: 0 },
            '40018': { type: Number, default: 0 },
            '40019': { type: Number, default: 0 },
            
            // Calibration values (40020-40026)
            '40020': { type: Number, default: 0 },
            '40021': { type: Number, default: 0 },
            '40022': { type: Number, default: 0 },
            '40023': { type: Number, default: 0 },
            '40024': { type: Number, default: 0 },
            '40025': { type: Number, default: 0 },
            '40026': { type: Number, default: 0 },
            
            // Average filling time (40027-40029)
            '40027': { type: Number, default: 0 },
            '40028': { type: Number, default: 0 },
            '40029': { type: Number, default: 0 },
            
            // Motor frequencies (40030-40033)
            '40030': { type: Number, default: 0 },
            '40031': { type: Number, default: 0 },
            '40032': { type: Number, default: 0 },
            '40033': { type: Number, default: 0 },
            
            // Motor control (40034-40036)
            '40034': { type: Number, default: 0 },
            '40035': { type: Number, default: 0 },
            '40036': { type: Number, default: 0 }
        },
        
        // Calculated fields
        calculatedTotalWeight: { type: Number, default: 0 },
        calculatedAvgTime: { type: Number, default: 0 },
        timestamp: { type: String, default: '' }
    },
    
    // Error tracking
    lastError: { type: String },
    errorHistory: [{
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
        resolved: { type: Boolean, default: false }
    }],
    
    // Maintenance
    maintenanceSchedule: {
        nextMaintenanceDate: { type: Date },
        lastMaintenanceDate: { type: Date },
        maintenanceIntervalDays: { type: Number, default: 30 }
    },
    
    // Performance metrics
    performance: {
        avgCycleTime: { type: Number, default: null },
        efficiency: { type: Number, default: null },
        throughput: { type: Number, default: null },
        errorRate: { type: Number, default: null },
        availability: { type: Number, default: null }
    },
    
    // Power monitoring
    powerConsumption: {
        voltage: { type: Number, default: null },
        current: { type: Number, default: null }
    },
    
    // Thống kê
    totalOperationTime: { type: Number, default: 0 },
    totalDowntime: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    lastErrorMessage: { type: String },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Middleware để cập nhật updatedAt
machineSchema.pre('save', async function(next) {
    if (!this.machineId) {
        try {
            const machineCount = await mongoose.model('Machine').countDocuments();
            const machineNumber = machineCount + 1;
            this.machineId = `MACHINE_${String(machineNumber).padStart(3, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    
    // ✅ Cập nhật updatedAt
    this.updatedAt = new Date();
    next();
});

// Index cho hiệu suất truy vấn
machineSchema.index({ userId: 1 }); // THÊM: Index theo userId
machineSchema.index({ ip: 1, userId: 1 }); // THÊM: Compound index
machineSchema.index({ status: 1 });
machineSchema.index({ isConnected: 1 });

// Methods
machineSchema.methods.updateConnectionStatus = function(isConnected) {
    const now = new Date();
    
    if (isConnected && !this.isConnected) {
        // Máy vừa kết nối
        this.isConnected = true;
        this.status = 'online';
        this.connectedAt = now;
        this.lastHeartbeat = now;
        this.connectionAttempts = 0;
    } else if (!isConnected && this.isConnected) {
        // Máy vừa mất kết nối
        this.isConnected = false;
        this.status = 'offline';
        this.disconnectedAt = now;
        
        // Tính uptime
        if (this.connectedAt) {
            this.uptime += (now - this.connectedAt);
            this.totalOperationTime += (now - this.connectedAt);
        }
    }
    
    this.lastUpdate = now;
    return this.save();
};

machineSchema.methods.updateParameters = function(newParameters) {
    this.parameters = { ...this.parameters, ...newParameters };
    
    // Calculate total weight from high/low registers
    if (newParameters.adminData?.totalWeightLow !== undefined && 
        newParameters.adminData?.totalWeightHigh !== undefined) {
        this.parameters.calculatedTotalWeight = 
            (newParameters.adminData.totalWeightHigh << 16) + newParameters.adminData.totalWeightLow;
    }
    
    this.lastUpdate = new Date();
    return this.save();
};

const Machine = mongoose.model('Machine', machineSchema);
export default Machine;