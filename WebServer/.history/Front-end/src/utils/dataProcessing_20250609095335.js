export const processCombinedData = (config, data, machineInfo = null) => {
    const processedData = {};
    
    Object.entries(config).forEach(([key, fieldConfig]) => {
        if (fieldConfig.type === 'combined') {
            let value = null;
            
            switch (fieldConfig.calculation) {
                case 'high_low_32bit':
                    const low = data[fieldConfig.lowRegister] || 0;
                    const high = data[fieldConfig.highRegister] || 0;
                    value = (high * 65536) + low;
                    
                    // ✅ Special formatting cho shiftId
                    if (fieldConfig.display === 'shift_format' && machineInfo) {
                        const machineNumber = extractMachineNumber(machineInfo.machineId);
                        value = `M${machineNumber}_S${value}`;
                    }
                    break;
                    
                case 'datetime':
                    const registers = fieldConfig.registers;
                    if (registers && registers.length === 6) {
                        const [secReg, minReg, hourReg, dayReg, monthReg, yearReg] = registers;
                        const second = data[secReg] || 0;
                        const minute = data[minReg] || 0;
                        const hour = data[hourReg] || 0;
                        const day = data[dayReg] || 1;
                        const month = data[monthReg] || 1;
                        const year = data[yearReg] || new Date().getFullYear();
                        
                        // ✅ Validation
                        if (year >= 2020 && month >= 1 && month <= 12 && 
                            day >= 1 && day <= 31 && hour >= 0 && hour <= 23 && 
                            minute >= 0 && minute <= 59 && second >= 0 && second <= 59) {
                            const date = new Date(year, month - 1, day, hour, minute, second);
                            if (!isNaN(date.getTime())) {
                                value = date.toLocaleString('vi-VN');
                            }
                        }
                    }
                    if (!value) value = 'Chưa có dữ liệu';
                    break;
                    
                default:
                    value = 'Không xác định';
            }
            
            processedData[key] = value;
        } else {
            // ✅ Giữ nguyên data thông thường
            processedData[key] = data[key];
        }
    });
    
    return processedData;
};

const extractMachineNumber = (machineId) => {
    if (!machineId) return 1;
    const match = machineId.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
};