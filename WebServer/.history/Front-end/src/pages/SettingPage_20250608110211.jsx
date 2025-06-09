import React from 'react';
import {
    Box,
    Typography,
    Container,
    Grid,
    Avatar,
    useMediaQuery,
    Fade
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Settings as SettingsIcon
} from '@mui/icons-material';

// Import components
import SettingCard from '../components/setting/SettingCard';
import CurrentThemeDisplay from '../components/setting/CurrentThemeDisplay';

// Import utils
import { getSettingsData } from '../utils/settingsData';

const SettingPage = ({ mode, setMode }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleToggle = (event, checked) => {  
    if (checked !== undefined) {
        setMode(checked ? 'dark' : 'light');
    } else {
        setMode(mode === 'light' ? 'dark' : 'light');
    }
};

    const settingsData = getSettingsData(mode, handleToggle);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${theme.palette.primary.dark}15 0%, ${theme.palette.secondary.dark}10 100%)`
                    : `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
                py: 4
            }}
        >
            <Container maxWidth="lg">
                {/* Header */}
                <Fade in={true} timeout={600}>
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                mx: 'auto',
                                mb: 2,
                                bgcolor: theme.palette.primary.main,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                            }}
                        >
                            <SettingsIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Typography
                            variant={isMobile ? "h4" : "h3"}
                            sx={{
                                fontWeight: 700,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 1
                            }}
                        >
                            Cài Đặt
                        </Typography>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                color: 'text.secondary', 
                                maxWidth: 600, 
                                mx: 'auto' 
                            }}
                        >
                            Tùy chỉnh trải nghiệm sử dụng theo sở thích của bạn
                        </Typography>
                    </Box>
                </Fade>

                {/* Settings Grid */}
                <Grid container spacing={3}>
                    {settingsData.map((setting, index) => (
                        <Grid item xs={12} md={6} lg={4} key={index}>
                            <SettingCard
                                icon={setting.icon}
                                title={setting.title}
                                description={setting.description}
                                delay={index * 100}
                            >
                                {setting.component}
                            </SettingCard>
                        </Grid>
                    ))}
                </Grid>

                {/* Current Theme Display */}
                <CurrentThemeDisplay mode={mode} />
            </Container>
        </Box>
    );
};

export default SettingPage;