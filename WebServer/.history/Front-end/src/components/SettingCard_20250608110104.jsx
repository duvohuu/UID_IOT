import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Fade
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const SettingCard = ({ icon, title, description, children, delay = 0 }) => {
    const theme = useTheme();
    
    return (
        <Fade in={true} timeout={600} style={{ transitionDelay: `${delay}ms` }}>
            <Card
                sx={{
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8]
                    }
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                            sx={{
                                mr: 2,
                                color: theme.palette.primary.main,
                                '& svg': { fontSize: 28 }
                            }}
                        >
                            {icon}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {title}
                        </Typography>
                    </Box>
                    
                    <Typography 
                        variant="body2" 
                        sx={{ color: 'text.secondary', mb: 3 }}
                    >
                        {description}
                    </Typography>
                    
                    <Box>
                        {children}
                    </Box>
                </CardContent>
            </Card>
        </Fade>
    );
};

export default SettingCard;