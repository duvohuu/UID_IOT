import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Machine from '../models/Machine.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Template máy 
const MACHINE_TEMPLATE = {
    slaveId: 1,
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
};

// =====================================================
// 🔧 CẤU HÌNH THÊM MÁY CHO USER
// =====================================================

const CONFIG = {
    // Email của user cần thêm máy
    userEmails: [
        'newuser@test.com',    // userId sẽ là: test1
    ],  
    
    // Thông tin máy mới
    machine: {
        machineId: 'MACHINE_002',           
        name: 'Máy Test 1',      
        ip: '127.0.0.1',    
        port: 502,            
        location: 'Test',      
        type: 'Test Machine'
    }
};

// =====================================================

const addMachineToUsers = async () => {
    try {
        console.log('🚀 Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        console.log(`\n🔧 Adding machines to ${CONFIG.userEmails.length} users...`);
        
        const results = [];
        
        for (let i = 0; i < CONFIG.userEmails.length; i++) {
            const userEmail = CONFIG.userEmails[i];
            console.log(`\n📧 [${i + 1}/${CONFIG.userEmails.length}] Processing: ${userEmail}`);
            
            try {
                // Tìm user
                const user = await User.findOne({ email: userEmail });
                if (!user) {
                    console.log(`❌ User not found: ${userEmail}`);
                    results.push({ email: userEmail, status: 'User not found' });
                    continue;
                }
                
                console.log(`✅ User found: ${user.username} (userId: ${user.userId})`);
                
                // Tạo IP unique cho từng user
                const ipParts = CONFIG.machine.ip.split('.'); // ✅ Sửa từ baseIp thành ip
                ipParts[3] = parseInt(ipParts[3]) + i;
                const machineIp = ipParts.join('.');
                
                // Kiểm tra IP conflict
                const existingMachine = await Machine.findOne({ ip: machineIp });
                if (existingMachine) {
                    console.log(`❌ IP conflict: ${machineIp}`);
                    results.push({ email: userEmail, status: 'IP conflict', ip: machineIp });
                    continue;
                }
                
                const newMachine = await Machine.create({
                    ...MACHINE_TEMPLATE,
                    machineId: CONFIG.machine.machineId,
                    name: `${CONFIG.machine.name}`,
                    type: CONFIG.machine.type,
                    location: CONFIG.machine.location,
                    ip: machineIp,
                    port: CONFIG.machine.port,
                    userId: user.userId  
                });
                
                console.log(`✅ Created: ${newMachine.machineId} for ${user.userId} (${machineIp})`);
                results.push({
                    email: userEmail,
                    userId: user.userId,
                    status: 'Success',
                    machineId: newMachine.machineId,
                    machineName: newMachine.name,
                    ip: machineIp
                });
                
            } catch (error) {
                console.log(`❌ Error for ${userEmail}: ${error.message}`);
                results.push({ email: userEmail, status: 'Error', error: error.message });
            }
        }
        
        // ======= HIỂN THỊ KẾT QUẢ =======
        console.log('\n🎉 BATCH OPERATION COMPLETED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const successful = results.filter(r => r.status === 'Success');
        const failed = results.filter(r => r.status !== 'Success');
        
        console.log(`📊 Total: ${results.length} | Success: ${successful.length} | Failed: ${failed.length}`);
        
        if (successful.length > 0) {
            console.log('\n✅ Successful creations:');
            successful.forEach((result, index) => {
                console.log(`   ${index + 1}. ${result.machineId} - ${result.userId} (${result.ip})`);
            });
        }
        
        if (failed.length > 0) {
            console.log('\n❌ Failed creations:');
            failed.forEach((result, index) => {
                console.log(`   ${index + 1}. ${result.email} - ${result.status}`);
            });
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Batch operation failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

// Chạy function
addMachineToUsers();