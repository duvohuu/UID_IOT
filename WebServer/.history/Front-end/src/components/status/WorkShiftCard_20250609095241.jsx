import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Chip, IconButton, Tooltip, Alert } from '@mui/material';
import { 
    Timer as TimerIcon, 
    LocalDrink as BottleIcon, 
    Scale as WeightIcon,
    Visibility as ViewIcon,
    Report as ReportIcon 
} from '@mui/icons-material';

const WorkShiftCard = ({ shift, onClick }) => {
    
    const getStatusInfo = (status) => {
        switch (status) {
            case 'completed':
                return { 
                    label: 'Hoàn thành', 
                    color: 'success',
                    icon: '✅',
                    description: 'Ca đã hoàn thành và lưu data chính xác'
                };
            case 'incomplete':  
                return { 
                    label: 'Chưa hoàn chỉnh', 
                    color: 'warning',
                    icon: '⚠️',
                    description: 'Ca đã lưu nhưng data có thể chưa đầy đủ'
                };
            case 'interrupted': 
                return { 
                    label: 'Bị gián đoạn', 
                    color: 'error',
                    icon: '🚨',
                    description: 'Ca bị gián đoạn do mất kết nối'
                };
            case 'active':
                return { 
                    label: 'Đang hoạt động', 
                    color: 'info',
                    icon: '🔄',
                    description: 'Ca đang trong quá trình thực hiện'
                };
            default:
                return { 
                    label: status || 'Không xác định', 
                    color: 'default',
                    icon: '❓',
                    description: 'Trạng thái không xác định'
                };
        }
    };

    const statusInfo = getStatusInfo(shift.status);

    return (
        <Card 
            sx={{ 
                mb: 2, 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: (shift.status === 'incomplete' || shift.status === 'interrupted') 
                    ? `2px solid` 
                    : '1px solid',
                borderColor: (shift.status === 'incomplete' || shift.status === 'interrupted') 
                    ? `${statusInfo.color}.main` 
                    : 'divider',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                }
            }}
            onClick={() => onClick && onClick(shift)}
        >
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                            {shift.shiftId} {/* ✅ Hiển thị M1_S123, M2_S456, etc. */}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {/* ✅ SỬA: Parse shiftId để hiển thị info */}
                            {shift.shiftId && shift.shiftId.includes('_') ? (
                                `Máy ${shift.shiftId.split('_')[0]?.slice(1)} - Ca ${shift.shiftId.split('_')[1]?.slice(1)}`
                            ) : (
                                `Máy ${shift.machineNumber || 1} - Ca ${shift.shiftNumber || 1}`
                            )}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                            label={statusInfo.label}
                            color={statusInfo.color}
                            size="small"
                            variant={shift.status === 'active' ? 'filled' : 'outlined'}
                        />
                    </Box>
                </Box>

                {/* ✅ Production info với combined weight */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2">
                        <strong>Chai:</strong> {shift.totalBottlesProduced || 0}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Khối lượng:</strong> {(shift.totalWeightFilled || 0).toLocaleString('vi-VN')} g
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default WorkShiftCard;