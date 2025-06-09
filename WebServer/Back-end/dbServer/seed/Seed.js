import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Machine from '../models/Machine.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('🚀 Starting complete system seeding...');
console.log('📍 MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');

// Kết nối DB
await mongoose.connect(process.env.MONGO_URI);
console.log('✅ Connected to MongoDB');

// Xóa tất cả dữ liệu cũ
console.log('🗑️ Clearing all existing data...');
await User.deleteMany();
await Machine.deleteMany();

// ✅ TẠO USER
console.log('👥 Creating user...');
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
            '40001': 0, // Trạng thái hoạt động máy
            '40002': 0, // Trạng thái bồn cấp muối
            '40003': 0, // Loại muối đang chiết
            '40004': 0, // Khối lượng cần chiết rót
            '40005': 0, // Tổng KL đã chiết (Low)
            '40006': 0, // Tổng KL đã chiết (High)
            '40007': 0  // Tổng số chai đã chiết
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

// ✅ HIỂN THỊ TỔNG KẾT
console.log('\n🎉 SEEDING COMPLETED!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`👤 User: ${admin.username} (${admin.email})`);
console.log(`🔧 Machine: ${machine.name} (${machine.ip})`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

await mongoose.disconnect();
console.log('👋 Disconnected from MongoDB');
console.log('🚀 Now you can start the servers and test login!');