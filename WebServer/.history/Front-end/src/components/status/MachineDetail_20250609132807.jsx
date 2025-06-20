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
                sortBy: 'shiftId',     // ✅ Sort theo shiftId (backend sẽ sort theo machineNumber + shiftNumber)
                sortOrder: 'asc'       // ✅ ASC = shift nhỏ (S1) ở trên, shift lớn (S999) ở dưới
            });
            
            console.log('📥 Work shifts API result:', result);
            
            if (result.success && result.data?.shifts) {
                const shifts = result.data.shifts;
                
                // ✅ DEBUG: Log để verify sorting từ backend
                console.log('📋 Work shifts from backend (sorted by M_S):');
                shifts.forEach((shift, index) => {
                    console.log(`   ${index + 1}. ${shift.shiftId} (Machine: ${shift.machineNumber}, Shift: ${shift.shiftNumber})`);
                });
                
                setWorkShifts(shifts);
                
                // ✅ Apply filter (KHÔNG sort lại, giữ nguyên thứ tự từ backend)
                if (shiftFilter === 'all') {
                    setFilteredShifts(shifts); // ✅ Giữ nguyên thứ tự: shift nhỏ ở trên
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
        
        if (filterValue === 'all') {
            setFilteredShifts(workShifts);
        } else {
            const filtered = workShifts.filter(shift => shift.status === filterValue);
            setFilteredShifts(filtered);
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

    const renderUnifiedDataCard = (dataType, config, isAdminOnly = false) => {
        const displayData = getDisplayData(dataType);
        
        return (
            <Card sx={{ 
                mb: 2, 
                ...(displayData.isSelectedShift && {
                    border: 2, 
                    borderColor: 'primary.main'
                })
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
                            
                            {/* Status chip cho selected shift */}
                            {displayData.isSelectedShift && displayData.statusInfo && (
                                <Chip 
                                    label={displayData.statusInfo.label}
                                    color={displayData.statusInfo.color}
                                    size="small"
                                    icon={<span>{displayData.statusInfo.icon}</span>}
                                />
                            )}
                        </Box>
                        
                        {/* Clear button cho selected shift */}
                        {displayData.isSelectedShift && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CloseIcon />}
                                onClick={handleClearSelectedShift}
                                sx={{ minWidth: 'auto' }}
                            >
                                Quay về ca hiện tại
                            </Button>
                        )}
                    </Box>

                    {/* Thông tin cơ bản ca đã chọn - chỉ hiển thị cho monitoring data */}
                    {displayData.isSelectedShift && dataType === 'monitoring' && (
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
                                        {displayData.shiftInfo.endTime ? new Date(displayData.shiftInfo.endTime).toLocaleString('vi-VN') : 'Chưa kết thúc'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" color="text.secondary">Tổng chai sản xuất</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {displayData.shiftInfo.totalBottlesProduced || 0} chai
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

                    {/* Data reliability warning */}
                    {displayData.isSelectedShift && (displayData.shiftInfo.status === 'incomplete' || displayData.shiftInfo.status === 'interrupted') && (
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
                    {renderDataCard(
                        'Dữ liệu giám sát ca hiện tại', 
                        MONITORING_DATA_CONFIG, 
                        monitoringData,
                        false
                    )}

                    {/* ✅ THÊM: Selected Shift Data */}
                    {renderSelectedShiftData()}
                </Grid>

                {/* Admin Data - Only admin can view */}
                {isAdmin && (
                    <Grid size={{ xs: 12 }}>
                        {renderDataCard(
                            'Dữ liệu phát triển (Admin only)', 
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