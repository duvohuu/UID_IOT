import React from 'react';
import { 
    Card, 
    CardActionArea, 
    CardContent, 
    Typography, 
    Box, 
    Chip, 
    Grid, 
    Tooltip,
    IconButton,
    Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Circle as CircleIcon,
    WifiOff as DisconnectedIcon,
    Refresh as RefreshIcon,
    Lock as LockIcon,
    Visibility as ViewIcon,
    Computer as MachineIcon,
    Person as UserIcon,
    AdminPanelSettings as AdminIcon,
    Delete as DeleteIcon,
    Business as CompanyIcon,
    NetworkCheck as NetworkIcon,
    Router as RouterIcon,
    CheckCircle as ConnectedIcon,
} from '@mui/icons-material';

const MachineStatusCard = ({ machine, index, user, onClick, onDelete }) => {
    const theme = useTheme();
    const isConnected = machine.isConnected;
    const isOnline = machine.status === 'online' && isConnected;
    const isAdmin = user?.role === 'admin';
    
    let statusColor, statusText, statusIcon;
    
    if (isConnected && isOnline) {
        statusColor = 'success';
        statusText = 'Đang hoạt động';
        statusIcon = <CircleIcon sx={{ fontSize: 12 }} />;
    } else if (isConnected && !isOnline) {
        statusColor = 'warning';
        statusText = 'Kết nối - Dừng';
        statusIcon = <CircleIcon sx={{ fontSize: 12 }} />;
    } else {
        statusColor = 'error';
        statusText = 'Mất kết nối';
        statusIcon = <DisconnectedIcon sx={{ fontSize: 12 }} />;
    }
    
    const canViewDetails = isConnected && isOnline;

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(machine);
        }
    };

    // Function để phân loại IP
    const getIPType = (ip) => {
        if (!ip) return { type: 'Unknown', icon: <RouterIcon />, color: theme.palette.grey[500] };
        
        if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.') || ip === '127.0.0.1') {
            return { 
                type: 'Local', 
                icon: <NetworkIcon />, 
                color: theme.palette.info.main 
            };
        } else {
            return { 
                type: 'Remote', 
                icon: <RouterIcon />, 
                color: theme.palette.secondary.main 
            };
        }
    };

    const ipConfig = getIPType(machine.ip);

    return (
        <Card
            sx={{
                height: 'flex',
                display: 'flex',
                flexDirection: 'column',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                cursor: canViewDetails ? 'pointer' : 'default',
                position: 'relative',
                '&:hover': {
                    transform: canViewDetails ? 'translateY(-8px)' : 'none',
                    boxShadow: canViewDetails ? `0 12px 40px ${theme.palette.primary.main}20` : 'none',
                    borderColor: canViewDetails ? theme.palette.primary.main : theme.palette.divider,
                },
            }}
        >
            {/* DELETE BUTTON - Chỉ hiện cho admin */}
            {isAdmin && (
                <Box sx={{ 
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 10
                }}>
                    <Tooltip title="Xóa máy">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={handleDeleteClick}
                            sx={{ 
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                '&:hover': {
                                    backgroundColor: 'error.main',
                                    color: 'white'
                                }
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            <CardActionArea
                onClick={() => canViewDetails && onClick && onClick(machine)}
                disabled={!canViewDetails}
                sx={{ 
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    padding: isAdmin ? '16px 60px 16px 16px' : '16px',
                    '&.Mui-disabled': {
                        cursor: 'default'
                    }
                }}
            >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
                    
                    {/* HEADER SECTION - Chỉ hiện cho admin */}
                    {isAdmin && (
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Chip
                                    icon={<CompanyIcon />}
                                    label={machine.machineId || 'N/A'}
                                    size="medium"
                                    variant="filled"
                                    color="primary"
                                    sx={{ 
                                        fontFamily: 'monospace', 
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                        height: 32,
                                        borderRadius: 2,
                                        px: 1,
                                    }}
                                />
                                
                                <Chip
                                    icon={<AdminIcon />}
                                    label="ADMIN"
                                    size="medium"
                                    variant="outlined"
                                    sx={{ 
                                        fontSize: '0.75rem',
                                        height: 32,
                                        borderRadius: 2,
                                        color: theme.palette.secondary.main,
                                        borderColor: theme.palette.secondary.main,
                                        backgroundColor: theme.palette.secondary.main + '10',
                                        '&:hover': {
                                            backgroundColor: theme.palette.secondary.main + '20',
                                        }
                                    }}
                                />
                            </Box>
                            
                            <Divider sx={{ 
                                borderColor: theme.palette.divider,
                                opacity: 0.5,
                                mb: 2 
                            }} />
                        </Box>
                    )}

                    {/* MACHINE HEADER */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <MachineIcon sx={{ 
                            fontSize: 40,
                            color: theme.palette.primary.main,
                            animation: isConnected ? 'pulse 2s infinite' : 'none',
                            '@keyframes pulse': {
                                '0%': { opacity: 1 },
                                '50%': { opacity: 0.5 },
                                '100%': { opacity: 1 },
                            }
                        }} />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography 
                                variant="h5"
                                sx={{ 
                                    fontWeight: 700,
                                    color: theme.palette.text.primary,
                                    lineHeight: 1.2,
                                    mb: 0.5,
                                    fontSize: '1.25rem'
                                }}
                            >
                                {machine.name}
                            </Typography>
                            <Chip
                                icon={statusIcon}
                                label={statusText}
                                color={statusColor}
                                size="small"
                                sx={{ fontWeight: 600 }}
                            />
                        </Box>
                    </Box>

                    {/* THÔNG TIN MÁY */}
                    <Box sx={{ mb: 2 }}>
                        <Grid container spacing={1}>
                            <Grid item xs={12}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Loại máy:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                                    {machine.type}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Vị trí:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {machine.location}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* IP ADDRESS SECTION */}
                    <Box sx={{ 
                        mb: 2, 
                        p: 1.5, 
                        backgroundColor: `${ipConfig.color}08`, 
                        borderRadius: 2, 
                        border: `1px solid ${ipConfig.color}20` 
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1,
                                    backgroundColor: `${ipConfig.color}20`,
                                    color: ipConfig.color,
                                }}
                            >
                                {React.cloneElement(ipConfig.icon, { fontSize: 'small' })}
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: theme.palette.text.secondary,
                                        display: 'block',
                                        lineHeight: 1,
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    Địa chỉ IP ({ipConfig.type})
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        color: ipConfig.color,
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    {machine.ip || 'Chưa có IP'}
                                </Typography>
                            </Box>
                            <Chip
                                label={ipConfig.type}
                                size="small"
                                sx={{
                                    fontSize: '0.7rem',
                                    height: 20,
                                    backgroundColor: `${ipConfig.color}15`,
                                    color: ipConfig.color,
                                    border: `1px solid ${ipConfig.color}30`,
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Connection Status Info - Thay đổi thông báo dựa trên trạng thái */}
                    {isConnected ? (
                        // ✅ KHI ĐÃ KẾT NỐI - Hiển thị thông báo thành công
                        <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: `${theme.palette.success.main}10` }}>
                            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                                <ConnectedIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                                Đã kết nối đến HMI
                            </Typography>
                        </Box>
                    ) : (
                        // ✅ KHI CHƯA KẾT NỐI - Hiển thị thông báo lỗi
                        <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: `${theme.palette.error.main}10` }}>
                            <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 500 }}>
                                Không thể kết nối đến HMI
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                                Kiểm tra kết nối mạng và cấu hình HMI
                            </Typography>
                        </Box>
                    )}

                    {/* Last Update */}
                    <Box sx={{ mt: 'auto' }}>
                        {machine.lastUpdate ? (
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: 'text.secondary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mb: 1
                                }}
                            >
                                <RefreshIcon sx={{ fontSize: 12 }} />
                                Cập nhật: {new Date(machine.lastUpdate).toLocaleString('vi-VN')}
                            </Typography>
                        ) : (
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: 'text.secondary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mb: 1
                                }}
                            >
                                <RefreshIcon sx={{ fontSize: 12 }} />
                                Chưa có dữ liệu cập nhật
                            </Typography>
                        )}
                    </Box>

                    {/* Action hint */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        mt: 2,
                        pt: 2,
                        borderTop: `1px solid ${theme.palette.divider}`
                    }}>
                        {canViewDetails ? (
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    fontWeight: 500
                                }}
                            >
                                <ViewIcon sx={{ fontSize: 14 }} />
                                Click để xem chi tiết
                            </Typography>
                        ) : (
                            <Tooltip title={!isConnected ? "Máy phải kết nối để xem chi tiết" : "Máy phải hoạt động để xem chi tiết"}>
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        color: 'text.secondary',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontWeight: 500
                                    }}
                                >
                                    <LockIcon sx={{ fontSize: 14 }} />
                                    {!isConnected ? 'Chưa kết nối' : 'Chưa thể xem chi tiết'}
                                </Typography>
                            </Tooltip>
                        )}
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default MachineStatusCard;