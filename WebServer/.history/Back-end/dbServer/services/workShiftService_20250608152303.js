import { parse } from "dotenv";
import WorkShift from "../models/Workshift.js";
import { notificationService } from "./notificationService.js";

class WorkShiftService {
    constructor() {
        // Map theo dõi ca đã được xử lý
        this.processedShifts = new Map();
    }

    async handleTracking(machine, registers) {
        const currentTime = new Date();
        
        // ✅ TẠO DATA STRUCTURE MỚI (42 registers total)
        const currentParameters = {
            // Monitoring data (40001-40008)
            monitoringData: {
                '40001': registers[0] || 0,  // Trạng thái hoạt động
                '40002': registers[1] || 0,  // Trạng thái bồn cấp muối
                '40003': registers[2] || 0,  // Loại muối
                '40004': registers[3] || 0,  // Khối lượng cần chiết
                '40005': registers[4] || 0,  // Tổng KL (Low)
                '40006': registers[5] || 0,  // Tổng KL (High)
                '40007': registers[6] || 0,  // Tổng số chai
                '40008': registers[7] || 0   // Số line hoạt động
            },
            // Admin data (40009-40048)
            adminData: Object.fromEntries(
                Array.from({length: 40}, (_, i) => [
                    (40009 + i).toString(), 
                    registers[i + 8] || 0
                ])
            )
        };

        try {
            // ✅ LOGIC MỚI: Kiểm tra ID ca từ register 40009 và 40010
            await this.checkAndCreateShiftByID(machine, currentParameters, currentTime);

        } catch (error) {
            console.error(`❌ [${machine.name}] Work shift tracking error:`, error.message);
        }
    }

    // ✅ KIỂM TRA VÀ TẠO CA THEO ID
    async checkAndCreateShiftByID(machine, currentParameters, currentTime) {
        // ✅ Lấy ID ca từ register 40009 (Low) và 40010 (High)
        const shiftIdLow = currentParameters.adminData['40009'] || 0;
        const shiftIdHigh = currentParameters.adminData['40010'] || 0;
        
        const shiftNumber = (shiftIdHigh * 65536) + shiftIdLow;
        const machineNumber = parseInt(machine.machineId) || 1;
        const shiftId = `M${machineNumber}_S${shiftNumber}`;
        
        console.log(`\n🔍 [${machine.name}] === SHIFT CHECK ===`);
        console.log(`   📊 Register 40009 (Low): ${shiftIdLow}`);
        console.log(`   📊 Register 40010 (High): ${shiftIdHigh}`);
        console.log(`   🆔 Shift ID: ${shiftId}`);
        
        // ✅ Nếu ID = 0, không có ca nào
        if (shiftNumber === 0) {
            console.log(`⏸️ [${machine.name}] No active shift (ID = 0)`);
            console.log(`🔍 [${machine.name}] === END SHIFT CHECK ===\n`);
            return;
        }
        
        try {
            // ✅ Kiểm tra ca đã tồn tại trong DB chưa
            console.log(`🔍 [${machine.name}] Checking database for shift: ${shiftId}`);
            const existingShift = await WorkShift.findOne({ shiftId: shiftId });
            
            if (existingShift) {
                // ✅ Ca đã tồn tại - chỉ cập nhật data
                console.log(`📝 [${machine.name}] ✅ SHIFT EXISTS - Updating: ${shiftId}`);
                await this.updateExistingShift(existingShift, currentParameters, currentTime);
            } else {
                // ✅ Ca chưa tồn tại - tạo mới
                console.log(`🆕 [${machine.name}] ⭐ NEW SHIFT DETECTED - Creating: ${shiftId}`);
                await this.createNewShiftFromData(machine, shiftId, currentParameters, currentTime);
            }
            
        } catch (error) {
            console.error(`❌ [${machine.name}] Error processing shift ${shiftId}:`, error.message);
            console.error(`❌ [${machine.name}] Error stack:`, error.stack);
        }
        
        console.log(`🔍 [${machine.name}] === END SHIFT CHECK ===\n`);
    }

    // ✅ TẠO CA MỚI TỪ DATA
    async createNewShiftFromData(machine, shiftId, machineNumber, shiftNumber, currentParameters, currentTime) {
        console.log(`\n🟢 [${machine.name}] === CREATING NEW SHIFT ===`);
        console.log(`   🆔 Shift ID: ${shiftId}`);
        console.log(`   🏭 Machine ID: ${machine.machineId}`);
        console.log(`   👤 User ID: ${machine.userId}`);
        
        // ✅ Trích xuất thời gian từ register 40037-40042
        const startTime = this.extractTimeFromRegisters(currentParameters.adminData, 'start');
        const endTime = this.extractTimeFromRegisters(currentParameters.adminData, 'end');
        
        console.log(`   ⏰ Start time: ${startTime ? startTime.toISOString() : 'null'}`);
        console.log(`   ⏰ End time: ${endTime ? endTime.toISOString() : 'null'}`);
        
        // ✅ Xác định status dựa trên thời gian
        let status = 'active';
        let actualEndTime = null;
        let duration = null;
        
        if (endTime && endTime > startTime) {
            status = 'completed';
            actualEndTime = endTime;
            duration = endTime - startTime;
        }
        
        console.log(`   📊 Status: ${status}`);
        console.log(`   ⏱️ Duration: ${duration}`);
        
        try {
            const newShift = new WorkShift({
                shiftId: shiftId,
                machineId: machine.machineId,
                machineName: machine.name,
                userId: machine.userId,
                machineNumber: machineNumber,
                shiftNumber: shiftNumber,
                startTime: startTime || currentTime,
                endTime: actualEndTime,
                duration: duration,
                status: status,
                finalData: currentParameters,
                totalBottlesProduced: currentParameters.monitoringData['40007'] || 0,
                totalWeightFilled: this.calculateTotalWeight(currentParameters)
            });
            
            console.log(`💾 [${machine.name}] Saving shift to database...`);
            await newShift.save();
            console.log(`✅ [${machine.name}] Shift saved successfully: ${shiftId} (${status})`);
            
            // ✅ Notify mainServer
            try {
                console.log(`📡 [${machine.name}] Sending notification to mainServer...`);
                if (status === 'active') {
                    await notificationService.notifyMainServerShiftStarted(newShift);
                } else {
                    await notificationService.notifyMainServerShiftCompleted(newShift);
                }
                console.log(`📡 [${machine.name}] ✅ Notification sent successfully (${status})`);
            } catch (notifyError) {
                console.error(`❌ [${machine.name}] Failed to notify:`, notifyError.message);
            }
            
        } catch (saveError) {
            console.error(`❌ [${machine.name}] FAILED TO SAVE SHIFT:`, saveError.message);
            console.error(`❌ [${machine.name}] Save error details:`, saveError);
        }
        
        console.log(`🟢 [${machine.name}] === END CREATING SHIFT ===\n`);
    }

    // ✅ CẬP NHẬT CA ĐÃ TỒN TẠI
    async updateExistingShift(shift, currentParameters, currentTime) {
        console.log(`🔄 [${shift.machineName}] Updating existing shift: ${shift.shiftId}`);
        
        // ✅ Cập nhật data mới nhất
        shift.finalData = currentParameters;
        shift.totalBottlesProduced = currentParameters.monitoringData['40007'] || 0;
        shift.totalWeightFilled = this.calculateTotalWeight(currentParameters);
        shift.updatedAt = currentTime;
        
        // ✅ Kiểm tra nếu ca vừa kết thúc
        const endTime = this.extractTimeFromRegisters(currentParameters.adminData, 'end');
        
        if (endTime && shift.status === 'active' && endTime > shift.startTime) {
            console.log(`🔴 [${shift.machineName}] Shift completed: ${shift.shiftId}`);
            shift.endTime = endTime;
            shift.duration = endTime - shift.startTime;
            shift.status = 'completed';
            
            // ✅ Notify completion
            try {
                await notificationService.notifyMainServerShiftCompleted(shift);
                console.log(`📡 [${shift.machineName}] Shift completion notified`);
            } catch (error) {
                console.error(`❌ [${shift.machineName}] Failed to notify completion:`, error.message);
            }
        }
        
        await shift.save();
    }

    // ✅ TRÍCH XUẤT THỜI GIAN TỪ REGISTERS
    extractTimeFromRegisters(adminData, type) {
        try {
            // Registers cho start time: 40037-40042
            // Registers cho end time:  40043-40048
            
            const second_start = adminData['40037'] || 0;
            const minute_start = adminData['40038'] || 0;
            const hour_start = adminData['40039'] || 0;
            const day_start = adminData['40040'] || 1;
            const month_start = adminData['40041'] || 1;
            const year_start = adminData['40042'] || new Date().getFullYear();

            const second_end = adminData['40043'] || 0;
            const minute_end = adminData['40044'] || 0;
            const hour_end = adminData['40045'] || 0;
            const day_end = adminData['40046'] || 1;
            const month_end = adminData['40047'] || 1;
            const year_end = adminData['40048'] || new Date().getFullYear();
            
            
            const date_start = new Date(year_start, month_start - 1, day_start, hour_start, minute_start, second_start);
            const date_end = new Date(year_end, month_end - 1, day_end, hour_end, minute_end, second_end);
            
            return date_start - date_end;
            
        } catch (error) {
            console.error(`❌ Error extracting ${type} time:`, error.message);
            return null;
        }
    }

    // ✅ TÍNH TỔNG TRỌNG LƯỢNG
    calculateTotalWeight(data) {
        const low = data?.monitoringData?.['40005'] || 0;
        const high = data?.monitoringData?.['40006'] || 0;
        return (high * 65536) + low;
    }
}

export const workShiftService = new WorkShiftService();