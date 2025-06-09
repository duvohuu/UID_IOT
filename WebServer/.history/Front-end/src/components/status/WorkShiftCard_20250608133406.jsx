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
            case 'incomplete':  // 🆕 THÊM
                return { 
                    label: 'Chưa hoàn chỉnh', 
                    color: 'warning',
                    icon: '⚠️',
                    description: 'Ca đã lưu nhưng data có thể chưa đầy đủ'
                };
            case 'interrupted': // 🆕 THÊM
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

    const formatDuration = (duration) => {
        if (!duration) return 'N/A';
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    const formatWeight = (weight) => {
        if (!weight || weight === 0) return '0g';
        if (weight >= 1000) {
            return `${(weight / 1000).toFixed(2)}kg`;
        }
        return `${weight}g`;
    };

    const statusInfo = getStatusInfo(shift.status);

    return (
        <Card 
            sx={{ 
                mb: 2, 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                // ✅ THÊM: Border đặc biệt cho status incomplete/interrupted  
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
                {/* Header với status badge nổi bật */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                            {shift.shiftId}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Ca làm việc #{shift.shiftId.split('_').pop()?.slice(-6)}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* ✅ THÊM: Chip với icon và tooltip */}
                        <Tooltip title={statusInfo.description}>
                            <Chip 
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <span>{statusInfo.icon}</span>
                                        {statusInfo.label}
                                    </Box>
                                }
                                color={statusInfo.color}
                                size="small"
                                sx={{ fontWeight: 500 }}
                            />
                        </Tooltip>
                        <Tooltip title="Xem chi tiết ca">
                            <IconButton 
                                size="small" 
                                color="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClick && onClick(shift);
                                }}
                            >
                                <ViewIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* ✅ THÊM: Warning message cho incomplete/interrupted */}
                {(shift.status === 'incomplete' || shift.status === 'interrupted') && (
                    <Alert 
                        severity={shift.status === 'incomplete' ? 'warning' : 'error'} 
                        sx={{ mb: 2, py: 0.5 }}
                        icon={<ReportIcon fontSize="small" />}
                    >
                        <Typography variant="caption">
                            {shift.status === 'incomplete' 
                                ? 'Data có thể chưa được cập nhật đầy đủ khi kết thúc ca'
                                : 'Ca bị gián đoạn do mất kết nối - Data đã được lưu tạm thời'
                            }
                        </Typography>
                    </Alert>
                )}

                {/* Time Info */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        📅 {new Date(shift.startTime).toLocaleString('vi-VN')}
                    </Typography>
                    {shift.endTime && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            📅 {new Date(shift.endTime).toLocaleString('vi-VN')}
                        </Typography>
                    )}
                </Box>

                {/* Metrics Grid */}
                <Grid container spacing={1}>
                    <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <TimerIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                <Typography variant="caption" color="text.secondary">
                                    Thời gian
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatDuration(shift.duration)}
                            </Typography>
                        </Box>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default WorkShiftCard;