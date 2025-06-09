import React from 'react';
import { FormControlLabel, Switch } from '@mui/material';
import {
    Palette as PaletteIcon,
    PersonOutline as PersonIcon,
    NotificationsOutlined as NotificationIcon, 
    SecurityOutlined as SecurityIcon,
    LanguageOutlined as LanguageIcon
} from '@mui/icons-material';
import ThemeToggle from '../components/ThemeToggle';

export const getSettingsData = (mode, handleToggle) => [
    {
        icon: React.createElement(PaletteIcon),
        title: 'Giao diện',
        description: 'Tùy chỉnh chế độ sáng/tối cho ứng dụng',
        component: React.createElement(ThemeToggle, { mode, onToggle: handleToggle, })
    },
    {
        icon: React.createElement(PersonIcon),
        title: 'Tài khoản',
        description: 'Quản lý thông tin cá nhân và bảo mật',
        component: React.createElement(FormControlLabel, {
            control: React.createElement(Switch, { defaultChecked: true }),
            label: 'Đồng bộ thông tin'
        })
    },
    {
        icon: React.createElement(NotificationIcon),
        title: 'Thông báo',
        description: 'Cài đặt thông báo và cảnh báo hệ thống',
        component: React.createElement(FormControlLabel, {
            control: React.createElement(Switch, { defaultChecked: true }),
            label: 'Nhận thông báo'
        })
    },
    {
        icon: React.createElement(SecurityIcon),
        title: 'Bảo mật',
        description: 'Cài đặt xác thực và quyền truy cập',
        component: React.createElement(FormControlLabel, {
            control: React.createElement(Switch),
            label: 'Xác thực 2 bước'
        })
    },
    {
        icon: React.createElement(LanguageIcon),
        title: 'Ngôn ngữ',
        description: 'Chọn ngôn ngữ hiển thị của ứng dụng',
        component: React.createElement(FormControlLabel, {
            control: React.createElement(Switch, { defaultChecked: true }),
            label: 'Tiếng Việt'
        })
    }
];