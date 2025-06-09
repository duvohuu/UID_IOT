import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Machine from '../models/Machine.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// =====================================================
// 🔧 CẤU HÌNH XÓA NHIỀU MÁY
// =====================================================

const CONFIG = {
    // ✏️ Danh sách machineId cần xóa
    machineIdsToDelete: [
        'MACHINE_002',
        'MACHINE_004',
        'MACHINE_006'
    ]
    
    // Hoặc xóa theo criteria:
    // deleteByUserId: 'test1',  // Xóa tất cả máy của user test1
    // deleteByStatus: 'offline'  // Xóa tất cả máy offline
};

// =====================================================

const deleteAndReindex = async () => {
    try {
        console.log('🚀 Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        // ======= BƯỚC 1: HIỂN THỊ TRẠNG THÁI BAN ĐẦU =======
        const allMachinesBeforeDelete = await Machine.find({}, 'machineId name userId').sort({ machineId: 1 });
        console.log(`\n📋 Current machines (${allMachinesBeforeDelete.length} total):`);
        allMachinesBeforeDelete.forEach((machine, index) => {
            const willDelete = CONFIG.machineIdsToDelete.includes(machine.machineId);
            const marker = willDelete ? ' ← WILL BE DELETED' : '';
            console.log(`   ${index + 1}. ${machine.machineId} - ${machine.name} (${machine.userId})${marker}`);
        });
        
        // ======= BƯỚC 2: XÓA CÁC MÁY =======
        console.log(`\n🗑️  Deleting ${CONFIG.machineIdsToDelete.length} machines...`);
        
        const deletedMachines = [];
        for (const machineId of CONFIG.machineIdsToDelete) {
            const deletedMachine = await Machine.findOneAndDelete({ machineId: machineId });
            if (deletedMachine) {
                deletedMachines.push({
                    machineId: deletedMachine.machineId,
                    name: deletedMachine.name,
                    userId: deletedMachine.userId
                });
                console.log(`   ✅ Deleted: ${deletedMachine.machineId} - ${deletedMachine.name}`);
            } else {
                console.log(`   ❌ Not found: ${machineId}`);
            }
        }
        
        // ======= BƯỚC 3: RE-INDEX =======
        console.log('\n🔄 Re-indexing remaining machines...');
        const remainingMachines = await Machine.find({}).sort({ createdAt: 1 });
        
        if (remainingMachines.length === 0) {
            console.log('✅ No machines left to re-index');
            console.log('\n🎉 ALL MACHINES DELETED!');
            return;
        }
        
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
                    name: machine.name,
                    userId: machine.userId
                });
                console.log(`   ✅ ${oldMachineId} → ${newMachineId}`);
            }
        }
        
        // ======= BƯỚC 4: HIỂN THỊ KẾT QUẢ =======
        const finalMachines = await Machine.find({}, 'machineId name userId').sort({ machineId: 1 });
        
        console.log('\n🎉 BULK DELETION AND RE-INDEXING COMPLETED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🗑️  DELETED MACHINES (${deletedMachines.length}):`);
        deletedMachines.forEach((machine, index) => {
            console.log(`   ${index + 1}. ${machine.machineId} - ${machine.name} (${machine.userId})`);
        });
        
        console.log(`\n🔄 RE-INDEXED MACHINES (${reindexResults.length}):`);
        reindexResults.forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.oldId} → ${result.newId} (${result.userId})`);
        });
        
        console.log(`\n📋 FINAL MACHINE LIST (${finalMachines.length} total):`);
        finalMachines.forEach((machine, index) => {
            console.log(`   ${index + 1}. ${machine.machineId} - ${machine.name} (${machine.userId})`);
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Error occurred:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

// Chạy function
deleteAndReindex();