import React from 'react';
import { Box, Typography, Alert, Fade, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
    MonitorHeart as StatusIcon,
    AdminPanelSettings as AdminIcon,
    Person as UserIcon 
} from '@mui/icons-material';

const StatusHeader = ({ isMobile, error, user }) => {
    const theme = useTheme();
    const isAdmin = user?.role === 'admin';

    return (
        <Box sx={{ mb: 4 }}>
            <Fade in={true} timeout={800}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    {/* Header với icon giống Setting page */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 2,
                        mb: 2
                    }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                color: '#fff',
                                boxShadow: `0 4px 20px ${theme.palette.primary.main}40`,
                            }}
                        >
                            <StatusIcon sx={{ fontSize: 24 }} />
                        </Box>
                        
                        <Typography 
                            variant={isMobile ? "h4" : "h3"} 
                            component="h1"
                            sx={{ 
                                fontWeight: 700,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '0.5px',
                            }}
                        >
                            {isAdmin ? 'Quản Lý Hệ Thống' : 'Trạng Thái Máy Móc'}
                        </Typography>
                    </Box>
                    
                    {/* ✅ User Role và Welcome Message */}
                    {user && (
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                                icon={isAdmin ? <AdminIcon /> : <UserIcon />}
                                label={isAdmin ? `Admin: ${user.username}` : `User: ${user.username}`}
                                color={isAdmin ? 'secondary' : 'primary'}
                                variant="filled"
                                sx={{ fontWeight: 600 }}
                            />
                            {isAdmin && (
                                <Chip
                                    label="Toàn quyền hệ thống"
                                    color="error"
                                    variant="outlined"
                                    size="small"
                                />
                            )}
                        </Box>
                    )}
                    
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            color: theme.palette.text.secondary,
                            maxWidth: 600,
                            mx: 'auto',
                            lineHeight: 1.6
                        }}
                    >
                        {isAdmin 
                            ? 'Giám sát và quản lý tất cả thiết bị trong hệ thống. Thêm, sửa, xóa máy móc và phân quyền user.'
                            : 'Giám sát và theo dõi trạng thái các máy móc được phân quyền cho bạn.'
                        }
                    </Typography>
                </Box>
            </Fade>

            {error && (
                <Fade in={true} timeout={1000}>
                    <Alert 
                        severity={user?.role === 'admin' ? "info" : "warning"}
                        sx={{ 
                            mb: 3,
                            borderRadius: 2,
                            '& .MuiAlert-message': {
                                width: '100%'
                            }
                        }}
                    >
                        {error}
                    </Alert>
                </Fade>
            )}
        </Box>
    );
};

export default StatusHeader;