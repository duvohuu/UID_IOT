import { useState, useEffect, useCallback } from 'react';
import { getWorkShiftsByMachine } from '../api/workShiftAPI';

export const useWorkShifts = (machineId) => {
    const [workShifts, setWorkShifts] = useState([]);
    const [shiftsLoading, setShiftsLoading] = useState(false);
    const [shiftFilter, setShiftFilter] = useState('all');
    const [filteredShifts, setFilteredShifts] = useState([]);
    const [selectedShiftData, setSelectedShiftData] = useState(null);
    const [userHasSelectedShift, setUserHasSelectedShift] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const autoSelectDefaultShift = useCallback((shifts) => {
        if (!shifts || shifts.length === 0) {
            setSelectedShiftData(null);
            setUserHasSelectedShift(false);
            return;
        }

        const currentShiftExists = selectedShiftData && 
            shifts.some(shift => shift._id === selectedShiftData._id);

        if (isFirstLoad || (!userHasSelectedShift && !selectedShiftData) || !currentShiftExists) {
            let defaultShift = null;

            // Tìm ca đang hoạt động
            const activeShift = shifts.find(shift => shift.status === 'active');
            if (activeShift) {
                defaultShift = activeShift;
                console.log('🎯 Auto-selected ACTIVE shift:', activeShift.shiftId);
            } else {
                // Tìm ca mới nhất (ID cao nhất)
                const sortedShifts = [...shifts].sort((a, b) => {
                    return b.shiftId.localeCompare(a.shiftId);
                });
                defaultShift = sortedShifts[0];
                console.log('🎯 Auto-selected LATEST shift:', defaultShift?.shiftId);
            }

            if (defaultShift) {
                setSelectedShiftData(defaultShift);
                if (isFirstLoad) {
                    setIsFirstLoad(false);
                }
            }
        } else {
            console.log('👤 User has selected shift, keeping current selection:', selectedShiftData?.shiftId);
        }
    }, [selectedShiftData, userHasSelectedShift, isFirstLoad]);

    const fetchWorkShifts = useCallback(async (machineId) => {
        try {
            setShiftsLoading(true);
            console.log('🔄 Fetching work shifts for machine:', machineId);
            
            const result = await getWorkShiftsByMachine(machineId, {
                limit: 50,
                page: 1,
                sortBy: 'shiftId',
                sortOrder: 'desc'  
            });
            
            if (result.success && result.data?.shifts) {
                const shifts = result.data.shifts;
                console.log(`📊 Fetched ${shifts.length} shifts`);
                
                setWorkShifts(shifts);
            } else {
                console.warn('No shifts data received');
                setWorkShifts([]);
                setSelectedShiftData(null);
            }
        } catch (error) {
            console.error('❌ Error fetching work shifts:', error);
            setWorkShifts([]);
            setSelectedShiftData(null);
        } finally {
            setShiftsLoading(false);
        }
    }, []);

    const handleShiftClick = useCallback((shift) => {
        console.log('👤 User manually selected shift:', shift.shiftId);
        setSelectedShiftData(shift);
        setUserHasSelectedShift(true);
        setIsFirstLoad(false);
    }, []);

    const handleClearSelectedShift = useCallback(() => {
        console.log('🗑️ User cleared shift selection');
        setSelectedShiftData(null);
        setUserHasSelectedShift(false);
    
        if (workShifts && workShifts.length > 0) {
            setTimeout(() => {
                autoSelectDefaultShift(workShifts);
            }, 100);
        }
    }, [workShifts, autoSelectDefaultShift]);

    const handleRefreshShifts = useCallback(() => {
        if (machineId) {
            fetchWorkShifts(machineId);
        }
    }, [machineId, fetchWorkShifts]);

    // Filter shifts based on current filter
    useEffect(() => {
        let filtered;
        if (shiftFilter === 'all') {
            filtered = workShifts;
        } else {
            filtered = workShifts.filter(shift => shift.status === shiftFilter);
        }
        setFilteredShifts(filtered);
    }, [workShifts, shiftFilter]);

    // Auto-fetch shifts when machineId changes
    useEffect(() => {
        if (machineId) {
            console.log('🔄 Auto-fetch work shifts for machineId:', machineId);
            fetchWorkShifts(machineId);
        }
    }, [machineId, fetchWorkShifts]);

    // Auto-select default shift when shifts are loaded
    useEffect(() => {
        if (workShifts && workShifts.length > 0 && !userHasSelectedShift) {
            autoSelectDefaultShift(workShifts);
        }
    }, [workShifts, userHasSelectedShift, autoSelectDefaultShift]);

    return {
        workShifts,
        selectedShiftData,
        setSelectedShiftData,
        shiftsLoading,
        shiftFilter,
        setShiftFilter,
        filteredShifts,
        userHasSelectedShift,
        setUserHasSelectedShift,
        handleRefreshShifts,
        handleShiftClick,
        handleClearSelectedShift
    };
};