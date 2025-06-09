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
        
        let machineNumber = 1; 
        if (machine.machineId) {
            const machineMatch = machine.machineId.match(/(\d+)/);
            if (machineMatch) {
                machineNumber = parseInt(machineMatch[1]);
            }
        }
        
        const shiftId = `M${machineNumber}_S${shiftNumber}`;
        
        console.log(`\n🔍 [${machine.name}] === SHIFT CHECK ===`);
        console.log(`   📊 Register 40009 (Low): ${shiftIdLow}`);
        console.log(`   📊 Register 40010 (High): ${shiftIdHigh}`);
        console.log(`   🏭 Machine ID: ${machine.machineId}`); 
        console.log(`   🏭 Machine Number: ${machineNumber}`); 
        console.log(`   📋 Shift Number: ${shiftNumber}`);
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
                await this.createNewShiftFromData(machine, shiftId, machineNumber, shiftNumber, currentParameters, currentTime);
            }
            
        } catch (error) {
            console.error(`❌ [${machine.name}] Error processing shift ${shiftId}:`, error.message);
            console.error(`❌ [${machine.name}] Error stack:`, error.stack);
        }
        
        console.log(`🔍 [${machine.name}] === END SHIFT CHECK ===\n`);
    }

    // TẠO CA MỚI TỪ DATA
    async createNewShiftFromData(machine, shiftId, machineNumber, shiftNumber, currentParameters, currentTime) {
        console.log(`\n🟢 [${machine.name}] === CREATING NEW SHIFT ===`);
        console.log(`   🆔 Shift ID: ${shiftId}`);
        
        // Trích xuất thời gian từ register 40037-40042
        const startTime = this.extractTimeFromRegisters(currentParameters.adminData, 'start');
        const endTime = this.extractTimeFromRegisters(currentParameters.adminData, 'end');
        
        console.log(`   ⏰ Start time: ${startTime ? startTime.toISOString() : 'null'}`);
        console.log(`   ⏰ End time: ${endTime ? endTime.toISOString() : 'null'}`);
        
        // Kiểm tra weight calculation
        const totalWeight = this.calculateTotalWeight(currentParameters);
        console.log(`   ⚖️ Total weight: ${totalWeight}g`);
        console.log(`   📊 Weight registers:`, {
            '40005': currentParameters.monitoringData?.['40005'],
            '40006': currentParameters.monitoringData?.['40006']
        });
        
        // Xác định duration
        let duration = null;
        if (endTime && startTime && endTime > startTime) {
            duration = Math.round((endTime - startTime) / (1000 * 60)); // minutes
            console.log(`   ⏱️ Calculated duration: ${duration} minutes`);
        } else {
            console.log(`   ⏱️ Duration: null (missing end time or invalid times)`);
        }
        
        const newShift = new WorkShift({
            shiftId: shiftId,
            machineId: machine.machineId,
            machineName: machine.name,
            userId: machine.userId,
            machineNumber: machineNumber,
            shiftNumber: shiftNumber,
            startTime: startTime || currentTime,
            endTime: endTime,
            duration: duration,
            status: endTime ? 'completed' : 'active',
            finalData: currentParameters,
            totalBottlesProduced: currentParameters.monitoringData['40007'] || 0,
            totalWeightFilled: totalWeight
        });
        
        // ✅ DEBUG: Pre-save values
        console.log(`   💾 Pre-save values:`, {
            totalWeightFilled: newShift.totalWeightFilled,
            duration: newShift.duration,
            startTime: newShift.startTime,
            endTime: newShift.endTime,
            status: newShift.status
        });
        
        console.log(`💾 [${machine.name}] Saving shift to database...`);
        await newShift.save();
        
        // ✅ DEBUG: Post-save values (efficiency should be calculated)
        console.log(`   ✅ Post-save values:`, {
            efficiency: newShift.efficiency,
            totalWeightFilled: newShift.totalWeightFilled,
            duration: newShift.duration
        });
        
        return newShift;
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
            
            let second, minute, hour, day, month, year;
            
            if (type === 'start') {
                second = adminData['40037'] || 0;
                minute = adminData['40038'] || 0;
                hour = adminData['40039'] || 0;
                day = adminData['40040'] || 1;
                month = adminData['40041'] || 1;
                year = adminData['40042'] || new Date().getFullYear();
            } else if (type === 'end') {
                second = adminData['40043'] || 0;
                minute = adminData['40044'] || 0;
                hour = adminData['40045'] || 0;
                day = adminData['40046'] || 1;
                month = adminData['40047'] || 1;
                year = adminData['40048'] || new Date().getFullYear();
            } else {
                return null;
            }
            
            // ✅ SỬA: Kiểm tra giá trị hợp lệ
            if (year < 2020 || month < 1 || month > 12 || day < 1 || day > 31 || 
                hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
                console.log(`⚠️ Invalid ${type} time values: ${year}-${month}-${day} ${hour}:${minute}:${second}`);
                return null;
            }
            
            const date = new Date(year, month - 1, day, hour, minute, second);
            return date;
            
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