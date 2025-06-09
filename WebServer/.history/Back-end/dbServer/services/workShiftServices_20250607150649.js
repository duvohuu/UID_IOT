import WorkShift from "../models/Workshift.js";
import { notificationService } from "./notificationService.js";

class WorkShiftService {
    constructor() {
        this.machineWorkStates = new Map();
    }

    async handleTracking(machine, registers) {
        const machineStatus = registers[0]; // 40001 - Trạng thái hoạt động máy
        const previousState = this.machineWorkStates.get(machine._id.toString());
        const currentTime = new Date();
        
        // Tạo dữ liệu parameters từ registers
        const currentParameters = {
            monitoringData: Object.fromEntries(Array.from({length: 7}, (_,i)=>[`4000${i+1}`, registers[i]||0])),
            adminData: Object.fromEntries(Array.from({length: 29}, (_,i)=>[(40008+i).toString(), registers[i+7]||0]))
        };
        
        try {
            // ✅ BẮT ĐẦU CA MỚI: 0 → 1
            if (!previousState?.isWorking && machineStatus === 1) {
                await this.startNewWorkShift(machine, currentTime, currentParameters);
            }
            // ✅ ĐANG LÀM VIỆC: Cập nhật dữ liệu tạm
            else if (previousState?.isWorking && machineStatus === 1) {
                this.updateWorkingData(machine, currentParameters, currentTime);
            }
            // ✅ KẾT THÚC CA: 1 → 0
            else if (previousState?.isWorking && machineStatus === 0) {
                await this.endWorkShift(machine, currentParameters, currentTime, previousState);
            }
            // ✅ MÁY DỪNG: Initialize state nếu chưa có
            else {
                if (!previousState) {
                    this.initializeMachineState(machine);
                }
            }
        } catch (error) {
            console.error(`❌ [${machine.name}] Work shift tracking error:`, error.message);
        }
    }

    async startNewWorkShift(machine, currentTime, currentParameters) {
        console.log(`🟢 [${machine.name}] Starting new work shift...`);
        
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
        
        this.machineWorkStates.set(machine._id.toString(), {
            isWorking: true,
            currentShiftId: shiftId,
            lastData: currentParameters
        });
    }

    updateWorkingData(machine, currentParameters, currentTime) {
        console.log(`🔄 [${machine.name}] Updating work shift data (not saving to DB)...`);
        
        const previousState = this.machineWorkStates.get(machine._id.toString());
        this.machineWorkStates.set(machine._id.toString(), {
            ...previousState,
            lastData: currentParameters,
            lastUpdateTime: currentTime
        });
    }

    async endWorkShift(machine, currentParameters, currentTime, previousState) {
        console.log(`🔴 [${machine.name}] Ending work shift - SAVING FINAL DATA...`);
        
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
            const totalWeight = (totalWeightHigh * 65536) + totalWeightLow;
            
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
            
            await notificationService.notifyMainServerShiftCompleted(activeShift);
        }
        
        this.initializeMachineState(machine);
    }

    initializeMachineState(machine) {
        this.machineWorkStates.set(machine._id.toString(), {
            isWorking: false,
            currentShiftId: null,
            lastData: null
        });
    }
}

export const workShiftService = new WorkShiftService();