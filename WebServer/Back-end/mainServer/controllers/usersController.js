import axios from "axios";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DB_SERVER_URL = process.env.DB_SERVER_URL || "http://localhost:5001";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hàm kiểm tra định dạng email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Hàm kiểm tra dữ liệu đầu vào cho đăng ký
const validateRegisterInput = (username, email, password) => {
    if (!username || username.length < 3) {
        return "Tên người dùng phải có ít nhất 3 ký tự";
    }
    if (!email || !isValidEmail(email)) {
        return "Email không hợp lệ";
    }
    if (!password || password.length < 6) {
        return "Mật khẩu phải có ít nhất 6 ký tự";
    }
    return null;
};

// Hàm kiểm tra dữ liệu đầu vào cho đăng nhập
const validateLoginInput = (email, password) => {
    if (!email || !isValidEmail(email)) {
        return "Email không hợp lệ";
    }
    if (!password || password.length < 6) {
        return "Mật khẩu phải có ít nhất 6 ký tự";
    }
    return null;
};

// Hàm kiểm tra dữ liệu đầu vào cho đổi mật khẩu
const validateChangePasswordInput = (oldPassword, newPassword) => {
    if (!oldPassword || oldPassword.length < 6) {
        return "Mật khẩu cũ phải có ít nhất 6 ký tự";
    }
    if (!newPassword || newPassword.length < 6) {
        return "Mật khẩu mới phải có ít nhất 6 ký tự";
    }
    if (oldPassword === newPassword) {
        return "Mật khẩu mới phải khác mật khẩu cũ";
    }
    return null;
};

export const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const validationError = validateRegisterInput(username, email, password);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const response = await axios.get(`${DB_SERVER_URL}/db/users/email/${email}`);
        if (response.status === 200) {
            return res.status(400).json({ message: "Email đã tồn tại" });
        }

        const newUser = await axios.post(`${DB_SERVER_URL}/db/users`, { username, email, password });
        res.status(201).json({ message: "Đăng ký thành công" });
    } catch (err) {
        if (err.response && err.response.status === 404) {
            // Email không tồn tại, có thể tiếp tục tạo user
            try {
                await axios.post(`${DB_SERVER_URL}/db/users`, { username, email, password });
                res.status(201).json({ message: "Đăng ký thành công" });
            } catch (createErr) {
                res.status(500).json({ message: "Lỗi đăng ký người dùng" });
            }
        } else {
            res.status(500).json({ message: "Lỗi đăng ký người dùng" });
        }
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const validationError = validateLoginInput(email, password);
        if (validationError) {
            console.log("Validation error:", validationError);
            return res.status(400).json({ message: validationError });
        }

        console.log("Đang đăng nhập:", email);
        const response = await axios.get(`${DB_SERVER_URL}/db/users/email/${email}`);
        const user = response.data;

        console.log("User tìm thấy:", user.email);
        const isMatch = await bcryptCompare(password, user.password); // Cần cài đặt bcrypt ở main server
        if (!isMatch) {
            console.log("Sai mật khẩu cho:", email);
            return res.status(401).json({ message: "Thông tin đăng nhập không chính xác" });
        }

        console.log("Đăng nhập thành công, tạo token...");
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
        });
        res.json({ username: user.username, avatar: user.avatar });
    } catch (err) {
        if (err.response && err.response.status === 404) {
            console.log("Không tìm thấy user:", email);
            return res.status(401).json({ message: "Thông tin đăng nhập không chính xác" });
        }
        console.error("Lỗi đăng nhập:", err.message);
        res.status(500).json({ message: "Lỗi đăng nhập" });
    }
};

export const logoutUser = async (req, res) => {
    res.clearCookie("authToken");
    res.json({ message: "Đăng xuất thành công" });
};

export const updateAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("User ID:", userId);
        const response = await axios.get(`${DB_SERVER_URL}/db/users/${userId}`);
        const user = response.data;

        if (!req.file) {
            console.log("Không có file được tải lên");
            return res.status(400).json({ message: "Không có file được tải lên" });
        }

        console.log("File được tải lên:", req.file);

        const uploadDir = path.join(__dirname, "../upload/avatars");
        if (!fs.existsSync(uploadDir)) {
            console.log("Tạo thư mục upload/avatars");
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        if (user.avatar) {
            const oldAvatarFilename = path.basename(user.avatar);
            const oldAvatarPath = path.join(uploadDir, oldAvatarFilename);
            try {
                if (fs.existsSync(oldAvatarPath)) {
                    console.log(`Xóa file avatar cũ: ${oldAvatarPath}`);
                    fs.unlinkSync(oldAvatarPath);
                } else {
                    console.log(`Không tìm thấy file avatar cũ: ${oldAvatarPath}`);
                }
            } catch (err) {
                console.error("Lỗi khi xóa file avatar cũ:", err.message);
            }
        }

        const avatarPath = `/avatars/${req.file.filename}`;
        await axios.put(`${DB_SERVER_URL}/db/users/${userId}`, { avatar: avatarPath });
        console.log("Cập nhật avatar trong database:", avatarPath);

        res.json({ avatar: avatarPath });
    } catch (err) {
        console.error("Lỗi khi cập nhật avatar:", err.message);
        if (req.file) {
            const newAvatarPath = path.join(__dirname, "../upload/avatars", req.file.filename);
            try {
                if (fs.existsSync(newAvatarPath)) {
                    console.log(`Xóa file mới do lỗi: ${newAvatarPath}`);
                    fs.unlinkSync(newAvatarPath);
                }
            } catch (err) {
                console.error("Lỗi khi xóa file mới:", err.message);
            }
        }
        res.status(500).json({ message: err.message || "Lỗi khi cập nhật avatar" });
    }
};

export const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const validationError = validateChangePasswordInput(oldPassword, newPassword);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const userId = req.user.id;
        const response = await axios.get(`${DB_SERVER_URL}/db/users/${userId}`);
        const user = response.data;

        const isMatch = await bcryptCompare(oldPassword, user.password); // Cần cài đặt bcrypt ở main server
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu cũ không chính xác" });
        }

        await axios.put(`${DB_SERVER_URL}/db/users/${userId}`, { password: newPassword });

        res.json({ message: "Đổi mật khẩu thành công" });
    } catch (err) {
        console.error("Lỗi khi đổi mật khẩu:", err.message);
        res.status(500).json({ message: "Lỗi khi đổi mật khẩu" });
    }
};

// Hàm so sánh mật khẩu (tạm thời, cần cài đặt bcrypt)
const bcryptCompare = async (plainPassword, hashedPassword) => {
    const bcrypt = await import("bcryptjs");
    return await bcrypt.compare(plainPassword, hashedPassword);
};