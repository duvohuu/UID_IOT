import User from "../models/User.js";
import Machine from "../models/Machine.js";

export const seedCompleteSystem = async (req, res) => {
    try {
        console.log('🗑️ Clearing all existing data...');
        await User.deleteMany();
        await Machine.deleteMany();

        // ✅ TẠO USER ADMIN
        console.log('👥 Creating admin user...');
        const admin = await User.create({
            userId: 'du.vohuudu',
            username: 'ADMIN',
            email: 'du.vohuudu@gmail.com',
            password: '123456',
            role: 'admin',
            avatar: null
        });

        console.log(`✅ Created user: ${admin.username} (${admin.email}) - Role: ${admin.role}`);

        // ✅ TẠO MACHINE
        console.log('🔧 Creating machine...');
        const machine = await Machine.create({
            machineId: 'MACHINE_001',
            name: 'Máy chiết muối',
            type: 'Salt Filling Machine',
            location: 'IUD Lab',
            ip: '192.168.1.200',
            port: 502,
            slaveId: 1,
            userId: admin.userId,
            status: 'offline',
            isConnected: false,
            parameters: {
                monitoringData: {
                    '40001': 0, '40002': 0, '40003': 0, '40004': 0,
                    '40005': 0, '40006': 0, '40007': 0
                },
                adminData: {
                    '40008': 0, '40009': 0, '40010': 0, '40011': 0,
                    '40012': 0, '40013': 0, '40014': 0, '40015': 0,
                    '40016': 0, '40017': 0, '40018': 0, '40019': 0,
                    '40020': 0, '40021': 0, '40022': 0, '40023': 0,
                    '40024': 0, '40025': 0, '40026': 0, '40027': 0,
                    '40028': 0, '40029': 0, '40030': 0, '40031': 0,
                    '40032': 0, '40033': 0, '40034': 0, '40035': 0,
                    '40036': 0
                }
            },
            uptime: 0,
            totalOperationTime: 0,
            errorCount: 0
        });

        console.log(`✅ Created machine: ${machine.name} (${machine.ip})`);

        res.status(201).json({
            success: true,
            message: 'Complete system seeded successfully',
            data: {
                user: {
                    username: admin.username,
                    email: admin.email,
                    role: admin.role,
                    userId: admin.userId
                },
                machine: {
                    machineId: machine.machineId,
                    name: machine.name,
                    ip: machine.ip,
                    location: machine.location
                }
            }
        });

    } catch (error) {
        console.error('❌ Seeding error:', error);
        res.status(500).json({
            success: false,
            message: 'Error seeding system',
            error: error.message
        });
    }
};

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
                        '40001': 0, '40002': 0, '40003': 0, '40004': 0,
                        '40005': 0, '40006': 0, '40007': 0
                    },
                    adminData: {
                        '40008': 0, '40009': 0, '40010': 0, '40011': 0,
                        '40012': 0, '40013': 0, '40014': 0, '40015': 0,
                        '40016': 0, '40017': 0, '40018': 0, '40019': 0,
                        '40020': 0, '40021': 0, '40022': 0, '40023': 0,
                        '40024': 0, '40025': 0, '40026': 0, '40027': 0,
                        '40028': 0, '40029': 0, '40030': 0, '40031': 0,
                        '40032': 0, '40033': 0, '40034': 0, '40035': 0,
                        '40036': 0
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