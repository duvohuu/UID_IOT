import React from 'react';
import {
    Box,
    Switch
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon
} from '@mui/icons-material';

const ThemeToggle = ({ mode, onToggle }) => { 
    const theme = useTheme();
    
    const handleSwitchChange = (event) => {
        if (onToggle) {
            onToggle(event, event.target.checked); // ✅ Truyền đúng params
        }
    };
    
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LightModeIcon 
                sx={{ 
                    color: mode === 'light' ? theme.palette.warning.main : 'text.secondary',
                    transition: 'color 0.3s ease'
                }} 
            />
            <Switch
                checked={mode === 'dark'}
                onChange={handleSwitchChange} // ✅ Sử dụng wrapper function
                sx={{
                    '& .MuiSwitch-thumb': {
                        backgroundColor: mode === 'dark' ? theme.palette.grey[800] : theme.palette.warning.main,
                    },
                    '& .MuiSwitch-track': {
                        backgroundColor: mode === 'dark' ? theme.palette.primary.main : theme.palette.grey[400],
                    }
                }}
            />
            <DarkModeIcon 
                sx={{ 
                    color: mode === 'dark' ? theme.palette.primary.main : 'text.secondary',
                    transition: 'color 0.3s ease'
                }} 
            />
        </Box>
    );
};

export default ThemeToggle;