import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js"; 
import User from "./models/User.js";
import Machine from "./models/Machine.js";
import WorkShift from "./models/WorkShift.js";
import path from "path";
import { fileURLToPath } from "url";
import net from "net";
import http from "http";
import axios from "axios";
import jwt from "jsonwebtoken"; // ✅ THÊM

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });
connectDB();

const app = express();
const server = http.createServer(app);
app.use(express.json());

// =================================================================
// MODBUS CONFIGURATION (GIỮ NGUYÊN)
// =================================================================

const MODBUS_CONFIG = {
    port: 502,
    timeout: 8000,
    scanInterval: 30000,
    resetTransactionId: 100
};

let machineTransactionIds = new Map();
let machineConnectionLocks = new Map();

// ======================= MODBUS CORE ================================
function getNextTransactionId(machineId, machineName) {
    const isModSim = machineName && machineName.includes('ModSim');
    const maxId = isModSim ? 100 : MODBUS_CONFIG.resetTransactionId;
    if (!machineTransactionIds.has(machineId)) machineTransactionIds.set(machineId, 1);
    let currentId = machineTransactionIds.get(machineId);
    currentId++;
    if (currentId > maxId) currentId = 1;
    machineTransactionIds.set(machineId, currentId);
    return currentId;
}

function createModbusRequest(machine) {
    const buffer = Buffer.alloc(12);
    const transactionId = getNextTransactionId(machine._id, machine.name);
    buffer.writeUInt16BE(transactionId, 0);
    buffer.writeUInt16BE(0, 2);
    buffer.writeUInt16BE(6, 4);
    buffer.writeUInt8(1, 6);
    buffer.writeUInt8(3, 7);
    buffer.writeUInt16BE(0, 8);
    buffer.writeUInt16BE(36, 10);
    return { buffer, transactionId };
}

async function readMachineData(machine) {
    const lockKey = `${machine._id}`;
    if (machineConnectionLocks.has(lockKey)) return;
    machineConnectionLocks.set(lockKey, true);
    try {
        await performModbusRead(machine);
    } finally {
        machineConnectionLocks.delete(lockKey);
    }
}

async function performModbusRead(machine) {
    return new Promise((resolve) => {
        const client = new net.Socket();
        client.setTimeout(MODBUS_CONFIG.timeout);
        let isResolved = false;
        let connectionTimer;
        let expectedTransactionId;

        const cleanup = () => {
            try {
                if (connectionTimer) clearTimeout(connectionTimer);
                client.removeAllListeners();
                if (!client.destroyed) client.destroy();
            } catch {}
        };

        connectionTimer = setTimeout(() => {
            if (!isResolved) {
                isResolved = true; cleanup();
                resolve();
            }
        }, MODBUS_CONFIG.timeout);

        client.connect(MODBUS_CONFIG.port, machine.ip, () => {
            const { buffer, transactionId } = createModbusRequest(machine);
            expectedTransactionId = transactionId;
            client.write(buffer);
        });

        client.on('data', async (data) => {
            if (isResolved) return;
            if (data.length >= 9 && data[7] > 0x80) {
                if (machine.name.includes('ModSim')) machineTransactionIds.set(machine._id, 1);
                await updateMachineStatus(machine._id, { isConnected: false, status: 'error', lastError: `ModBus error ${data[8]}`, disconnectedAt: new Date() });
                isResolved = true; cleanup(); resolve();
                return;
            }
            const expectedDataLength = 9 + (36 * 2);
            if (data.length >= expectedDataLength) {
                const registers = [];
                for (let i = 0; i < 36; i++) registers[i] = data.readUInt16BE(9 + (i * 2));
                
                console.log(`📊 [${machine.name}] Sample data - 40001:${registers[0]}, 40002:${registers[1]}, 40003:${registers[2]}`);
                
                // ✅ XỬ LÝ WORK SHIFT TRACKING
                await handleWorkShiftTracking(machine, registers);
                
                const parameters = {
                    monitoringData: Object.fromEntries(Array.from({length: 7}, (_,i)=>[`4000${i+1}`, registers[i]||0])),
                    adminData: Object.fromEntries(Array.from({length: 29}, (_,i)=>[(40008+i).toString(), registers[i+7]||0]))
                };
                
                await updateMachineStatus(machine._id, { isConnected: true, status: 'online', lastHeartbeat: new Date(), parameters, lastError: null });
                isResolved = true; cleanup(); resolve();
            } else {
                isResolved = true; cleanup(); resolve();
            }
        });

        client.on('error', async () => {
            if (isResolved) return;
            await updateMachineStatus(machine._id, { isConnected: false, status: 'offline', lastError: 'Connection error', disconnectedAt: new Date() });
            isResolved = true; cleanup(); resolve();
        });

        client.on('timeout', async () => {
            if (isResolved) return;
            await updateMachineStatus(machine._id, { isConnected: false, status: 'timeout', lastError: 'Socket timeout', disconnectedAt: new Date() });
            isResolved = true; cleanup(); resolve();
        });

        client.on('close', () => {
            if (!isResolved) { isResolved = true; cleanup(); resolve(); }
        });
    });
}

async function updateMachineStatus(machineId, updateData) {
    try {
        const machine = await Machine.findByIdAndUpdate(machineId, { ...updateData, lastUpdate: new Date() }, { new: true });
        if (machine) await notifyMainServer(machine);
    } catch {}
}

async function notifyMainServer(machine) {
    try {
        const MAIN_SERVER_URL = process.env.MAIN_SERVER_URL || "http://localhost:5000";
        await axios.post(`${MAIN_SERVER_URL}/api/internal/machine-update`, {
            id: machine._id,
            machineId: machine.machineId,
            ip: machine.ip,
            name: machine.name,
            type: machine.type,
            location: machine.location,
            isConnected: machine.isConnected,
            status: machine.status,
            lastUpdate: machine.lastUpdate?.toISOString(),
            lastHeartbeat: machine.lastHeartbeat?.toISOString(),
            parameters: machine.parameters,
            uptime: machine.uptime,
            lastError: machine.lastError
        });
    } catch {}
}

// ========================= POLLING ==========================

async function scanAllMachines() {
    try {
        console.log('🔍 Starting scan cycle for all machines...');
        const allMachines = await Machine.find({});
        
        if (allMachines.length === 0) {
            console.log('📭 No machines found to scan');
            return;
        }

        console.log(`🔄 Scanning ${allMachines.length} machines...`);
        
        // Quét từng máy tuần tự để tránh quá tải
        for (let i = 0; i < allMachines.length; i++) {
            const machine = allMachines[i];
            const wasOnline = machine.isConnected;
            
            console.log(`📡 [${i+1}/${allMachines.length}] Scanning ${machine.name} (${machine.ip}) - Current: ${machine.status}`);
            
            // Thực hiện quét máy (đọc dữ liệu Modbus)
            await readMachineData(machine);
            
            // Lấy trạng thái mới sau khi quét
            const updatedMachine = await Machine.findById(machine._id);
            const isNowOnline = updatedMachine.isConnected;
            
            // Log thay đổi trạng thái
            if (!wasOnline && isNowOnline) {
                console.log(`✅ [${machine.name}] Machine came ONLINE - Data updated`);
            } else if (wasOnline && !isNowOnline) {
                console.log(`❌ [${machine.name}] Machine went OFFLINE`);
            } else if (isNowOnline) {
                console.log(`📊 [${machine.name}] Online - Data refreshed`);
            } else {
                console.log(`⚫ [${machine.name}] Still offline`);
            }
            
            // Delay nhỏ giữa các lần quét để tránh quá tải network
            if (i < allMachines.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
            }
        }
        
        const onlineCount = await Machine.countDocuments({ isConnected: true });
        const offlineCount = allMachines.length - onlineCount;
        
        console.log(`🏁 Scan cycle completed: ${onlineCount} online, ${offlineCount} offline`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Error in scan cycle:', error.message);
    }
}

function startModbusPolling() {
    console.log('🚀 Starting Modbus polling system...');
    console.log(`⏰ Scan interval: ${MODBUS_CONFIG.scanInterval/1000}s`);
    console.log(`⏱️ Timeout per machine: ${MODBUS_CONFIG.timeout/1000}s`);
    
    // Delay nhỏ trước khi bắt đầu quét lần đầu
    setTimeout(() => {
        console.log('🔄 Starting first scan cycle...');
        scanAllMachines();
    }, 2000);
    
    // Thiết lập interval quét định kỳ
    setInterval(() => {
        scanAllMachines();
    }, MODBUS_CONFIG.scanInterval);
    
    console.log('✅ Modbus polling system initialized');
}

// ✅ THÊM: Authentication middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.authToken;
    
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// =================================================================
// MIDDLEWARE & CORS
// =================================================================
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

app.use((req, res, next) => {
    console.log(`📨 DB Server: ${req.method} ${req.url}`);
    next();
});

// =================== WORK SHIFT TRACKING ===================
let machineWorkStates = new Map(); // Theo dõi trạng thái làm việc của từng máy

async function handleWorkShiftTracking(machine, registers) {
    const machineStatus = registers[0]; // 40001 - Trạng thái hoạt động máy
    const previousState = machineWorkStates.get(machine._id.toString());
    const currentTime = new Date();
    
    // Tạo dữ liệu parameters từ registers
    const currentParameters = {
        monitoringData: Object.fromEntries(Array.from({length: 7}, (_,i)=>[`4000${i+1}`, registers[i]||0])),
        adminData: Object.fromEntries(Array.from({length: 29}, (_,i)=>[(40008+i).toString(), registers[i+7]||0]))
    };
    
    try {
        // ✅ BẮT ĐẦU CA MỚI: 0 → 1
        if (!previousState?.isWorking && machineStatus === 1) {
            console.log(`🟢 [${machine.name}] Starting new work shift...`);
            
            // Tạo shift ID unique
            const shiftId = `SHIFT_${machine.machineId}_${Date.now()}`;
            
            const newShift = new WorkShift({
                shiftId: shiftId,
                machineId: machine._id,
                machineName: machine.name,
                userId: machine.userId,
                startTime: currentTime,
                status: 'active'
            });
            
            await newShift.save();
            console.log(`✅ [${machine.name}] Work shift created: ${shiftId}`);
            
            // Cập nhật trạng thái theo dõi
            machineWorkStates.set(machine._id.toString(), {
                isWorking: true,
                currentShiftId: shiftId,
                lastData: currentParameters
            });
        }
        
        // ✅ ĐANG LÀM VIỆC: Cập nhật dữ liệu tạm (không lưu DB)
        else if (previousState?.isWorking && machineStatus === 1) {
            console.log(`🔄 [${machine.name}] Updating work shift data (not saving to DB)...`);
            
            // Chỉ cập nhật dữ liệu tạm trong memory
            machineWorkStates.set(machine._id.toString(), {
                ...previousState,
                lastData: currentParameters,
                lastUpdateTime: currentTime
            });
        }
        
        // ✅ KẾT THÚC CA: 1 → 0 (LƯU DỮ LIỆU)
        else if (previousState?.isWorking && machineStatus === 0) {
            console.log(`🔴 [${machine.name}] Ending work shift - SAVING FINAL DATA...`);
            
            // Tìm shift đang active
            const activeShift = await WorkShift.findOne({
                shiftId: previousState.currentShiftId,
                status: 'active'
            });
            
            if (activeShift) {
                // Tính toán thống kê ca làm việc
                const duration = currentTime - activeShift.startTime;
                const totalBottles = currentParameters.monitoringData['40007'] || 0;
                const totalWeightLow = currentParameters.monitoringData['40005'] || 0;
                const totalWeightHigh = currentParameters.monitoringData['40006'] || 0;
                const totalWeight = (totalWeightHigh * 65536) + totalWeightLow; // Combine high/low
                
                // Cập nhật shift với dữ liệu cuối ca
                activeShift.endTime = currentTime;
                activeShift.duration = duration;
                activeShift.finalData = currentParameters;
                activeShift.totalBottlesProduced = totalBottles;
                activeShift.totalWeightFilled = totalWeight;
                activeShift.status = 'completed';
                
                await activeShift.save();
                
                console.log(`💾 [${machine.name}] Work shift completed and saved:`);
                console.log(`   📊 Duration: ${Math.round(duration/1000)}s`);
                console.log(`   🍶 Bottles: ${totalBottles}`);
                console.log(`   ⚖️ Total Weight: ${totalWeight}g`);
                console.log(`   💾 Shift ID: ${activeShift.shiftId}`);
                
                // Thông báo cho mainServer về việc hoàn thành ca
                await notifyMainServerShiftCompleted(activeShift);
            }
            
            // Reset trạng thái theo dõi
            machineWorkStates.set(machine._id.toString(), {
                isWorking: false,
                currentShiftId: null,
                lastData: null
            });
        }
        
        // ✅ MÁY DỪNG: 0 → 0 (không làm gì)
        else {
            // Máy vẫn dừng, không có thay đổi
            if (!previousState) {
                machineWorkStates.set(machine._id.toString(), {
                    isWorking: false,
                    currentShiftId: null,
                    lastData: null
                });
            }
        }
        
    } catch (error) {
        console.error(`❌ [${machine.name}] Work shift tracking error:`, error.message);
    }
}

async function notifyMainServerShiftCompleted(shift) {
    try {
        const MAIN_SERVER_URL = process.env.MAIN_SERVER_URL || "http://localhost:5000";
        await axios.post(`${MAIN_SERVER_URL}/api/internal/shift-completed`, {
            shiftId: shift.shiftId,
            machineId: shift.machineId,
            machineName: shift.machineName,
            userId: shift.userId,
            startTime: shift.startTime,
            endTime: shift.endTime,
            duration: shift.duration,
            totalBottles: shift.totalBottlesProduced,
            totalWeight: shift.totalWeightFilled,
            finalData: shift.finalData
        });
        console.log(`📡 [${shift.machineName}] Shift completion notified to mainServer`);
    } catch (error) {
        console.error(`❌ Error notifying shift completion:`, error.message);
    }
}

// =================================================================
// INTERNAL API ROUTES (NO AUTH)
// =================================================================

// ✅ GIỮ: Internal API cho mainServer
app.get('/db/internal/machines', async (req, res) => {
    try {
        console.log('🔄 Internal API: Fetching all machines...');
        const machines = await Machine.find().lean();

        const machinesWithUserInfo = await Promise.all(
            machines.map(async (machine) => {
                let userInfo = null;
                if (machine.userId) {
                    try {
                        const user = await User.findOne({ userId: machine.userId }).select('-password').lean();
                        if (user) {
                            userInfo = {
                                username: user.username,
                                email: user.email,
                                role: user.role
                            };
                        }
                    } catch (userError) {
                        console.warn(`⚠️ Could not find user for userId: ${machine.userId}`);
                    }
                }
                return { ...machine, userInfo };
            })
        );

        console.log(`✅ Internal API: Found ${machines.length} machines`);
        res.json(machinesWithUserInfo);
    } catch (error) {
        console.error('❌ Internal API error:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

app.get('/db/internal/users/email/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.post('/db/internal/users', async (req, res) => {
    try {
        const user = new User(req.body);
        const savedUser = await user.save();
        const userResponse = savedUser.toObject();
        delete userResponse.password;
        res.status(201).json(userResponse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/db/internal/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/db/internal/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// =================================================================
// INTERNAL WORK SHIFT API (NO AUTH)
// =================================================================

// Internal API cho mainServer lấy work shifts
app.get('/db/internal/work-shifts', async (req, res) => {
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
});

// Internal API lấy chi tiết work shift
app.get('/db/internal/work-shifts/:shiftId', async (req, res) => {
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
});

// Internal API thống kê work shifts
app.get('/db/internal/work-shifts/stats/summary', async (req, res) => {
    try {
        const { startDate, endDate, machineId, userId } = req.query;
        
        let matchQuery = { status: 'completed' };
        
        if (machineId) matchQuery.machineId = new mongoose.Types.ObjectId(machineId);
        if (userId) matchQuery.userId = userId;
        
        // Filter theo thời gian
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
                    totalBottles: { $sum: '$totalBottlesProduced' },
                    totalWeight: { $sum: '$totalWeightFilled' },
                    avgDuration: { $avg: '$duration' },
                    avgBottlesPerShift: { $avg: '$totalBottlesProduced' },
                    avgWeightPerShift: { $avg: '$totalWeightFilled' }
                }
            }
        ]);
        
        const dailyStats = await WorkShift.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        year: { $year: '$startTime' },
                        month: { $month: '$startTime' },
                        day: { $dayOfMonth: '$startTime' }
                    },
                    shiftsPerDay: { $sum: 1 },
                    bottlesPerDay: { $sum: '$totalBottlesProduced' },
                    weightPerDay: { $sum: '$totalWeightFilled' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
            { $limit: 30 }
        ]);
        
        res.json({
            summary: stats[0] || {
                totalShifts: 0,
                totalBottles: 0,
                totalWeight: 0,
                avgDuration: 0,
                avgBottlesPerShift: 0,
                avgWeightPerShift: 0
            },
            dailyStats
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// =================================================================
// MODBUS INTERNAL ROUTES (NO AUTH)
// =================================================================

app.put('/db/internal/machines/:id/status', async (req, res) => {
    try {
        const machine = await Machine.findByIdAndUpdate(
            req.params.id, 
            { 
                ...req.body,
                lastUpdate: new Date()
            }, 
            { new: true }
        );
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }
        res.json(machine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/db/internal/machines/:id/parameters', async (req, res) => {
    try {
        const machine = await Machine.findByIdAndUpdate(
            req.params.id, 
            { 
                parameters: req.body.parameters,
                lastUpdate: new Date()
            }, 
            { new: true }
        );
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }
        res.json(machine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// =================================================================
// INTERNAL USER API (NO AUTH) - THÊM CHO mainServer
// =================================================================

app.get('/db/internal/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/db/internal/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// =================================================================
// INTERNAL MACHINE CRUD API (NO AUTH) - THÊM CHO mainServer
// =================================================================

app.post('/db/internal/machines', async (req, res) => {
    try {
        const machine = new Machine(req.body);
        const savedMachine = await machine.save();
        res.status(201).json(savedMachine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/db/internal/machines/:id', async (req, res) => {
    try {
        const machine = await Machine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }
        res.json(machine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/db/internal/machines/:id', async (req, res) => {
    try {
        const machineToDelete = await Machine.findById(req.params.id);
        if (!machineToDelete) {
            return res.status(404).json({ message: 'Machine not found' });
        }
        
        await Machine.findByIdAndDelete(req.params.id);
        
        // Re-index machines
        const remainingMachines = await Machine.find({}).sort({ createdAt: 1 });
        const reindexResults = [];
        
        for (let i = 0; i < remainingMachines.length; i++) {
            const machine = remainingMachines[i];
            const newMachineId = `MACHINE_${String(i + 1).padStart(3, '0')}`;
            const oldMachineId = machine.machineId;
            
            if (oldMachineId !== newMachineId) {
                machine.machineId = newMachineId;
                machine.updatedAt = new Date();
                await machine.save();
                
                reindexResults.push({
                    oldId: oldMachineId,
                    newId: newMachineId,
                    name: machine.name
                });
            }
        }
        
        res.json({ 
            message: 'Machine deleted and IDs re-indexed successfully',
            deletedMachine: {
                machineId: machineToDelete.machineId,
                name: machineToDelete.name,
                ip: machineToDelete.ip,
                userId: machineToDelete.userId
            },
            reindexedMachines: reindexResults,
            totalRemainingMachines: remainingMachines.length
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/db/internal/machines/ip/:ip', async (req, res) => {
    try {
        const machine = await Machine.findOne({ ip: req.params.ip });
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }
        res.json(machine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// =================================================================
// ENHANCED INTERNAL WORK SHIFT API (WITH FILTERING)
// =================================================================

// Update existing work-shifts route để support filtering
app.get('/db/internal/work-shifts', async (req, res) => {
    try {
        const { 
            userId, 
            machineId, 
            status, 
            startDate, 
            endDate, 
            page = 1, 
            limit = 20 
        } = req.query;
        
        let filter = {};
        
        if (userId) filter.userId = userId;
        if (machineId) filter.machineId = machineId;
        if (status) filter.status = status;
        
        if (startDate || endDate) {
            filter.startTime = {};
            if (startDate) filter.startTime.$gte = new Date(startDate);
            if (endDate) filter.startTime.$lte = new Date(endDate);
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [workShifts, total] = await Promise.all([
            WorkShift.find(filter)
                .sort({ startTime: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            WorkShift.countDocuments(filter)
        ]);
        
        res.json({
            workShifts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/db/internal/work-shifts/active/current', async (req, res) => {
    try {
        const { userId } = req.query;
        
        let filter = { status: 'active' };
        if (userId) filter.userId = userId;
        
        const activeShifts = await WorkShift.find(filter)
            .sort({ startTime: -1 });
            
        res.json(activeShifts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add IP whitelist security
app.use('/db/internal/*', (req, res, next) => {
    const allowedIPs = ['127.0.0.1', '::1', 'localhost'];
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // Allow localhost and internal network
    if (allowedIPs.some(ip => clientIP.includes(ip)) || clientIP.includes('192.168.')) {
        next();
    } else {
        console.log(`🚫 Blocked internal API access from: ${clientIP}`);
        res.status(403).json({ message: 'Access denied - Internal API only' });
    }
});

// =================================================================
// SEED ROUTES
// =================================================================

app.post('/db/seed/machines', async (req, res) => {
    try {
        await Machine.deleteMany();
        const machines = await Machine.create([
            {
                machineId: 'MACHINE_001',
                name: 'ModSim Test Machine',
                type: 'Simulator',
                location: 'Development Lab',
                ip: '127.0.0.1',
                port: 502,
                status: 'offline',
                isConnected: false,
                userId: 'admin',
                parameters: {
                    monitoringData: {
                        machineStatus: 0,
                        saltTankStatus: 0,
                        saltType: 0
                    },
                    adminData: {
                        targetWeight: 0,
                        totalWeightLow: 0,
                        totalWeightHigh: 0,
                        totalBottles: 0
                    }
                }
            }
        ]);
        res.json({ 
            success: true, 
            message: `Created ${machines.length} machines`,
            machines: machines 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error seeding machines', 
            error: error.message 
        });
    }
});

// =================================================================
// START SERVER
// =================================================================
const PORT = process.env.DB_PORT || 5001;
server.listen(PORT, () => {
    console.log(`✅ DB Server running on port ${PORT}`);
    console.log(`🔄 Modbus polling active`);
    startModbusPolling();
});