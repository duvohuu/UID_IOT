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
} from '@mui/material';
import { 
    ArrowBack,
    Refresh as RefreshIcon,
    Assignment as ShiftIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { getMachineByIp } from '../../api/machineAPI';
import { getWorkShiftsByMachine, getWorkShiftStats } from '../../api/workShiftAPI'; // ✅ THÊM
import { MONITORING_DATA_CONFIG, ADMIN_DATA_CONFIG } from '../../config/machineDataConfig';
import WorkShiftCard from './WorkShiftCard';

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
    const [shiftFilter, setShiftFilter] = useState('all');
    const [filteredShifts, setFilteredShifts] = useState([]);
    const [shiftStats, setShiftStats] = useState(null);

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
                    
                    await fetchWorkShifts(result.data.machineId); 
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

    useEffect(() => {
        if (machine?.machineId) {
            console.log('🔄 Auto-fetch work shifts for machineId:', machine.machineId);
            fetchWorkShifts(machine.machineId);
            
            // ✅ THÊM: Auto refresh mỗi 10 giây nếu máy online
            let interval;
            if (machine.isConnected) {
                interval = setInterval(() => {
                    console.log('⏰ Auto-refresh work shifts');
                    fetchWorkShifts(machine.machineId);
                }, 10000);
            }
            
            return () => {
                if (interval) {
                    clearInterval(interval);
                }
            };
        }
    }, [machine?.machineId, machine?.isConnected]);

    const fetchWorkShifts = async (machineId) => {
        if (!machineId) {
            console.warn('⚠️ fetchWorkShifts called without machineId');
            return;
        }
        
        try {
            setShiftsLoading(true);
            console.log(`🔍 Fetching work shifts for machineId: ${machineId}`);
            
            const result = await getWorkShiftsByMachine(machineId, {
                limit: 50,
                page: 1,
                sortBy: '',
                sortOrder: 'desc',
            });
            
            console.log('📥 Work shifts API result:', result);
            
            if (result.success && result.data?.shifts) {
                const shifts = result.data.shifts;
                console.log(`✅ Found ${shifts.length} work shifts`);
                
                setWorkShifts(shifts);
                
                // ✅ Apply current filter
                if (shiftFilter === 'all') {
                    setFilteredShifts(shifts);
                } else {
                    const filtered = shifts.filter(shift => shift.status === shiftFilter);
                    setFilteredShifts(filtered);
                    console.log(`🔍 Filtered to ${filtered.length} shifts for status: ${shiftFilter}`);
                }

                // ✅ Fetch statistics
                try {
                    const statsResult = await getWorkShiftStats(machineId);
                    if (statsResult.success) {
                        setShiftStats(statsResult.data);
                    }
                } catch (statsError) {
                    console.warn('⚠️ Failed to fetch shift stats:', statsError);
                }
            } else {
                console.log('📭 No work shifts found or API error');
                setWorkShifts([]);
                setFilteredShifts([]);
            }
        } catch (error) {
            console.error('❌ Error fetching work shifts:', error);
            setWorkShifts([]);
            setFilteredShifts([]);
        } finally {
            setShiftsLoading(false);
        }
    };

    const renderShiftFilter = () => {
        const statusOptions = [
            { value: 'all', label: 'Tất cả', color: 'default' },
            { value: 'completed', label: 'Hoàn thành', color: 'success' },
            { value: 'incomplete', label: 'Chưa hoàn chỉnh', color: 'warning' },
            { value: 'interrupted', label: 'Bị gián đoạn', color: 'error' },
            { value: 'active', label: 'Đang hoạt động', color: 'info' }
        ];

        return (
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Lọc theo trạng thái:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {statusOptions.map((option) => (
                        <Chip
                            key={option.value}
                            label={option.label}
                            color={shiftFilter === option.value ? option.color : 'default'}
                            variant={shiftFilter === option.value ? 'filled' : 'outlined'}
                            onClick={() => handleShiftFilterChange(option.value)}
                            size="small"
                            sx={{ cursor: 'pointer' }}
                        />
                    ))}
                </Box>
            </Box>
        );
    };

    // ✅ THÊM: Handle shift actions
    const handleShiftClick = (shift) => {
        setSelectedShift(shift);
        setShiftDetailOpen(true);
    };

    const handleRefreshShifts = () => {
        if (machine?.machineId) {
            fetchWorkShifts(machine.machineId);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'completed':
                return { label: 'Hoàn thành', color: 'success', icon: '✅' };
            case 'incomplete':
                return { label: 'Chưa hoàn chỉnh', color: 'warning', icon: '⚠️' };
            case 'interrupted':
                return { label: 'Bị gián đoạn', color: 'error', icon: '🚨' };
            case 'active':
                return { label: 'Đang hoạt động', color: 'info', icon: '🔄' };
            default:
                return { label: status || 'Không xác định', color: 'default', icon: '❓' };
        }
    };

    // ✅ THÊM: Render shift detail dialog
    const renderShiftDetailDialog = () => (
        <Dialog 
            open={shiftDetailOpen} 
            onClose={() => setShiftDetailOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { minHeight: '70vh' } }}
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
                
                {/* ✅ THÊM: Status badge trong header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {selectedShift && (
                        <Chip 
                            label={getStatusInfo(selectedShift.status).label}
                            color={getStatusInfo(selectedShift.status).color}
                            size="small"
                            sx={{ 
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontWeight: 500
                            }}
                        />
                    )}
                    <IconButton onClick={() => setShiftDetailOpen(false)} size="small" sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {selectedShift && (
                    <Box>
                        {/* ✅ THÊM: Status warning cho incomplete/interrupted */}
                        {(selectedShift.status === 'incomplete' || selectedShift.status === 'interrupted') && (
                            <Alert 
                                severity={selectedShift.status === 'incomplete' ? 'warning' : 'error'} 
                                sx={{ mb: 3 }}
                                icon={selectedShift.status === 'incomplete' ? <WarningIcon /> : <ErrorIcon />}
                            >
                                <AlertTitle>
                                    {selectedShift.status === 'incomplete' ? '⚠️ Ca chưa hoàn chỉnh' : '🚨 Ca bị gián đoạn'}
                                </AlertTitle>
                                <Typography variant="body2">
                                    {selectedShift.status === 'incomplete' 
                                        ? 'Data cuối ca có thể chưa được cập nhật đầy đủ do dừng đột ngột. Server đã lưu data tạm thời có sẵn.'
                                        : 'Ca làm việc bị gián đoạn do mất kết nối. Data đã được lưu tạm thời và sẽ được cập nhật khi máy kết nối lại.'
                                    }
                                </Typography>
                            </Alert>
                        )}

                        {/* Basic Info... (giữ nguyên phần cũ) */}
                        
                        {/* ✅ SỬA phần Final Data với data reliability indicator */}
                        {selectedShift.finalData && (
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'secondary.main' }}>
                                            📊 Dữ liệu cuối ca
                                        </Typography>
                                        {/* ✅ THÊM: Data reliability indicator */}
                                        <Chip
                                            label={
                                                selectedShift.status === 'completed' ? '✅ Chính xác' :
                                                selectedShift.status === 'incomplete' ? '⚠️ Tạm thời' :
                                                '🚨 Chưa đầy đủ'
                                            }
                                            color={
                                                selectedShift.status === 'completed' ? 'success' :
                                                selectedShift.status === 'incomplete' ? 'warning' :
                                                'error'
                                            }
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                    
                                    {/* Monitoring data grid... (giữ nguyên phần cũ) */}
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                )}
            </DialogContent>
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

                    {/* ✅ Work Shifts Section */}
                    {<Card sx={{ mt: 2 }}>
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
                            
                            {/* Filter component */}
                            {renderShiftFilter()}
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                📋 {filteredShifts.length} ca ({workShifts.length} tổng)
                            </Typography>

                            <Box sx={{ height: 400, overflowY: 'auto' }}>
                                {shiftsLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : filteredShifts.length > 0 ? ( 
                                    <List sx={{ p: 0 }}>
                                        {filteredShifts.map((shift, index) => (
                                            <ListItem key={shift._id || index} sx={{ p: 0, mb: 1 }}>
                                                <WorkShiftCard 
                                                    shift={shift} 
                                                    onClick={handleShiftClick}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                                        <ShiftIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                            {shiftFilter === 'all' 
                                                ? 'Chưa có ca làm việc nào được ghi nhận'
                                                : `Không có ca làm việc nào ở trạng thái "${shiftFilter}"`
                                            }
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                    }
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