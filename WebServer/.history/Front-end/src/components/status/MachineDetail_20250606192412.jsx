import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    Box, 
    Card, 
    CardContent, 
    Grid, 
    Chip, 
    Button,
    Alert,
    CircularProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import { 
    ArrowBack,
    Refresh as RefreshIcon,
    Assignment as ShiftIcon,
    Schedule as ScheduleIcon,
    LocalDrink as BottleIcon,
    Scale as WeightIcon,
    Timer as TimerIcon,
    Visibility as ViewIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { getMachineByIp } from '../../api/machineAPI';
import { getWorkShiftsByMachine } from '../../api/workShiftAPI'; // ✅ THÊM
import { MONITORING_DATA_CONFIG, ADMIN_DATA_CONFIG } from '../../config/machineDataConfig';

const MachineDetail = ({ user }) => {
    const { ip } = useParams();
    const navigate = useNavigate();
    const [machine, setMachine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // ✅ THÊM: Work shift states
    const [workShifts, setWorkShifts] = useState([]);
    const [shiftsLoading, setShiftsLoading] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [shiftDetailOpen, setShiftDetailOpen] = useState(false);

    useEffect(() => {
        const fetchMachine = async () => {
            try {
                setLoading(true);
                console.log(`🔍 Fetching machine details for IP: ${ip}`);
                
                const result = await getMachineByIp(ip);
                if (result.success) {
                    setMachine(result.data);
                    setError(null);
                    console.log(`✅ Machine loaded:`, result.data.name);
                    
                    // ✅ Lấy work shifts nếu máy đã kết nối
                    if (result.data.isConnected) {
                        await fetchWorkShifts(result.data._id);
                    }
                } else {
                    setError(result.message);
                    console.error(`❌ Failed to load machine:`, result.message);
                }
            } catch (err) {
                setError('Lỗi khi tải thông tin máy');
                console.error('Error fetching machine:', err);
            } finally {
                setLoading(false);
            }
        };

        if (ip) {
            fetchMachine();
        } else {
            setError('IP không hợp lệ');
            setLoading(false);
        }
    }, [ip]);

    // ✅ THÊM: Function fetch work shifts
    const fetchWorkShifts = async (machineId) => {
        if (!machineId) return;
        
        try {
            setShiftsLoading(true);
            console.log(`🔍 Fetching work shifts for machine: ${machineId}`);
            
            const result = await getWorkShiftsByMachine(machineId, {
                limit: 50,
                page: 1
            });
            
            if (result.success) {
                setWorkShifts(result.data.shifts || []);
                console.log(`✅ Loaded ${result.data.shifts?.length || 0} work shifts`);
            } else {
                console.warn('No work shifts found:', result.message);
                setWorkShifts([]);
            }
        } catch (error) {
            console.error('Error fetching work shifts:', error);
            setWorkShifts([]);
        } finally {
            setShiftsLoading(false);
        }
    };

    // ✅ THÊM: Format helper functions
    const formatDuration = (milliseconds) => {
        if (!milliseconds) return 'N/A';
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    };

    const formatWeight = (weight) => {
        if (!weight) return '0g';
        if (weight >= 1000) {
            return `${(weight / 1000).toFixed(1)}kg`;
        }
        return `${weight}g`;
    };

    // ✅ THÊM: Handle shift actions
    const handleShiftClick = (shift) => {
        setSelectedShift(shift);
        setShiftDetailOpen(true);
    };

    const handleRefreshShifts = () => {
        if (machine?._id && machine.isConnected) {
            fetchWorkShifts(machine._id);
        }
    };

    // ✅ THÊM: Render shift detail dialog
    const renderShiftDetailDialog = () => (
        <Dialog 
            open={shiftDetailOpen} 
            onClose={() => setShiftDetailOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '70vh' }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pb: 1,
                bgcolor: 'primary.main',
                color: 'white'
            }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Chi tiết ca làm việc
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {selectedShift?.shiftId}
                    </Typography>
                </Box>
                <IconButton onClick={() => setShiftDetailOpen(false)} size="small" sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {selectedShift && (
                    <Box>
                        {/* Basic Info */}
                        <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    📋 Thông tin ca làm việc
                                </Typography>
                                
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" color="text.secondary">Máy:</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {selectedShift.machineName}
                                            </Typography>
                                        </Box>
                                        
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" color="text.secondary">Bắt đầu:</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {new Date(selectedShift.startTime).toLocaleString('vi-VN')}
                                            </Typography>
                                        </Box>
                                        
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Kết thúc:</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {selectedShift.endTime ? new Date(selectedShift.endTime).toLocaleString('vi-VN') : 'Chưa kết thúc'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                            <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                                                <TimerIcon sx={{ color: 'primary.main', mb: 0.5, fontSize: 28 }} />
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Thời gian
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    {formatDuration(selectedShift.duration)}
                                                </Typography>
                                            </Box>
                                            
                                            <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                                                <BottleIcon sx={{ color: 'info.main', mb: 0.5, fontSize: 28 }} />
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Chai sản xuất
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.main' }}>
                                                    {selectedShift.totalBottlesProduced || 0}
                                                </Typography>
                                            </Box>
                                            
                                            <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                                                <WeightIcon sx={{ color: 'success.main', mb: 0.5, fontSize: 28 }} />
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Tổng khối lượng
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                    {formatWeight(selectedShift.totalWeightFilled)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Final Data Preview */}
                        {selectedShift.finalData && (
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'secondary.main' }}>
                                        📊 Dữ liệu cuối ca
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} md={3}>
                                            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                                <Typography variant="caption" color="text.secondary">40001 - Trạng thái máy:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {selectedShift.finalData.monitoringData?.['40001'] === 1 ? '🟢 Hoạt động' : '🔴 Dừng'}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                                <Typography variant="caption" color="text.secondary">40002 - Bồn muối:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {selectedShift.finalData.monitoringData?.['40002'] === 1 ? '🟢 Đầy' : '🟡 Chưa đầy'}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                                <Typography variant="caption" color="text.secondary">40003 - Loại muối:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {selectedShift.finalData.monitoringData?.['40003'] === 1 ? '🧂 Hạt' : '🧂 Nhuyễn'}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                                <Typography variant="caption" color="text.secondary">40007 - Tổng chai:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                                                    🍶 {selectedShift.finalData.monitoringData?.['40007'] || 0}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    {user?.role === 'admin' && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                💡 <strong>Admin:</strong> Dữ liệu chi tiết (40008-40036) có sẵn trong hệ thống
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button onClick={() => setShiftDetailOpen(false)} variant="outlined">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );

    // Existing render data card function
    const renderDataCard = (title, config, data, isAdminOnly = false) => {
        return (
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {title}
                        </Typography>
                        {isAdminOnly && (
                            <Chip label="Admin Only" size="small" color="secondary" />
                        )}
                    </Box>
                    
                    <Grid container spacing={2}>
                        {Object.entries(config).map(([key, fieldConfig]) => {
                            const value = data[key];
                            const IconComponent = fieldConfig.icon;
                            
                            return (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                                    <Box sx={{ 
                                        p: 2, 
                                        border: 1, 
                                        borderColor: 'divider', 
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2
                                    }}>
                                        <IconComponent sx={{ color: 'primary.main' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {fieldConfig.title}
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {fieldConfig.type === 'status' && fieldConfig.values 
                                                    ? fieldConfig.values[value]?.label || 'Không xác định'
                                                    : `${value || 0} ${fieldConfig.unit || ''}`
                                                }
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Đang tải thông tin máy...</Typography>
            </Container>
        );
    }

    if (error || !machine) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error || 'Không tìm thấy thông tin máy'}
                </Alert>
                <Button 
                    variant="contained" 
                    startIcon={<ArrowBack />} 
                    onClick={() => navigate('/status')}
                >
                    Quay lại
                </Button>
            </Container>
        );
    }

    const monitoringData = machine.parameters?.monitoringData || {};
    const adminData = machine.parameters?.adminData || {};
    const isAdmin = user?.role === 'admin';

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/status')}
                >
                    Quay lại
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {machine.name}
                </Typography>
                <Chip 
                    label={machine.isConnected ? 'Đang kết nối' : 'Mất kết nối'} 
                    color={machine.isConnected ? 'success' : 'error'} 
                />
            </Box>

            <Grid container spacing={3}>
                {/* Machine Basic Info + Work Shifts */}
                <Grid size={{ xs: 12, md: 4 }}>
                    {/* Basic Info */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Thông tin cơ bản</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography><strong>IP:</strong> {machine.ip}</Typography>
                                <Typography><strong>Loại máy:</strong> {machine.type}</Typography>
                                <Typography><strong>Vị trí:</strong> {machine.location}</Typography>
                                <Typography><strong>Trạng thái:</strong> {machine.status}</Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* ✅ Work Shifts Section - CHỈ HIỂN THỊ KHI MÁY ONLINE */}
                    {machine.isConnected && (
                        <Card sx={{ mt: 2 }}>
                            <CardContent sx={{ pb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ShiftIcon sx={{ color: 'primary.main' }} />
                                        Ca làm việc
                                    </Typography>
                                    <IconButton 
                                        size="small" 
                                        onClick={handleRefreshShifts}
                                        disabled={shiftsLoading}
                                        sx={{ color: 'primary.main' }}
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    📋 {workShifts.length} ca đã hoàn thành
                                </Typography>

                                {/* ✅ SCROLLBAR CONTAINER GIỐNG HÌNH */}
                                <Box sx={{ 
                                    height: 400, 
                                    overflowY: 'auto',
                                    pr: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    bgcolor: 'background.paper',
                                    // Custom scrollbar styles giống hình
                                    '&::-webkit-scrollbar': {
                                        width: 8
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        backgroundColor: '#f1f1f1',
                                        borderRadius: 4
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        backgroundColor: '#c1c1c1',
                                        borderRadius: 4,
                                        '&:hover': {
                                            backgroundColor: '#a8a8a8'
                                        }
                                    }
                                }}>
                                    {shiftsLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                            <CircularProgress size={24} />
                                        </Box>
                                    ) : workShifts.length > 0 ? (
                                        <List sx={{ p: 0 }}>
                                            {workShifts.map((shift, index) => (
                                                <React.Fragment key={shift._id}>
                                                    <ListItem disablePadding>
                                                        <ListItemButton 
                                                            onClick={() => handleShiftClick(shift)}
                                                            sx={{ 
                                                                py: 1.5,
                                                                '&:hover': {
                                                                    bgcolor: 'action.hover'
                                                                }
                                                            }}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                                <Typography variant="body2" sx={{ 
                                                                    bgcolor: 'primary.main', 
                                                                    color: 'white', 
                                                                    borderRadius: '50%', 
                                                                    width: 24, 
                                                                    height: 24, 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'center',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 600
                                                                }}>
                                                                    {index + 1}
                                                                </Typography>
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={
                                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                        Ca {index + 1}
                                                                    </Typography>
                                                                }
                                                                secondary={
                                                                    <Box>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            ⏰ {new Date(shift.startTime).toLocaleString('vi-VN', {
                                                                                day: '2-digit',
                                                                                month: '2-digit',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </Typography>
                                                                        <br />
                                                                        <Typography variant="caption" color="primary.main">
                                                                            🍶 {shift.totalBottlesProduced || 0} chai • ⚖️ {formatWeight(shift.totalWeightFilled)}
                                                                        </Typography>
                                                                    </Box>
                                                                }
                                                            />
                                                            <ViewIcon sx={{ color: 'action.active', fontSize: 20 }} />
                                                        </ListItemButton>
                                                    </ListItem>
                                                    {index < workShifts.length - 1 && <Divider />}
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
                                            <ShiftIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                                Chưa có ca làm việc nào được ghi nhận
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* Monitoring Data - All users can view */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {renderDataCard(
                        'Dữ liệu giám sát (40001 - 40007)', 
                        MONITORING_DATA_CONFIG, 
                        monitoringData,
                        false
                    )}
                </Grid>

                {/* Admin Data - Only admin can view */}
                {isAdmin && (
                    <Grid size={{ xs: 12 }}>
                        {renderDataCard(
                            'Dữ liệu chi tiết - Admin (40008 - 40036)', 
                            ADMIN_DATA_CONFIG, 
                            adminData,
                            true
                        )}
                    </Grid>
                )}

                {/* Access Denied for Non-Admin */}
                {!isAdmin && (
                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ 
                            border: '2px dashed', 
                            borderColor: 'grey.300',
                            bgcolor: 'grey.50'
                        }}>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    🔒 Dữ liệu chi tiết
                                </Typography>
                                <Typography color="text.secondary">
                                    Chỉ admin mới có thể xem dữ liệu chi tiết từ register 40008-40036
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            {/* Last Update Info */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Cập nhật lần cuối: {machine.lastUpdate ? new Date(machine.lastUpdate).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
                </Typography>
            </Box>

            {/* ✅ Work Shift Detail Dialog */}
            {renderShiftDetailDialog()}
        </Container>
    );
};

export default MachineDetail;