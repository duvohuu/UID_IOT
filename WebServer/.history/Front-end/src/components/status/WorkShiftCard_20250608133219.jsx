import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

const WorkShiftCard = ({ shift, onClick }) => {
    
    const getStatusInfo = (status) => {
        switch (status) {
            case 'completed':
                return { label: 'Hoàn thành', color: 'success', icon: '✅' };
            case 'incomplete':
                return { label: 'Chưa hoàn chỉnh', color: 'warning', icon: '⚠️' };
            case 'interrupted':
                return { label: 'Bị gián đoạn', color: 'error', icon: '🚨' };
            case 'active':
                return { label: 'Đang hoạt động', color: 'info', icon: '🔄' };
            default:
                return { label: 'Không xác định', color: 'default', icon: '❓' };
        }
    };

    const statusInfo = getStatusInfo(shift.status);

    return (
        <Card 
            sx={{ 
                mb: 1,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                    bgcolor: 'action.hover'
                }
            }}
            onClick={() => onClick && onClick(shift)}
        >
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            CA #{shift.shiftId.split('_').pop()?.slice(-6)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {new Date(shift.startTime).toLocaleString('vi-VN')}
                        </Typography>
                    </Box>
                    <Chip 
                        label={`${statusInfo.icon} ${statusInfo.label}`}
                        color={statusInfo.color}
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

export default WorkShiftCard;