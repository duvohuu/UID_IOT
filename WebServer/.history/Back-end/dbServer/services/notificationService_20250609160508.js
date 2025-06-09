import axios from "axios";

class NotificationService {
    constructor() {
        this.mainServerUrl = process.env.MAIN_SERVER_URL || "http://localhost:5000";
    }

    async notifyMainServer(machine) {
        try {
            await axios.post(`${this.mainServerUrl}/api/internal/machine-update`, {
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
        } catch (error) {
            console.error(`❌ [${machine.name}] Failed to notify main server:`, error.message);
        }
    }

    async notifyMainServerShiftCompleted(shift) {
        try {
            await axios.post(`${this.mainServerUrl}/api/internal/shift-completed`, {
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
            // console.log(`📡 [${shift.machineName}] Shift completion notified to mainServer`);
        } catch (error) {
            // console.error(`❌ Error notifying shift completion:`, error.message);
        }
    }

    // ✅ THÊM method này
    async notifyMainServerShiftStarted(shift) {
        try {
            await axios.post(`${this.mainServerUrl}/api/internal/shift-started`, {
                shiftId: shift.shiftId,
                machineId: shift.machineId,
                machineName: shift.machineName,
                userId: shift.userId,
                startTime: shift.startTime,
                status: shift.status,
                finalData: shift.finalData
            });
            // console.log(`📡 [${shift.machineName}] Shift start notified to mainServer`);
        } catch (error) {
            // console.error(`❌ Error notifying shift start:`, error.message);
        }
}
}

export const notificationService = new NotificationService();