import net from "net";
import Machine from "../models/Machine.js";
import { MODBUS_CONFIG, NETWORK_CONFIG } from "../config/modbus.js";
import { workShiftService } from "./workShiftService.js";
import { notificationService } from "./notificationService.js";

class ModbusService {
    constructor() {
        this.machineTransactionIds = new Map();
        this.machineConnectionLocks = new Map();
        this.isPolling = false;
    }

    async startPolling() {
        if (this.isPolling) return;
        
        console.log('🚀 Starting Modbus polling system...');
        console.log(`⏰ Scan interval: ${MODBUS_CONFIG.scanInterval/1000}s`);
        console.log(`⏱️ Timeout per machine: ${MODBUS_CONFIG.timeout/1000}s`);
        
        this.isPolling = true;
        
        // Delay nhỏ trước khi bắt đầu quét lần đầu
        setTimeout(() => {
            console.log('🔄 Starting first scan cycle...');
            this.scanAllMachines();
        }, 2000);
        
        // Thiết lập interval quét định kỳ
        setInterval(() => {
            this.scanAllMachines();
        }, MODBUS_CONFIG.scanInterval);
        
        console.log('✅ Modbus polling system initialized');
    }

    async scanAllMachines() {
        try {
            console.log('🔍 Starting scan cycle for all machines...');
            const allMachines = await Machine.find({});
            
            if (allMachines.length === 0) {
                console.log('📭 No machines found to scan');
                return;
            }

            console.log(`🔄 Scanning ${allMachines.length} machines...`);
            
            for (let i = 0; i < allMachines.length; i++) {
                const machine = allMachines[i];
                const wasOnline = machine.isConnected;
                
                console.log(`📡 [${i+1}/${allMachines.length}] Scanning ${machine.name} (${machine.ip}) - Current: ${machine.status}`);
                
                await this.readMachineData(machine);
                
                const updatedMachine = await Machine.findById(machine._id);
                const isNowOnline = updatedMachine.isConnected;
                
                this.logStatusChange(machine.name, wasOnline, isNowOnline);
                
                if (i < allMachines.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, NETWORK_CONFIG.delayBetweenScans));
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

    async readMachineData(machine) {
        const lockKey = `${machine._id}`;
        if (this.machineConnectionLocks.has(lockKey)) return;
        
        this.machineConnectionLocks.set(lockKey, true);
        try {
            await this.performModbusRead(machine);
        } finally {
            this.machineConnectionLocks.delete(lockKey);
        }
    }

    async performModbusRead(machine) {
        return new Promise((resolve) => {
            const client = new net.Socket();
            client.setTimeout(MODBUS_CONFIG.timeout);
            let isResolved = false;
            let connectionTimer;

            const cleanup = () => {
                try {
                    if (connectionTimer) clearTimeout(connectionTimer);
                    client.removeAllListeners();
                    if (!client.destroyed) client.destroy();
                } catch {}
            };

            connectionTimer = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true; 
                    cleanup();
                    resolve();
                }
            }, MODBUS_CONFIG.timeout);

            client.connect(MODBUS_CONFIG.port, machine.ip, () => {
                const { buffer } = this.createModbusRequest(machine);
                client.write(buffer);
            });

            client.on('data', async (data) => {
                if (isResolved) return;
                
                if (data.length >= 9 && data[7] > 0x80) {
                    if (machine.name.includes('ModSim')) {
                        this.machineTransactionIds.set(machine._id, 1);
                    }
                    await this.updateMachineStatus(machine._id, { 
                        isConnected: false, 
                        status: 'error', 
                        lastError: `ModBus error ${data[8]}`, 
                        disconnectedAt: new Date() 
                    });
                    isResolved = true; 
                    cleanup(); 
                    resolve();
                    return;
                }

                const expectedDataLength = 9 + (42 * 2);
                if (data.length >= expectedDataLength) {
                    const registers = [];
                    for (let i = 0; i < 42; i++) {
                        registers[i] = data.readUInt16BE(9 + (i * 2));
                    }
                    
                    console.log(`📊 [${machine.name}] Sample data - 40001:${registers[0]}, 40002:${registers[1]}, 40003:${registers[2]}`);
                    
                    // Work shift tracking
                    await workShiftService.handleTracking(machine, registers);
                    
                    const parameters = {
                        monitoringData: Object.fromEntries(Array.from({length: 7}, (_,i)=>[`4000${i+1}`, registers[i]||0])),
                        adminData: Object.fromEntries(Array.from({length: 29}, (_,i)=>[(40008+i).toString(), registers[i+7]||0]))
                    };
                    
                    await this.updateMachineStatus(machine._id, { 
                        isConnected: true, 
                        status: 'online', 
                        lastHeartbeat: new Date(), 
                        parameters, 
                        lastError: null 
                    });
                    
                    isResolved = true; 
                    cleanup(); 
                    resolve();
                } else {
                    isResolved = true; 
                    cleanup(); 
                    resolve();
                }
            });

            client.on('error', async () => {
                if (isResolved) return;
                await this.updateMachineStatus(machine._id, { 
                    isConnected: false, 
                    status: 'offline', 
                    lastError: 'Connection error', 
                    disconnectedAt: new Date() 
                });
                isResolved = true; 
                cleanup(); 
                resolve();
            });

            client.on('timeout', async () => {
                if (isResolved) return;
                await this.updateMachineStatus(machine._id, { 
                    isConnected: false, 
                    status: 'timeout', 
                    lastError: 'Socket timeout', 
                    disconnectedAt: new Date() 
                });
                isResolved = true; 
                cleanup(); 
                resolve();
            });

            client.on('close', () => {
                if (!isResolved) { 
                    isResolved = true; 
                    cleanup(); 
                    resolve(); 
                }
            });
        });
    }

    createModbusRequest(machine) {
        const buffer = Buffer.alloc(12);
        const transactionId = this.getNextTransactionId(machine._id, machine.name);
        buffer.writeUInt16BE(transactionId, 0);
        buffer.writeUInt16BE(0, 2);
        buffer.writeUInt16BE(6, 4);
        buffer.writeUInt8(1, 6);
        buffer.writeUInt8(3, 7);
        buffer.writeUInt16BE(0, 8);
        buffer.writeUInt16BE(36, 10);
        return { buffer, transactionId };
    }

    getNextTransactionId(machineId, machineName) {
        const isModSim = machineName && machineName.includes('ModSim');
        const maxId = isModSim ? 100 : MODBUS_CONFIG.resetTransactionId;
        if (!this.machineTransactionIds.has(machineId)) this.machineTransactionIds.set(machineId, 1);
        let currentId = this.machineTransactionIds.get(machineId);
        currentId++;
        if (currentId > maxId) currentId = 1;
        this.machineTransactionIds.set(machineId, currentId);
        return currentId;
    }

    async updateMachineStatus(machineId, updateData) {
        try {
            const machine = await Machine.findByIdAndUpdate(
                machineId, 
                { ...updateData, lastUpdate: new Date() }, 
                { new: true }
            );
            
            if (machine) {
                // ✅ THÊM: Xử lý connection loss cho work shift
                if (!updateData.isConnected && machine.isConnected) {
                    console.log(`🚨 [${machine.name}] Detected connection loss - Notifying work shift service`);
                    await workShiftService.handleConnectionLoss(machine);
                }
                
                await notificationService.notifyMainServer(machine);
            }
        } catch (error) {
            console.error('Error updating machine status:', error.message);
        }
    }

    logStatusChange(machineName, wasOnline, isNowOnline) {
        if (!wasOnline && isNowOnline) {
            console.log(`✅ [${machineName}] Machine came ONLINE - Data updated`);
        } else if (wasOnline && !isNowOnline) {
            console.log(`❌ [${machineName}] Machine went OFFLINE`);
        } else if (isNowOnline) {
            console.log(`📊 [${machineName}] Online - Data refreshed`);
        } else {
            console.log(`⚫ [${machineName}] Still offline`);
        }
    }
}

export const modbusService = new ModbusService();