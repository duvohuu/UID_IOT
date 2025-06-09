// filepath: d:\Project\Project_7_IOT_IUDLab\WebServer\Back-end\dbServer\controllers\internalMachineController.js
import Machine from "../models/Machine.js";
import User from "../models/User.js";

export const getAllMachines = async (req, res) => {
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
};

export const createMachine = async (req, res) => {
    try {
        const machine = new Machine(req.body);
        const savedMachine = await machine.save();
        res.status(201).json(savedMachine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateMachine = async (req, res) => {
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
};

export const deleteMachine = async (req, res) => {
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
};

export const getMachineByIp = async (req, res) => {
    try {
        const machine = await Machine.findOne({ ip: req.params.ip });
        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }
        res.json(machine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};