import React, { useState, useEffect } from 'react'; 
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Toolbar, CssBaseline, ThemeProvider } from '@mui/material';
import { getTheme } from './theme';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StatusPage from './pages/StatusPage';
import SettingPage from './pages/SettingPage';
import MachineDetail from './components/status/MachineDetail'; 
import { SnackbarProvider } from './context/SnackbarContext';
import axios from 'axios'; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const App = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mode, setMode] = useState('light');
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [loading, setLoading] = useState(true);

    // Kiểm tra token hợp lệ khi ứng dụng khởi động
    useEffect(() => {
        const verifyToken = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/api/users/verify-token`, {
                    withCredentials: true,
                });
                if (response.data.valid && response.data.user) {
                    const userData = {
                        username: response.data.user.username,
                        email: response.data.user.email,
                        role: response.data.user.role,
                        avatar: response.data.user.avatar
                    };
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                } else {
                    setUser(null);
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error("Lỗi khi kiểm tra token:", error);
                setUser(null);
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, []);

    // Hàm toggle sidebar
    const handleToggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Loading screen
    if (loading) {
        return (
            <ThemeProvider theme={getTheme(mode)}>
                <CssBaseline />
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh' 
                }}>
                    <div>Đang tải...</div>
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={getTheme(mode)}>
            <SnackbarProvider>
                <CssBaseline />
                <Box sx={{ display: 'flex' }}>
                    <Sidebar open={sidebarOpen} />
                    {/* ✅ Truyền đúng props theo Header component */}
                    <Header 
                        onToggleSidebar={handleToggleSidebar}  // ✅ Đúng tên prop
                        user={user}
                        setUser={setUser}
                    />
                    <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
                        <Toolbar />
                        <Routes>
                            <Route path="/" element={<Navigate to="/status" replace />} />
                            <Route path="/status" element={<StatusPage user={user} />} />
                            <Route path="/setting" element={<SettingPage user={user} mode={mode} setMode={setMode} />} />
                            <Route path="/machine/:ip" element={<MachineDetail user={user} />} />
                        </Routes>
                    </Box>
                </Box>
            </SnackbarProvider>
        </ThemeProvider>
    );
};

export default App;