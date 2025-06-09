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
import { getWorkShiftsByMachine, getWorkShiftStats } from '../../api/workShiftAPI';
import { MONITORING_DATA_CONFIG, ADMIN_DATA_CONFIG } from '../../config/machineDataConfig';
import { processCombinedData } from '../../utils/dataProcessing';
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
    const [selectedShiftData, setSelectedShiftData] = useState(null);

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
                sortBy: 'shiftId',
                sortOrder: 'desc'  
            });
            
            console.log('📥 Work shifts API result:', result);
            
            if (result.success && result.data?.shifts) {
                const shifts = result.data.shifts;
                
                console.log('📋 Work shifts from backend (sorted by latest first):');
                shifts.forEach((shift, index) => {
                    console.log(`   ${index + 1}. ${shift.shiftId} (${shift.status})`);
                });
                
                setWorkShifts(shifts);
                autoSelectDefaultShift(shifts);
                
                // ✅ Apply filter
                if (shiftFilter === 'all') {
                    setFilteredShifts(shifts);
                } else {
                    const filtered = shifts.filter(shift => shift.status === shiftFilter);
                    setFilteredShifts(filtered);
                }

                // Fetch stats
                if (shifts.length > 0) {
                    const statsResult = await getWorkShiftStats(machineId);
                    if (statsResult.success) {
                        setShiftStats(statsResult.data);
                    }
                }

            } else {
                console.log('📭 No work shifts found or API error');
                setWorkShifts([]);
                setFilteredShifts([]);
                setSelectedShiftData(null);
            }
        } catch (error) {
            console.error('❌ Error fetching work shifts:', error);
            setWorkShifts([]);
            setFilteredShifts([]);
            setSelectedShiftData(null); 
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

    const handleShiftClick = (shift) => {
        console.log('🔍 Selected shift for data display:', shift);
        setSelectedShiftData(shift);
    
        setTimeout(() => {
            const element = document.getElementById('selected-shift-data');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const handleClearSelectedShift = () => {
        setSelectedShiftData(null);
    };

    const handleRefreshShifts = () => {
        if (machine?.machineId) {
            fetchWorkShifts(machine.machineId);
        }
    };

    const handleShiftFilterChange = (filterValue) => {
        setShiftFilter(filterValue);
        
        let filtered;
        if (filterValue === 'all') {
            filtered = workShifts;
        } else {
            filtered = workShifts.filter(shift => shift.status === filterValue);
        }
        
        setFilteredShifts(filtered);
        
        // ✅ THÊM: Giữ selected shift nếu vẫn trong filtered list
        if (selectedShiftData) {
            const isSelectedStillVisible = filtered.some(shift => shift._id === selectedShiftData._id);
            if (!isSelectedStillVisible) {
                // Nếu selected shift không còn trong filter, auto-select lại
                autoSelectDefaultShift(filtered);
            }
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

    const getDisplayData = (dataType = 'monitoring') => {
        if (selectedShiftData) {
            // ✅ Chỉ hiển thị data ca đã chọn (hoặc auto-selected)
            return {
                title: dataType === 'monitoring' 
                    ? `📊 Dữ liệu ca: ${selectedShiftData.shiftId}`
                    : `🔧 Dữ liệu phát triển ca: ${selectedShiftData.shiftId}`,
                isSelectedShift: true,
                data: dataType === 'monitoring' 
                    ? selectedShiftData.finalData?.monitoringData || {}
                    : selectedShiftData.finalData?.adminData || {},
                shiftInfo: selectedShiftData,
                statusInfo: getStatusInfo(selectedShiftData.status)
            };
        } else {
            return null;
        }
    };

     const autoSelectDefaultShift = (shifts) => {
        if (!shifts || shifts.length === 0) {
            setSelectedShiftData(null);
            return;
        }

        // ✅ Tìm ca đang hoạt động (active)
        const activeShift = shifts.find(shift => shift.status === 'active');
        
        if (activeShift) {
            console.log('🎯 Auto-selected active shift:', activeShift.shiftId);
            setSelectedShiftData(activeShift);
            return;
        }

        const latestShift = shifts[0]; 
        console.log('🎯 Auto-selected latest shift:', latestShift.shiftId);
        setSelectedShiftData(latestShift);
    };

    const renderUnifiedDataCard = (dataType, config, isAdminOnly = false) => {
        const displayData = getDisplayData(dataType);
        
        // ✅ THÊM: Placeholder khi không có data
        if (!displayData) {
            return (
                <Card sx={{ 
                    border: '2px dashed', 
                    borderColor: 'grey.300',
                    bgcolor: 'grey.50',
                    mb: 2
                }}>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            {dataType === 'monitoring' ? '📊 Dữ liệu giám sát' : '🔧 Dữ liệu phát triển'}
                        </Typography>
                        
                        {shiftsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                                <CircularProgress size={20} />
                                <Typography color="text.secondary">
                                    Đang tải ca làm việc...
                                </Typography>
                            </Box>
                        ) : workShifts.length === 0 ? (
                            <>
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    Chưa có ca làm việc nào được ghi nhận
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                    💡 Dữ liệu sẽ hiển thị khi có ca làm việc mới
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    Chọn ca làm việc bên trái để xem dữ liệu chi tiết
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                    💡 Click vào bất kỳ ca nào trong danh sách để hiển thị data
                                </Typography>
                            </>
                        )}
                        
                        {isAdminOnly && (
                            <Chip 
                                label="Admin Only" 
                                size="small" 
                                color="secondary" 
                                sx={{ mt: 1 }}
                            />
                        )}
                    </CardContent>
                </Card>
            );
        }
        
        // ✅ Giữ nguyên render khi có data
        return (
            <Card sx={{ 
                mb: 2, 
                border: 2, 
                borderColor: 'primary.main'
            }}>
                <CardContent>
                    {/* Header với title và controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {displayData.title}
                            </Typography>
                            
                            {isAdminOnly && (
                                <Chip label="Admin Only" size="small" color="secondary" />
                            )}
                            
                            {/* ✅ THÊM: Auto-selected indicator */}
                            {displayData.shiftInfo.status === 'active' && (
                                <Chip 
                                    label="Ca đang hoạt động" 
                                    size="small" 
                                    color="success"
                                    icon={<span>🔄</span>}
                                />
                            )}
                            
                            {/* Status chip */}
                            {displayData.statusInfo && (
                                <Chip 
                                    label={displayData.statusInfo.label}
                                    color={displayData.statusInfo.color}
                                    size="small"
                                    icon={<span>{displayData.statusInfo.icon}</span>}
                                />
                            )}
                        </Box>
                        
                        {/* ✅ SỬA: Clear button text */}
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CloseIcon />}
                            onClick={handleClearSelectedShift}
                            sx={{ minWidth: 'auto' }}
                        >
                            Bỏ chọn ca
                        </Button>
                    </Box>

                    {/* ✅ Giữ nguyên phần còn lại của card... */}
                    {/* Thông tin cơ bản ca */}
                    {dataType === 'monitoring' && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Thời gian bắt đầu</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {displayData.shiftInfo.startTime ? new Date(displayData.shiftInfo.startTime).toLocaleString('vi-VN') : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Thời gian kết thúc</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {displayData.shiftInfo.endTime ? new Date(displayData.shiftInfo.endTime).toLocaleString('vi-VN') : 'Đang hoạt động'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Tổng khối lượng</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {(displayData.shiftInfo.totalWeightFilled || 0).toLocaleString('vi-VN')} g
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Tổng khối lượng</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {(displayData.shiftInfo.totalWeightFilled || 0).toLocaleString('vi-VN')} g
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* ✅ Giữ nguyên phần render data fields... */}
                    {/* Data reliability warning */}
                    {(displayData.shiftInfo.status === 'incomplete' || displayData.shiftInfo.status === 'interrupted') && (
                        <Alert 
                            severity={displayData.shiftInfo.status === 'incomplete' ? 'warning' : 'error'} 
                            sx={{ mb: 2 }}
                        >
                            {displayData.shiftInfo.status === 'incomplete' 
                                ? '⚠️ Dữ liệu ca chưa hoàn chỉnh - có thể chưa được cập nhật đầy đủ'
                                : '🚨 Ca bị gián đoạn - dữ liệu có thể không chính xác'
                            }
                        </Alert>
                    )}
                    
                    {/* Render data fields */}
                    <Grid container spacing={2}>
                        {Object.entries(config).map(([key, fieldConfig]) => {
                            const processedData = processCombinedData(displayData.data, { [key]: fieldConfig }, machine);
                            const value = processedData[key];
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
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {fieldConfig.title}
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {fieldConfig.type === 'status' && fieldConfig.values 
                                                    ? (
                                                        <Chip 
                                                            label={fieldConfig.values[value]?.label || 'Không xác định'}
                                                            color={fieldConfig.values[value]?.color || 'default'}
                                                            size="small"
                                                        />
                                                    )
                                                    : fieldConfig.type === 'combined'
                                                    ? value
                                                    : `${value || 0} ${fieldConfig.unit || ''}`
                                                }
                                            </Typography>
                                            
                                            {/* Debug info cho combined fields */}
                                            {fieldConfig.type === 'combined' && fieldConfig.calculation === 'high_low_32bit' && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Low: {displayData.data[fieldConfig.lowRegister] || 0}, High: {displayData.data[fieldConfig.highRegister] || 0}
                                                </Typography>
                                            )}
                                            
                                            {/* Range info */}
                                            {fieldConfig.range && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Phạm vi: {fieldConfig.range}
                                                </Typography>
                                            )}
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

                            {/* Instructions */}
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="caption">
                                    💡 <strong>Hướng dẫn:</strong> Click vào bất kỳ ca nào để xem dữ liệu chi tiết bên dưới
                                </Typography>
                            </Alert>
                            
                            {/* Filter component */}
                            {renderShiftFilter()}
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                📋 {filteredShifts.length} ca ({workShifts.length} tổng)
                                {selectedShiftData && (
                                    <Chip 
                                        label={`Đang xem: ${selectedShiftData.shiftId}`}
                                        size="small"
                                        color="primary"
                                        sx={{ ml: 1 }}
                                        onDelete={handleClearSelectedShift}
                                    />
                                )}
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
                                                    isSelected={selectedShiftData?._id === shift._id} 
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
                </Grid>

                {/* Monitoring Data - All users can view */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {renderUnifiedDataCard(
                        'monitoring', 
                        MONITORING_DATA_CONFIG, 
                        false
                    )}
                </Grid>

                {/* Admin Data - Only admin can view */}
                {isAdmin && (
                    <Grid size={{ xs: 12 }}>
                        {renderUnifiedDataCard(
                            'admin', 
                            ADMIN_DATA_CONFIG, 
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
                                    🔒 Dữ liệu phát triển
                                </Typography>
                                <Typography color="text.secondary">
                                    Chỉ quản trị viên mới có thể xem dữ liệu chi tiết này.
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
        </Container>
    );
};

export default MachineDetail;