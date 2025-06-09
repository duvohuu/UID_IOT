import React from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton } from '@mui/material';
import { Visibility as ViewIcon, Timer as TimerIcon } from '@mui/icons-material';

const WorkShiftCard = ({ shift, onClick }) => {
    
    const getStatusConfig = (status) => {
        switch (status) {
            case 'completed':
                return { label: 'Hoàn thành', color: 'success', icon: '✅' };
            case 'active':
                return { label: 'Đang hoạt động', color: 'info', icon: '🔄' };
            case 'incomplete':
                return { label: 'Chưa hoàn chỉnh', color: 'warning', icon: '⚠️' };
            case 'interrupted':
                return { label: 'Bị gián đoạn', color: 'error', icon: '🚨' };
            default:
                return { label: 'Không xác định', color: 'default', icon: '❓' };
        }
    };

    const formatDuration = (duration) => {
        if (!duration) return 'N/A';
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const statusConfig = getStatusConfig(shift.status);

    return (
        <Card 
            sx={{ 
                mb: 1,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                }
            }}
            onClick={() => onClick && onClick(shift)}
        >
            <CardContent sx={{ p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        CA #{shift.shiftId.split('_').pop()?.slice(-4)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                            label={`${statusConfig.icon} ${statusConfig.label}`}
                            color={statusConfig.color}
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                        />
                        <IconButton size="small" color="primary">
                            <ViewIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* Time & Duration */}
                <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        📅 {new Date(shift.startTime).toLocaleDateString('vi-VN')} {new Date(shift.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimerIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            {formatDuration(shift.duration)}
                        </Typography>
                    </Box>
                </Box>

                {/* Production Info */}
                <Box sx={{ display: 'flex', justify: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        🍶 {shift.totalBottlesProduced || 0} chai
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        ⚖️ {shift.totalWeightFilled || 0}g
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default WorkShiftCard;