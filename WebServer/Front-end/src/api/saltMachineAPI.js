import axios from "axios";

axios.defaults.withCredentials = true;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; // mainServer

// Lấy danh sách ca làm việc theo máy
export const getWorkShiftsByMachine = async (machineId, params = {}) => {
    try {
        const queryParams = new URLSearchParams({
            machineId,
            limit: params.limit || 20,
            page: params.page || 1,
            sortBy: params.sortBy || 'shiftId',     
            sortOrder: params.sortOrder || 'asc',  
            ...params
        });

        const response = await axios.get(`${API_URL}/api/work-shifts?${queryParams}`, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy danh sách ca làm việc" 
        };
    }
};

export const getWorkShiftStats = async (machineId, params = {}) => {
    try {
        const queryParams = new URLSearchParams({
            machineId,
            ...params
        });

        const response = await axios.get(`${API_URL}/api/work-shifts/stats?${queryParams}`, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy thống kê ca làm việc" 
        };
    }
};

// Lấy chi tiết 1 ca làm việc
export const getWorkShiftDetail = async (shiftId) => {
    try {
        const response = await axios.get(`${API_URL}/api/work-shifts/${shiftId}`, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy chi tiết ca làm việc" 
        };
    }
};