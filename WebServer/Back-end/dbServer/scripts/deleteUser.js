import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Machine from '../models/Machine.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// =====================================================
// 🔧 CẤU HÌNH XÓA USER
// =====================================================

const CONFIG = {
    // ✏️ Email của user cần xóa
    userEmail: 'test1@example.com'
};

// =====================================================

const deleteUser = async () => {
    try {
        console.log('🚀 Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        console.log(`\n🔍 Finding user: ${CONFIG.userEmail}...`);
        
        // Tìm user
        const user = await User.findOne({ email: CONFIG.userEmail });
        if (!user) {
            console.log('❌ User not found!');
            console.log('💡 Available users:');
            const allUsers = await User.find({}, 'username email userId');
            allUsers.forEach(u => console.log(`   - ${u.username} (${u.email}) - ${u.userId}`));
            return;
        }
        
        console.log(`✅ User found: ${user.username} (userId: ${user.userId})`);
        
        // Tìm tất cả máy của user
        const userMachines = await Machine.find({ userId: user.userId });
        
        console.log(`\n📋 User has ${userMachines.length} machine(s):`);
        userMachines.forEach((machine, index) => {
            console.log(`   ${index + 1}. ${machine.machineId} - ${machine.name} (${machine.ip})`);
        });
        
        // Xác nhận xóa
        console.log(`\n⚠️  WARNING: This will delete:`);
        console.log(`   - User: ${user.username} (${user.email})`);
        console.log(`   - ${userMachines.length} machine(s) belonging to this user`);
        console.log(`\n🗑️  Proceeding with deletion...`);
        
        // Xóa tất cả máy của user
        const deletedMachines = await Machine.deleteMany({ userId: user.userId });
        console.log(`✅ Deleted ${deletedMachines.deletedCount} machines`);
        
        // Xóa user
        await User.findByIdAndDelete(user._id);
        console.log(`✅ Deleted user: ${user.username}`);
        
        // Hiển thị kết quả
        console.log('\n🎉 DELETION COMPLETED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🗑️  Deleted user: ${user.username} (${user.email})`);
        console.log(`🗑️  Deleted machines: ${deletedMachines.deletedCount}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Error occurred:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

// Chạy function
deleteUser();