import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Grid,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Schedule as ScheduleIcon,
    LocalDrink as BottleIcon,
    Scale as WeightIcon,
    Timer as TimerIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const WorkShiftCard = ({ shift, onClick }) => {
    const theme = useTheme();

    const formatDuration = (milliseconds) => {
        if (!milliseconds) return 'N/A';
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    const formatWeight = (weight) => {
        if (!weight) return '0';
        if (weight >= 1000) {
            return `${(weight / 1000).toFixed(1)}kg`;
        }
        return `${weight}g`;
    };

    return (
        <Card 
            sx={{ 
                mb: 2,
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                    borderColor: theme.palette.primary.main
                }
            }}
        >
            <CardContent sx={{ p: 2 }}>
                {/* Header */}
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
                        <Chip 
                            label={shift.status === 'completed' ? 'Hoàn thành' : shift.status}
                            color="success"
                            size="small"
                            sx={{ fontWeight: 500 }}
                        />
                        <Tooltip title="Xem chi tiết ca">
                            <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => onClick && onClick(shift)}
                            >
                                <ViewIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Time Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                        {new Date(shift.startTime).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                        {shift.endTime && (
                            <> → {new Date(shift.endTime).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</>
                        )}
                    </Typography>
                </Box>

                {/* Stats Grid */}
                <Grid container spacing={2}>
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
                    <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <BottleIcon sx={{ fontSize: 16, color: 'info.main' }} />
                                <Typography variant="caption" color="text.secondary">
                                    Chai
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }}>
                                {shift.totalBottlesProduced || 0}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <WeightIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                <Typography variant="caption" color="text.secondary">
                                    Khối lượng
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                {formatWeight(shift.totalWeightFilled)}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default WorkShiftCard;