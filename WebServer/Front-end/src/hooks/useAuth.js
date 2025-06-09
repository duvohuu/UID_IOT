import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import loginUser from "../api/loginUser";
import { useSnackbar } from '../context/SnackbarContext';

const useAuth = (setUser, socket) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [openLogin, setOpenLogin] = useState(false);
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate(); 

    const handleLogin = async () => {
        try {
            const res = await loginUser(email, password);
            if (res.success) {
                const userData = {
                    username: res.username,
                    email: res.email,
                    role: res.role,
                    avatar: res.avatar
                };
                
                // Cập nhật state và localStorage
                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
                
                // Đóng modal và reset form
                setOpenLogin(false);
                setEmail("");
                setPassword("");
                
                // Kết nối socket
                if (socket) {
                    socket.connect();
                }
                
                showSnackbar("Đăng nhập thành công", "success");
                
                // Điều hướng về trang status
                navigate("/status", { replace: true });
                
            } else {
                showSnackbar(res.message || "Đăng nhập thất bại", "error");
            }
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            showSnackbar("Lỗi kết nối server", "error");
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/users/logout`,
                {},
                { withCredentials: true }
            );
            
            // Clear user data
            setUser(null);
            localStorage.removeItem("user");
            
            // Disconnect socket
            if (socket) {
                socket.disconnect();
            }
            
            showSnackbar("Đăng xuất thành công", "success");
            navigate("/status", { replace: true });
            
        } catch (error) {
            console.error("Lỗi khi đăng xuất:", error);
            showSnackbar("Lỗi khi đăng xuất", "error");
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        openLogin,
        setOpenLogin,
        handleLogin,
        handleLogout,
    };
};

export default useAuth;