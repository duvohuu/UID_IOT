import Machine from "../models/Machine.js";

export const seedMachines = async (req, res) => {
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
        
        res.status(201).json({ 
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
};