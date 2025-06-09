import WorkShift from "../models/Workshift.js";
import { notificationService } from "./notificationService.js";

class WorkShiftService {
    constructor() {
        // Map theo dõi trạng thái máy
        this.machineWorkStates = new Map();
        // Map lưu data tạm trong quá trình làm việc
        this.tempShiftData = new Map();
        // Map đánh dấu máy đã đọc initial data hay chưa
        this.initialDataRead = new Map();
    }

    async handleTracking(machine, registers) {
        const machineStatus = registers[0]; // 40001 - Trạng thái hoạt động máy
        const machineKey = machine._id.toString();
        const previousState = this.machineWorkStates.get(machineKey);
        const currentTime = new Date();
        
        // Tạo dữ liệu parameters từ registers
        const currentParameters = {
            monitoringData: Object.fromEntries(Array.from({length: 7}, (_,i)=>[`4000${i+1}`, registers[i]||0])),
            adminData: Object.fromEntries(Array.from({length: 29}, (_,i)=>[(40008+i).toString(), registers[i+7]||0]))
        };

        try {
            // ✅ BƯỚC 1: KHI MỚI KẾT NỐI - ĐỌC INITIAL DATA
            if (!this.initialDataRead.get(machineKey)) {
                await this.handleInitialConnection(machine, currentParameters, currentTime);
                this.initialDataRead.set(machineKey, true);
            }

            // ✅ BƯỚC 2: XỬ LÝ LOGIC CA LÀMVIỆC
            await this.processWorkShiftLogic(machine, registers, currentParameters, currentTime, previousState);

        } catch (error) {
            console.error(`❌ [${machine.name}] Work shift tracking error:`, error.message);
        }
    }

    // ✅ XỬ LÝ KHI MỚI KẾT NỐI - ĐỌC INITIAL DATA
    async handleInitialConnection(machine, currentParameters, currentTime) {
        const machineKey = machine._id.toString();
        
        console.log(`🔌 [${machine.name}] First connection - Reading initial shift data...`);

        try {
            // Tìm ca active hiện tại trong database
            const activeShift = await WorkShift.findOne({
                machineId: machine._id,
                status: 'active'
            }).sort({ startTime: -1 });

            if (activeShift) {
                console.log(`📖 [${machine.name}] Found active shift: ${activeShift.shiftId}`);

                // So sánh data từ máy với data trong database
                const hasDataChanged = this.compareShiftData(activeShift.finalData, currentParameters);
                
                if (hasDataChanged) {
                    console.log(`🔄 [${machine.name}] Initial data differs from DB - Updating shift data...`);
                    
                    // Cập nhật data mới vào database
                    activeShift.finalData = currentParameters;
                    activeShift.totalBottlesProduced = currentParameters.monitoringData['40007'] || 0;
                    
                    const totalWeightLow = currentParameters.monitoringData['40005'] || 0;
                    const totalWeightHigh = currentParameters.monitoringData['40006'] || 0;
                    activeShift.totalWeightFilled = (totalWeightHigh * 65536) + totalWeightLow;
                    
                    activeShift.updatedAt = currentTime;
                    await activeShift.save();
                    
                    console.log(`💾 [${machine.name}] Shift data updated from machine`);
                } else {
                    console.log(`✅ [${machine.name}] Initial data matches DB - No update needed`);
                }

                // Khởi tạo state cho máy đang làm việc
                this.machineWorkStates.set(machineKey, {
                    isWorking: true,
                    currentShiftId: activeShift.shiftId,
                    lastData: currentParameters,
                    shiftStartTime: activeShift.startTime
                });
                
                // Khởi tạo temp data
                this.tempShiftData.set(machineKey, currentParameters);
                
            } else {
                console.log(`📝 [${machine.name}] No active shift found - Machine idle`);
                this.initializeMachineState(machine);
            }

        } catch (error) {
            console.error(`❌ [${machine.name}] Error reading initial shift data:`, error.message);
            this.initializeMachineState(machine);
        }
    }

    // ✅ XỬ LÝ LOGIC CA LÀM VIỆC CHÍNH
    async processWorkShiftLogic(machine, registers, currentParameters, currentTime, previousState) {
        const machineStatus = registers[0]; // 40001 - Trạng thái hoạt động máy
        const machineKey = machine._id.toString();

        // BẮT ĐẦU CA MỚI: 0 → 1
        if (machineStatus === 1) {
            await this.startNewWorkShift(machine, currentTime, currentParameters);
        }
        // ĐANG LÀM VIỆC: Cập nhật data tạm
        else if (previousState?.isWorking && machineStatus === 1) {
            this.updateTempShiftData(machine, currentParameters, currentTime);
        }
        // KẾT THÚC CA: 1 → 0 (TH1: Dừng bình thường)
        else if (previousState?.isWorking && machineStatus === 0) {
            await this.endWorkShiftNormally(machine, currentParameters, currentTime, previousState);
        }
        // MÁY DỪNG: Initialize state nếu chưa có
        else {
            if (!previousState) {
                this.initializeMachineState(machine);
            }
        }
    }

    // ✅ BẮT ĐẦU CA MỚI
    async startNewWorkShift(machine, currentTime, currentParameters) {
        const machineKey = machine._id.toString();
        
        console.log(`🟢 [${machine.name}] Starting new work shift...`);
        
        const shiftId = `SHIFT_${machine.machineId}_${Date.now()}`;
        
        const newShift = new WorkShift({
            shiftId: shiftId,
            machineId: machine._id,
            machineName: machine.name,
            userId: machine.userId,
            startTime: currentTime,
            status: 'active',
            finalData: currentParameters, // Lưu data ban đầu
            totalBottlesProduced: currentParameters.monitoringData['40007'] || 0,
            totalWeightFilled: this.calculateTotalWeight(currentParameters)
        });
        
        await newShift.save();
        console.log(`✅ [${machine.name}] Work shift created: ${shiftId}`);
        try {
            await notificationService.notifyMainServerShiftStarted(newShift);
            console.log(`📡 [${machine.name}] Shift start notification sent`);
        } catch (notifyError) {
            console.error(`❌ [${machine.name}] Failed to notify shift start:`, notifyError.message);
        }
        
        // Cập nhật state
        this.machineWorkStates.set(machineKey, {
            isWorking: true,
            currentShiftId: shiftId,
            lastData: currentParameters,
            shiftStartTime: currentTime
        });
        
        // Khởi tạo temp data
        this.tempShiftData.set(machineKey, currentParameters);
    }

    // ✅ CẬP NHẬT DATA TẠM TRONG QUÁ TRÌNH LÀM VIỆC
    updateTempShiftData(machine, currentParameters, currentTime) {
        const machineKey = machine._id.toString();
        
        console.log(`🔄 [${machine.name}] Updating temp shift data...`);
        
        // Cập nhật data tạm
        this.tempShiftData.set(machineKey, {
            ...currentParameters,
            lastUpdateTime: currentTime
        });
        
        // Cập nhật state
        const previousState = this.machineWorkStates.get(machineKey);
        this.machineWorkStates.set(machineKey, {
            ...previousState,
            lastData: currentParameters,
            lastUpdateTime: currentTime
        });
    }

    // ✅ KẾT THÚC CA BÌNH THƯỜNG (TH1)
    async endWorkShiftNormally(machine, currentParameters, currentTime, previousState) {
        const machineKey = machine._id.toString();
        
        console.log(`🔴 [${machine.name}] Ending work shift normally...`);
        
        try {
            const activeShift = await WorkShift.findOne({
                shiftId: previousState.currentShiftId,
                status: 'active'
            });
            
            if (activeShift) {
                // Lấy temp data
                const tempData = this.tempShiftData.get(machineKey);
                
                // So sánh current data với temp data
                const dataMatches = this.compareShiftData(currentParameters, tempData);
                
                let finalData, completionStatus;
                
                if (dataMatches) {
                    // Data khớp - lưu current data, đánh dấu hoàn chỉnh
                    finalData = currentParameters;
                    completionStatus = 'completed';
                    console.log(`✅ [${machine.name}] Data matches - Shift completed successfully`);
                } else {
                    // Data chưa khớp - lưu temp data, đánh dấu chưa hoàn chỉnh
                    finalData = tempData;
                    completionStatus = 'incomplete';
                    console.log(`⚠️ [${machine.name}] Data mismatch - Saving temp data, marked incomplete`);
                }
                
                // Cập nhật shift
                await this.updateShiftCompletion(activeShift, finalData, currentTime, completionStatus);
                
                // Cleanup
                this.cleanupMachineData(machineKey);
                
            } else {
                console.error(`❌ [${machine.name}] Active shift not found for: ${previousState.currentShiftId}`);
            }
            
        } catch (error) {
            console.error(`❌ [${machine.name}] Error ending shift normally:`, error.message);
            
            // Fallback: Lưu temp data
            await this.saveIncompleteShift(machine, previousState, currentTime);
        }
    }

    // ✅ XỬ LÝ MẤT KẾT NỐI ĐỘT NGỘT (TH2)
    async handleConnectionLoss(machine) {
        const machineKey = machine._id.toString();
        const currentState = this.machineWorkStates.get(machineKey);
        
        if (currentState?.isWorking) {
            console.log(`🚨 [${machine.name}] Connection lost during shift - Saving temp data...`);
            
            try {
                const activeShift = await WorkShift.findOne({
                    shiftId: currentState.currentShiftId,
                    status: 'active'
                });
                
                if (activeShift) {
                    const tempData = this.tempShiftData.get(machineKey);
                    
                    // Lưu temp data, đánh dấu interrupted
                    activeShift.finalData = tempData || currentState.lastData;
                    activeShift.status = 'interrupted';
                    activeShift.updatedAt = new Date();
                    activeShift.totalBottlesProduced = (tempData?.monitoringData['40007'] || 0);
                    activeShift.totalWeightFilled = this.calculateTotalWeight(tempData || currentState.lastData);
                    
                    await activeShift.save();
                    console.log(`💾 [${machine.name}] Temp data saved due to connection loss`);
                }
                
            } catch (error) {
                console.error(`❌ [${machine.name}] Error saving data after connection loss:`, error.message);
            }
        }
        
        // Reset initial data read flag để lần kết nối tiếp theo đọc lại
        this.initialDataRead.set(machineKey, false);
        this.cleanupMachineData(machineKey);
    }

    // ✅ CẬP NHẬT HOÀN THÀNH CA LÀM VIỆC
    async updateShiftCompletion(shift, finalData, endTime, status) {
        const duration = endTime - shift.startTime;
        const totalBottles = finalData.monitoringData['40007'] || 0;
        const totalWeight = this.calculateTotalWeight(finalData);
        
        shift.endTime = endTime;
        shift.duration = duration;
        shift.finalData = finalData;
        shift.totalBottlesProduced = totalBottles;
        shift.totalWeightFilled = totalWeight;
        shift.status = status;
        shift.updatedAt = endTime;
        
        await shift.save();
        
        console.log(`💾 [${shift.machineName}] Shift ${status}:`);
        console.log(`   📊 Duration: ${Math.round(duration/1000)}s`);
        console.log(`   🍶 Bottles: ${totalBottles}`);
        console.log(`   ⚖️ Total Weight: ${totalWeight}g`);
        console.log(`   📋 Status: ${status}`);
        
        // Notify mainServer
        await notificationService.notifyMainServerShiftCompleted(shift);
    }

    // ✅ SO SÁNH DATA
    compareShiftData(data1, data2) {
        if (!data1 || !data2) return false;
        
        // So sánh các trường quan trọng
        const key1 = data1.monitoringData?.['40007'] || 0; // Số chai
        const key2 = data2.monitoringData?.['40007'] || 0;
        const weight1 = this.calculateTotalWeight(data1);
        const weight2 = this.calculateTotalWeight(data2);
        
        return (key1 === key2) && (Math.abs(weight1 - weight2) < 10); // Tolerance 10g
    }

    // ✅ TÍNH TỔNG TRỌNG LƯỢNG
    calculateTotalWeight(data) {
        const low = data?.monitoringData?.['40005'] || 0;
        const high = data?.monitoringData?.['40006'] || 0;
        return (high * 65536) + low;
    }

    // ✅ CLEANUP DATA
    cleanupMachineData(machineKey) {
        this.machineWorkStates.set(machineKey, {
            isWorking: false,
            currentShiftId: null,
            lastData: null
        });
        this.tempShiftData.delete(machineKey);
    }

    // ✅ KHỞI TẠO STATE MÁY
    initializeMachineState(machine) {
        const machineKey = machine._id.toString();
        this.cleanupMachineData(machineKey);
    }

    // ✅ LƯU CA CHƯA HOÀN CHỈNH
    async saveIncompleteShift(machine, previousState, currentTime) {
        const machineKey = machine._id.toString();
        const tempData = this.tempShiftData.get(machineKey);
        
        if (tempData && previousState?.currentShiftId) {
            try {
                const shift = await WorkShift.findOne({
                    shiftId: previousState.currentShiftId,
                    status: 'active'
                });
                
                if (shift) {
                    await this.updateShiftCompletion(shift, tempData, currentTime, 'incomplete');
                }
            } catch (error) {
                console.error(`❌ [${machine.name}] Error saving incomplete shift:`, error.message);
            }
        }
        
        this.cleanupMachineData(machineKey);
    }
}

export const workShiftService = new WorkShiftService();