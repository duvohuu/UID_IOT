import {
    PlayArrow as RunningIcon,
    Stop as StoppedIcon,
    Water as TankIcon,
    Grain as SaltIcon,
    Scale as WeightIcon,
    LocalDrink as BottleIcon,
    GpsFixed as TargetIcon,
    Memory as AnalogIcon,
    Calculate as GainIcon,
    Straighten as OffsetIcon,
    Speed as FrequencyIcon,
    Timer as TimerIcon,
    Tune as TuneIcon
} from '@mui/icons-material';

// Data monitoring - Hiển thị cho tất cả user (40001-40007)
export const MONITORING_DATA_CONFIG = {
    '40001': {
        title: 'Trạng thái hoạt động máy',
        icon: RunningIcon,
        type: 'status',
        values: {
            0: { label: 'Máy đang dừng', color: 'warning' },
            1: { label: 'Máy đang hoạt động', color: 'success' }
        }
    },
    '40002': {
        title: 'Trạng thái bồn cấp muối',
        icon: TankIcon,
        type: 'status',
        values: {
            0: { label: 'Chưa đầy', color: 'warning' },
            1: { label: 'Đã đầy', color: 'success' }
        }
    },
    '40003': {
        title: 'Loại muối đang chiết',
        icon: SaltIcon,
        type: 'status',
        values: {
            0: { label: 'Muối nhuyễn', color: 'info' },
            1: { label: 'Muối hạt', color: 'primary' }
        }
    },
    '40004': {
        title: 'Khối lượng cần chiết rót',
        icon: TargetIcon,
        type: 'numeric',
        unit: 'g',
        range: '0 - 1500'
    },
    '40005': {
        title: 'Tổng KL đã chiết (Low)',
        icon: WeightIcon,
        type: 'numeric',
        unit: 'g',
        range: '0 - 999999.9'
    },
    '40006': {
        title: 'Tổng KL đã chiết (High)', 
        icon: WeightIcon,
        type: 'numeric',
        unit: 'g'
    },
    '40007': {
        title: 'Tổng số chai đã chiết',
        icon: BottleIcon,
        type: 'numeric',
        unit: 'chai',
        range: '0 - 65535'
    }
};

// Data for developing - Chỉ admin mới xem được (40009-40048)
export const ADMIN_DATA_CONFIG = {
    // Loadcell analog values (40009-40011)
    '400012': {
        title: 'Loadcell 1 (Analog) (Low)',
        icon: AnalogIcon,
        type: 'numeric',
        unit: '',
        range: '0 - 2000'
    },
    '400013': {
        title: 'Loadcell 2 (Analog) (High)',
        icon: AnalogIcon,
        type: 'numeric',
        unit: '',
        range: '0 - 2000'
    },
    '40014': {
        title: 'Loadcell 2 (Analog) (Low)',
        icon: AnalogIcon,
        type: 'numeric',
        unit: '',
        range: '0 - 2000'
    },
    '40015': {
        title: 'Loadcell 4 (Analog)',
        icon: AnalogIcon,
        type: 'numeric',
        unit: '',
        range: '0 - 2000'
    },
    
    // Loadcell 1 Gain & Offset (40012-40015)
    '40012': {
        title: 'Gain Loadcell 1 (Low)',
        icon: GainIcon,
        type: 'numeric',
        unit: '',
        range: '0 - 9.9999'
    },
    '40013': {
        title: 'Gain Loadcell 1 (High)',
        icon: GainIcon,
        type: 'numeric',
        unit: ''
    },
    '40014': {
        title: 'Offset Loadcell 1 (Low)',
        icon: OffsetIcon,
        type: 'numeric',
        unit: '',
        range: '0 - 99.9999'
    },
    '40015': {
        title: 'Offset Loadcell 1 (High)',
        icon: OffsetIcon,
        type: 'numeric',
        unit: ''
    },
    
    // Loadcell 2 Gain & Offset (40016-40019)
    '40016': {
        title: 'Gain Loadcell 2 (Low)',
        icon: GainIcon,
        type: 'numeric',
        unit: '',
        range: '0 - 9.9999'
    },
    '40017': {
        title: 'Gain Loadcell 2 (High)',
        icon: GainIcon,
        type: 'numeric',
        unit: ''
    },
    '40018': {
        title: 'Offset Loadcell 2 (Low)',
        icon: OffsetIcon,
        type: 'numeric',
        unit: '',
        range: '0 - 99.9999'
    },
    '40019': {
        title: 'Offset Loadcell 2 (High)',
        icon: OffsetIcon,
        type: 'numeric',
        unit: ''
    },
    
    // Loadcell 3 Gain & Offset (40020-40023)
    '40020': {
        title: 'Gain Loadcell 3 (Low)',
        icon: GainIcon,
        type: 'numeric',
        unit: '',
        range: '0 - 9.9999'
    },
    '40021': {
        title: 'Gain Loadcell 3 (High)',
        icon: GainIcon,
        type: 'numeric',
        unit: ''
    },
    '40022': {
        title: 'Offset Loadcell 3 (Low)',
        icon: OffsetIcon,
        type: 'numeric',
        unit: '',
        range: '0 - 99.9999'
    },
    '40023': {
        title: 'Offset Loadcell 3 (High)',
        icon: OffsetIcon,
        type: 'numeric',
        unit: ''
    },
    
    // Loadcell 4 Gain & Offset (40024-40027)
    '40024': {
        title: 'Gain Loadcell 4 (Low)',
        icon: GainIcon,
        type: 'numeric',
        unit: '',
        range: '0 - 9.9999'
    },
    '40025': {
        title: 'Gain Loadcell 4 (High)',
        icon: GainIcon,
        type: 'numeric',
        unit: ''
    },
    '40026': {
        title: 'Offset Loadcell 4 (Low)',
        icon: OffsetIcon,
        type: 'numeric',
        unit: '',
        range: '0 - 99.9999'
    },
    '40027': {
        title: 'Offset Loadcell 4 (High)',
        icon: OffsetIcon,
        type: 'numeric',
        unit: ''
    },
    
    // Average filling time (40028-40029)
    '40028': {
        title: 'Thời gian chiết TB (Low)',
        icon: TimerIcon,
        type: 'numeric',
        unit: 's',
        range: '0 - 99.9'
    },
    '40029': {
        title: 'Thời gian chiết TB (High)',
        icon: TimerIcon,
        type: 'numeric',
        unit: 's'
    },
    
    // Stepper motor frequencies (40030-40033)
    '40030': {
        title: 'Tần số cao - Muối hạt',
        icon: FrequencyIcon,
        type: 'numeric',
        unit: 'Hz',
        range: '0 - 2000'
    },
    '40031': {
        title: 'Tần số thấp - Muối hạt',
        icon: FrequencyIcon,
        type: 'numeric',
        unit: 'Hz',
        range: '0 - 2000'
    },
    '40032': {
        title: 'Tần số cao - Muối nhuyễn',
        icon: FrequencyIcon,
        type: 'numeric',
        unit: 'Hz',
        range: '0 - 2000'
    },
    '40033': {
        title: 'Tần số thấp - Muối nhuyễn',
        icon: FrequencyIcon,
        type: 'numeric',
        unit: 'Hz',
        range: '0 - 2000'
    },
    
    // Motor control parameters (40034-40036)
    '40034': {
        title: 'Thời gian tăng/giảm tốc',
        icon: TuneIcon,
        type: 'numeric',
        unit: 'ms',
        range: '0 - 2000'
    },
    '40035': {
        title: 'Độ chênh lệch KL - Muối hạt',
        icon: TuneIcon,
        type: 'numeric',
        unit: 'g',
        range: '0 - 100'
    },
    '40036': {
        title: 'Độ chênh lệch KL - Muối nhuyễn',
        icon: TuneIcon,
        type: 'numeric',
        unit: 'g',
        range: '0 - 100'
    }
};