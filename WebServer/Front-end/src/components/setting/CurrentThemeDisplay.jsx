import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Fade
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon
} from '@mui/icons-material';

const CurrentThemeDisplay = ({ mode }) => {
    const theme = useTheme();

    return (
        <Fade in={true} timeout={1000}>
            <Paper
                sx={{
                    mt: 4,
                    p: 3,
                    textAlign: 'center',
                    background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    {mode === 'dark' ? (
                        <DarkModeIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
                    ) : (
                        <LightModeIcon sx={{ color: theme.palette.warning.main, fontSize: 24 }} />
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Chế độ hiện tại: {mode === 'dark' ? 'Tối' : 'Sáng'}
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Thay đổi sẽ được áp dụng ngay lập tức
                </Typography>
            </Paper>
        </Fade>
    );
};

export default CurrentThemeDisplay;