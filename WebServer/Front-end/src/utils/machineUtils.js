export const defaultMachines = [
    {
        id: 'default_1',
        _id: 'default_1',
        machineId: 'DEFAULT_MACHINE_001',
        name: 'Máy mặc định 1',
        type: 'Processing',
        location: 'Test Lab',
        ip: '127.0.0.1',
        port: 502,
        status: 'offline',
        isConnected: false,
        lastUpdate: null,
        lastHeartbeat: null,
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
        },
        uptime: null
    },
    {
        id: 'default_2',
        _id: 'default_2',
        machineId: 'DEFAULT_MACHINE_002',
        name: 'Máy mặc định 2',
        type: 'Packaging',
        location: 'Test Lab',
        ip: '127.0.0.2',
        port: 502,
        status: 'offline',
        isConnected: false,
        lastUpdate: null,
        lastHeartbeat: null,
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
        },
        uptime: null
    },
    {
        id: 'default_3',
        _id: 'default_3',
        machineId: 'DEFAULT_MACHINE_003',
        name: 'Máy mặc định 3',
        type: 'Quality Control',
        location: 'Test Lab',
        ip: '127.0.0.3',
        port: 502,
        status: 'offline',
        isConnected: false,
        lastUpdate: null,
        lastHeartbeat: null,
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
        },
        uptime: null
    }
];