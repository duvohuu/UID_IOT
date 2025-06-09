import mongoose from 'mongoose';
import WorkShift from '../models/Workshift.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const updateOldShifts = async () => {
    try {
        console.log('🚀 Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        // ✅ Lấy tất cả shifts có format cũ
        const shifts = await WorkShift.find({
            shiftId: { $regex: /^SHIFT_/ }
        });
        
        console.log(`📋 Found ${shifts.length} shifts with old format to update`);
        
        for (const shift of shifts) {
            let machineNumber = 1;
            let shiftNumber = 1;
            
            // ✅ Extract machine number từ machineId
            if (shift.machineId) {
                console.log(`   Original Machine ID: ${shift.machineId}`);
                const machineMatch = shift.machineId.match(/(\d+)/);
                if (machineMatch) {
                    machineNumber = parseInt(machineMatch[1]);
                    console.log(`   Extracted Machine Number: ${machineNumber}`);
                }
            }
            
            // ✅ Extract shift number từ shiftId cũ
            if (shift.shiftId && shift.shiftId.startsWith('SHIFT_')) {
                const numericId = parseInt(shift.shiftId.replace('SHIFT_', ''));
                shiftNumber = numericId || 1;
                console.log(`   Old Shift ID: ${shift.shiftId} -> Shift Number: ${shiftNumber}`);
            }
            
            const newShiftId = `M${machineNumber}_S${shiftNumber}`;
            
            console.log(`🔄 Updating: ${shift.shiftId} -> ${newShiftId}`);
            
            await WorkShift.findByIdAndUpdate(shift._id, {
                shiftId: newShiftId,
                machineNumber: machineNumber,
                shiftNumber: shiftNumber
            });
            
            console.log(`✅ Updated successfully\n`);
        }
        
        console.log('🎉 Migration completed successfully');
        
        // ✅ Verify results
        const updatedShifts = await WorkShift.find({})
            .sort({ machineNumber: 1, shiftNumber: 1 })
            .select('shiftId machineNumber shiftNumber machineId');
            
        console.log('\n📋 Updated shifts (sorted by M_S):');
        updatedShifts.forEach(shift => {
            console.log(`   ${shift.shiftId} (Machine: ${shift.machineNumber}, Shift: ${shift.shiftNumber}) - MachineID: ${shift.machineId}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

updateOldShifts();