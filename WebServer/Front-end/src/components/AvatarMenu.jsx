import React, { useState } from "react";
import {
    Avatar,
    Menu,
    MenuItem,
    Divider,
    Box,
    Typography,
    useTheme,
    Fade,
    IconButton,
    Chip,
} from "@mui/material";
import {
    Person as PersonIcon,
    Lock as LockIcon,
    Logout as LogoutIcon,
    CameraAlt as CameraIcon,
    Edit as EditIcon,
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import axios from "axios";
import ChangePasswordDialog from "./ChangePasswordDialog";
import { useSnackbar } from '../context/SnackbarContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Enhanced Menu with glassmorphism
const StyledMenu = styled(Menu)(({ theme }) => ({
    "& .MuiPaper-root": {
        marginTop: theme.spacing(1),
        minWidth: 280,
        background: `linear-gradient(145deg, 
            ${alpha(theme.palette.background.paper, 0.95)} 0%, 
            ${alpha(theme.palette.background.default, 0.9)} 100%)`,
        backdropFilter: "blur(20px) saturate(180%)",
        borderRadius: 16,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.15)}`,
        overflow: "visible",
        "&::before": {
            content: '""',
            display: "block",
            position: "absolute",
            top: 0,
            right: 16,
            width: 12,
            height: 12,
            background: `linear-gradient(135deg, 
                ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                ${alpha(theme.palette.background.default, 0.9)} 100%)`,
            transform: "translateY(-50%) rotate(45deg)",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderBottom: "none",
            borderRight: "none",
        },
    },
}));

// Enhanced User Header Section
const UserHeaderSection = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2.5),
    background: `linear-gradient(135deg, 
        ${alpha(theme.palette.primary.main, 0.08)} 0%, 
        ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
    borderRadius: "12px 12px 0 0",
    position: "relative",
    overflow: "hidden",
    "&::before": {
        content: '""',
        position: "absolute",
        top: -50,
        left: -50,
        width: "200%",
        height: "200%",
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
        animation: "pulse 4s ease-in-out infinite",
    },
    "@keyframes pulse": {
        "0%, 100%": { opacity: 0.3 },
        "50%": { opacity: 0.1 },
    },
}));

// Enhanced Avatar with edit overlay
const AvatarContainer = styled(Box)(({ theme }) => ({
    position: "relative",
    display: "inline-block",
    "&:hover .avatar-overlay": {
        opacity: 1,
    },
}));

const AvatarOverlay = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: "50%",
    background: alpha(theme.palette.common.black, 0.5),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 0.3s ease",
    cursor: "pointer",
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    width: 56,
    height: 56,
    border: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    "&::before": {
        content: '""',
        position: "absolute",
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        opacity: 0,
        transition: "opacity 0.3s ease",
        zIndex: -1,
    },
    "&:hover::before": {
        opacity: 0.3,
    },
}));

// Enhanced Menu Items
const StyledMenuItem = styled(MenuItem)(({ theme, variant = "default" }) => {
    const variants = {
        default: {
            color: theme.palette.text.primary,
            "&:hover": {
                background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.primary.main, 0.1)} 0%, 
                    ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                color: theme.palette.primary.main,
                transform: "translateX(4px)",
            },
        },
        danger: {
            color: theme.palette.error.main,
            "&:hover": {
                background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.error.main, 0.1)} 0%, 
                    ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                color: theme.palette.error.main,
                transform: "translateX(4px)",
            },
        },
    };

    return {
        padding: theme.spacing(1.5, 2),
        margin: theme.spacing(0.5, 1),
        borderRadius: 12,
        fontSize: "0.95rem",
        fontWeight: 500,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
        position: "relative",
        overflow: "hidden",
        "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "100%",
            height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
            transition: "left 0.5s ease",
        },
        "&:hover::before": {
            left: "100%",
        },
        ...variants[variant],
    };
});

// Enhanced Status Chip
const StatusChip = styled(Chip)(({ theme }) => ({
    fontSize: "0.7rem",
    height: 20,
    background: `linear-gradient(135deg, 
        ${theme.palette.success.main} 0%, 
        ${theme.palette.success.light} 100%)`,
    color: "white",
    fontWeight: 600,
    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
    "& .MuiChip-icon": {
        color: "white",
        fontSize: "0.8rem",
    },
}));

const AvatarMenu = ({ anchorEl, onClose, user, setUser, onLogout }) => {
    const theme = useTheme();
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const { showSnackbar } = useSnackbar();

    const handleAvatarChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("avatar", file);
            
            try {
                const res = await axios.post(
                    `${API_URL}/api/users/update-avatar`,
                    formData,
                    { 
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                
                const updatedAvatar = res.data.avatar;
                
                // ✅ SỬA: Cập nhật user state và localStorage đúng cách
                const updatedUser = { 
                    ...user, 
                    avatar: updatedAvatar 
                };
                
                setUser(updatedUser);
                localStorage.setItem("user", JSON.stringify(updatedUser));
                
                showSnackbar("Cập nhật avatar thành công", "success");
                onClose();
            } catch (error) {
                console.error("Lỗi khi cập nhật avatar:", error);
                showSnackbar(
                    error.response?.data?.message || "Lỗi khi cập nhật avatar", 
                    "error"
                );
            }
        }
    };

    const handleChangePassword = async () => {
        try {
            const res = await axios.post(
                `${API_URL}/api/users/change-password`,
                { oldPassword, newPassword },
                { withCredentials: true }
            );
            showSnackbar(res.data.message, "success");
            setOpenChangePassword(false);
            setOldPassword("");
            setNewPassword("");
        } catch (error) {
            console.error("Lỗi khi đổi mật khẩu:", error);
            showSnackbar(error.response?.data?.message || "Lỗi khi đổi mật khẩu", "error");
        }
    };

    const handleLogoutClick = () => {
        onLogout();
        onClose();
    };

    const avatarSrc = user?.avatar 
        ? (user.avatar.startsWith('http') 
            ? user.avatar 
            : `${API_URL}${user.avatar}`)
        : undefined;

    return (
        <>
            <StyledMenu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={onClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 300 }}
            >
                {/* Enhanced User Header */}
                <UserHeaderSection>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative", zIndex: 1 }}>
                        <AvatarContainer>
                            <StyledAvatar
                                src={avatarSrc}
                                alt={user.username}
                            >
                                {!avatarSrc && <PersonIcon />}
                            </StyledAvatar>
                            <AvatarOverlay className="avatar-overlay" component="label">
                                <CameraIcon sx={{ color: "white", fontSize: 20 }} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleAvatarChange}
                                />
                            </AvatarOverlay>
                        </AvatarContainer>
                        
                        <Box sx={{ flex: 1 }}>
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    fontWeight: 700,
                                    color: theme.palette.text.primary,
                                    mb: 0.5,
                                    lineHeight: 1.2
                                }}
                            >
                                {user.username}
                            </Typography>
                            <StatusChip 
                                label="Online" 
                                size="small"
                                icon={<Box 
                                    sx={{ 
                                        width: 6, 
                                        height: 6, 
                                        borderRadius: "50%", 
                                        bgcolor: "white",
                                        animation: "blink 2s infinite"
                                    }} 
                                />}
                            />
                        </Box>
                    </Box>
                </UserHeaderSection>

                <Divider sx={{ 
                    borderColor: alpha(theme.palette.divider, 0.1),
                    my: 0
                }} />

                {/* Menu Items */}
                <Box sx={{ py: 1 }}>
                    <StyledMenuItem component="label">
                        <EditIcon sx={{ fontSize: 20 }} />
                        Cập nhật avatar
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleAvatarChange}
                        />
                    </StyledMenuItem>

                    <StyledMenuItem onClick={() => setOpenChangePassword(true)}>
                        <LockIcon sx={{ fontSize: 20 }} />
                        Đổi mật khẩu
                    </StyledMenuItem>

                    <Divider sx={{ 
                        borderColor: alpha(theme.palette.divider, 0.08),
                        my: 1,
                        mx: 2
                    }} />

                    <StyledMenuItem 
                        onClick={handleLogoutClick}
                        variant="danger"
                    >
                        <LogoutIcon sx={{ fontSize: 20 }} />
                        Đăng xuất
                    </StyledMenuItem>
                </Box>
            </StyledMenu>

            <ChangePasswordDialog
                open={openChangePassword}
                onClose={() => {
                    setOpenChangePassword(false);
                    setOldPassword("");
                    setNewPassword("");
                }}
                oldPassword={oldPassword}
                setOldPassword={setOldPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                handleChangePassword={handleChangePassword}
            />

            <style jsx>{`
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }
            `}</style>
        </>
    );
};

export default AvatarMenu;