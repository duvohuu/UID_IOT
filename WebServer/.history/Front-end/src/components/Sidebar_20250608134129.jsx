import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Divider,
    Box,
    Typography,
    Tooltip,
} from '@mui/material';
import StatusIcon from '@mui/icons-material/MonitorHeart';
import SettingIcon from '@mui/icons-material/Settings';
import { Link, useLocation } from 'react-router-dom';

const expandedWidth = 240;
const collapsedWidth = 80;

const menuItems = [
    { 
        label: 'Trạng thái', 
        path: '/status/', 
        icon: <StatusIcon />,
        description: 'Theo dõi tình trạng hệ thống'
    },
    { 
        label: 'Cài đặt', 
        path: '/setting/', 
        icon: <SettingIcon />,
        description: 'Quản lý cấu hình ứng dụng'
    },
];

const Sidebar = ({ open }) => {
    const location = useLocation();

    const renderMenuItem = (item) => {
        const selected = location.pathname === item.path;

        const menuContent = (
            <ListItem
                key={item.path}
                component={Link}
                to={item.path}
                selected={selected}
                sx={(theme) => ({
                    minHeight: 56,
                    px: 2.5,
                    py: 1.5,
                    mx: 1,
                    mb: 0.5,
                    borderRadius: 2,
                    justifyContent: open ? 'initial' : 'center',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    textDecoration: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                        transform: 'translateX(4px)',
                        '& .MuiListItemIcon-root': {
                            transform: 'scale(1.1)',
                            color: theme.palette.primary.main,
                        },
                        '& .MuiListItemText-primary': {
                            fontWeight: 600,
                        }
                    },
                    '&.Mui-selected': {
                        backgroundColor: theme.palette.mode === 'dark'
                            ? `${theme.palette.primary.main}20`
                            : `${theme.palette.primary.main}15`,
                        color: theme.palette.primary.main,
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 4,
                            height: '60%',
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: '0 4px 4px 0',
                        },
                        '& .MuiListItemIcon-root': {
                            color: theme.palette.primary.main,
                            transform: 'scale(1.05)',
                        },
                        '& .MuiListItemText-primary': {
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                        },
                        '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark'
                                ? `${theme.palette.primary.main}30`
                                : `${theme.palette.primary.main}25`,
                        }
                    },
                })}
            >
                <ListItemIcon
                    sx={(theme) => ({
                        minWidth: 40,
                        mr: open ? 2.5 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    })}
                >
                    {item.icon}
                </ListItemIcon>
                {open && (
                    <ListItemText 
                        primary={item.label}
                        sx={{
                            '& .MuiListItemText-primary': {
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                transition: 'all 0.2s ease',
                            }
                        }}
                    />
                )}
            </ListItem>
        );

        // Wrap with Tooltip when collapsed
        if (!open) {
            return (
                <Tooltip 
                    key={item.path}
                    title={
                        <Box>
                            <Typography variant="body2" fontWeight={600}>
                                {item.label}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {item.description}
                            </Typography>
                        </Box>
                    }
                    placement="right"
                    arrow
                >
                    {menuContent}
                </Tooltip>
            );
        }

        return menuContent;
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: open ? expandedWidth : collapsedWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: open ? expandedWidth : collapsedWidth,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflowX: 'hidden',
                    boxSizing: 'border-box',
                    backgroundColor: (theme) => theme.palette.mode === 'dark' 
                        ? '#1a1a1a' 
                        : '#fafafa',
                    borderRight: (theme) => `1px solid ${
                        theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.12)' 
                            : 'rgba(0, 0, 0, 0.12)'
                    }`,
                    backdropFilter: 'blur(10px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '4px 0 20px rgba(0, 0, 0, 0.3)'
                        : '4px 0 20px rgba(0, 0, 0, 0.1)',
                },
            }}
        >
            <Toolbar 
                sx={{
                    background: (theme) => theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
                    borderBottom: (theme) => `1px solid ${
                        theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(0, 0, 0, 0.08)'
                    }`,
                }}
            >
                {open && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 2,
                                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            }}
                        >
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    color: 'white', 
                                    fontWeight: 700,
                                    fontSize: '1.1rem'
                                }}
                            >
                                A
                            </Typography>
                        </Box>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                fontWeight: 700,
                                background: (theme) => theme.palette.mode === 'dark'
                                    ? 'linear-gradient(135deg, #ffffff, #cccccc)'
                                    : 'linear-gradient(135deg, #333333, #666666)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Admin
                        </Typography>
                    </Box>
                )}
            </Toolbar>
            
            <Divider 
                sx={{
                    borderColor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(0, 0, 0, 0.08)',
                }}
            />
            
            <Box sx={{ py: 1 }}>
                <List sx={{ px: 0 }}>
                    {menuItems.map(renderMenuItem)}
                </List>
            </Box>

            {/* Bottom decoration */}
            <Box sx={{ flexGrow: 1 }} />
            <Box 
                sx={{
                    p: 2,
                    background: (theme) => theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
                        : 'linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.05) 100%)',
                    borderTop: (theme) => `1px solid ${
                        theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(0, 0, 0, 0.08)'
                    }`,
                }}
            >
                {open && (
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            opacity: 0.6,
                            textAlign: 'center',
                            display: 'block',
                            fontSize: '0.75rem'
                        }}
                    >
                         Dashboard v1.0
                    </Typography>
                )}
            </Box>
        </Drawer>
    );
};

export default Sidebar;