import React from "react";
import { Box, Grid, Paper, Typography, LinearProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
    Computer as MachineIcon,
    CheckCircle as OnlineIcon,
    Cancel as OfflineIcon,
    Warning as WarningIcon,
    TrendingUp as TrendIcon
} from '@mui/icons-material';

const StatusStatsCards = ({ machines, loading }) => {
    const theme = useTheme();

    // Tính toán stats từ machines data
    const calculateStats = (machines) => {
        if (!machines || !Array.isArray(machines) || machines.length === 0) {
            return {
                total: 0,
                online: 0,
                offline: 0,
                warning: 0,
                onlinePercentage: 0,
                offlinePercentage: 0,
                warningPercentage: 0
            };
        }

        const total = machines.length;
        const online = machines.filter(m => m.isConnected && m.status === 'online').length;
        const offline = machines.filter(m => !m.isConnected || m.status === 'offline').length;
        const warning = machines.filter(m => m.status === 'warning' || (m.isConnected && m.status !== 'online' && m.status !== 'offline')).length;

        return {
            total,
            online,
            offline,
            warning,
            onlinePercentage: total > 0 ? Math.round((online / total) * 100) : 0,
            offlinePercentage: total > 0 ? Math.round((offline / total) * 100) : 0,
            warningPercentage: total > 0 ? Math.round((warning / total) * 100) : 0
        };
    };

    const stats = calculateStats(machines);

    // Component StatCard - THÊM COMPONENT NÀY
    const StatCard = ({ title, value, icon, color, bgColor, percentage, description }) => (
        <Paper
            sx={{
                p: 3,
                height: 160,
                display: 'flex',
                flexDirection: 'column',
                background: `linear-gradient(135deg, ${bgColor} 0%, ${theme.palette.background.paper} 100%)`,
                border: `1px solid ${color}20`,
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${color}30`,
                    border: `1px solid ${color}40`,
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: `${color}10`,
                    zIndex: 0,
                },
            }}
        >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                            color: 'white',
                            boxShadow: `0 4px 12px ${color}40`,
                        }}
                    >
                        {icon}
                    </Box>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            color: color,
                            lineHeight: 1,
                        }}
                    >
                        {value}
                    </Typography>
                </Box>

                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        mb: 0.5,
                        fontSize: '1rem',
                    }}
                >
                    {title}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        color: theme.palette.text.secondary,
                        fontSize: '0.875rem',
                        mb: 1,
                    }}
                >
                    {description}
                </Typography>

                {percentage !== undefined && (
                    <Box sx={{ mt: 'auto' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                Tỷ lệ
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: color }}>
                                {percentage}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: `${color}20`,
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                                },
                            }}
                        />
                    </Box>
                )}
            </Box>
        </Paper>
    );

    const statsData = [
        {
            title: 'Tổng Số Máy',
            value: stats.total,
            icon: <MachineIcon />,
            color: theme.palette.info.main,
            bgColor: theme.palette.info.light + '20',
            description: 'Tổng số máy trong hệ thống'
        },
        {
            title: 'Đang Hoạt Động',
            value: stats.online,
            icon: <OnlineIcon />,
            color: theme.palette.success.main,
            bgColor: theme.palette.success.light + '20',
            percentage: stats.onlinePercentage,
            description: `${stats.onlinePercentage}% máy đang online`
        },
        {
            title: 'Mất Kết Nối',
            value: stats.offline,
            icon: <OfflineIcon />,
            color: theme.palette.error.main,
            bgColor: theme.palette.error.light + '20',
            percentage: stats.offlinePercentage,
            description: `${stats.offlinePercentage}% máy offline`
        },
        {
            title: 'Cảnh Báo',
            value: stats.warning,
            icon: <WarningIcon />,
            color: theme.palette.warning.main,
            bgColor: theme.palette.warning.light + '20',
            percentage: stats.warningPercentage,
            description: `${stats.warningPercentage}% máy có cảnh báo`
        }
    ];

    // Loading state
    if (loading || !machines) {
        return (
            <Box sx={{ mb: 4 }}>
                <Grid container spacing={3}>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
                            <Paper
                                sx={{
                                    p: 3,
                                    height: 160,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${theme.palette.background.paper} 100%)`,
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                    '@keyframes pulse': {
                                        '0%': { opacity: 1 },
                                        '50%': { opacity: 0.4 },
                                        '100%': { opacity: 1 },
                                    },
                                }}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
                {statsData.map((stat, index) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
                        <StatCard {...stat} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default StatusStatsCards;