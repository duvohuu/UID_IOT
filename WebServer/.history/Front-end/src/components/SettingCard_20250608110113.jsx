import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Divider,
    Avatar,
    Slide
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const SettingCard = ({ icon, title, description, children, delay = 0 }) => {
    const theme = useTheme();
    
    return (
        <Slide direction="up" in={true} timeout={500 + delay}>
            <Card
                sx={{
                    height: '100%',
                    background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        borderColor: theme.palette.primary.main
                    }
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                            sx={{
                                bgcolor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                width: 48,
                                height: 48,
                                mr: 2
                            }}
                        >
                            {icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {description}
                            </Typography>
                        </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {children}
                    </Box>
                </CardContent>
            </Card>
        </Slide>
    );
};

export default SettingCard;