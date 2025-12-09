import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import sensorService from '../services/sensorService';

const LoggerContext = createContext({
    isLogging: false,
    toggleLogging: () => { },
    logInterval: 5000,
    changeInterval: () => { },
    logCount: 0,
    isRealtimeOnly: true,
    realtimeData: {
        humidity: {},
        temperature: {}
    },
    sensorStatus: {
        humidity: {},
        temperature: {}
    }
});

export const useLogger = () => useContext(LoggerContext);

export const LoggerProvider = ({ children }) => {
    // Logger State (Sync with Backend)
    const [isLogging, setIsLogging] = useState(false);
    const [logInterval, setLogInterval] = useState(5000);
    const [logCount, setLogCount] = useState(0);

    // Dashboard Data State - NEW STRUCTURE
    const [realtimeData, setRealtimeData] = useState({
        humidity: {},
        temperature: {}
    });

    // Sensor Status - Track which sensors are active/inactive
    // true = active (receiving data), false = inactive (no data/error)
    const [sensorStatus, setSensorStatus] = useState({
        humidity: {
            H1: true, H2: true, H3: true, H4: false, H5: false, H6: false
        },
        temperature: {
            T1: true, T2: true, T3: true, T4: true,
            T5: false, T6: false, T7: false, T8: false,
            T9: false, T10: false, T11: false, T12: false
        }
    });

    // Last update timestamps for detecting inactive sensors
    const lastUpdateRef = useRef({
        humidity: {},
        temperature: {}
    });

    // 1. SYNC STATUS WITH BACKEND ON MOUNT & PERIODICALLY
    const syncStatus = async () => {
        try {
            const status = await sensorService.getLoggerStatus();
            setIsLogging(status.isLogging);
            if (status.isLogging) {
                setLogInterval(status.interval);
                setLogCount(status.logCount);
            }
        } catch (error) {
            console.error("Failed to sync logger status:", error);
        }
    };

    useEffect(() => {
        syncStatus();
        const intervalId = setInterval(syncStatus, 5000);
        return () => clearInterval(intervalId);
    }, []);

    // 2. REALTIME DATA GENERATOR (Runs every 1 second in Frontend)
    // Simulates sensor data - some sensors are active, some are inactive
    useEffect(() => {
        const generateData = () => {
            const now = Date.now();

            // Generate Humidity sensors H1-H6
            // Simulate: H1-H3 always active, H4-H6 randomly active/inactive
            const humidity = {};
            const humidityStatus = {};

            for (let i = 1; i <= 6; i++) {
                const key = `H${i}`;
                // H1-H3 always active, H4-H6 have 70% chance of being active
                const isActive = i <= 3 ? true : Math.random() > 0.3;

                humidityStatus[key] = isActive;

                if (isActive) {
                    humidity[key] = parseFloat((50 + Math.random() * 40).toFixed(1));
                    lastUpdateRef.current.humidity[key] = now;
                } else {
                    // Return null or last known value for inactive sensors
                    humidity[key] = null;
                }
            }

            // Generate Temperature sensors T1-T12
            // Simulate: T1-T4 always active, T5-T12 randomly active/inactive
            const temperature = {};
            const temperatureStatus = {};

            for (let i = 1; i <= 12; i++) {
                const key = `T${i}`;
                // T1-T4 always active, T5-T12 have 60% chance of being active
                const isActive = i <= 4 ? true : Math.random() > 0.4;

                temperatureStatus[key] = isActive;

                if (isActive) {
                    temperature[key] = parseFloat((20 + Math.random() * 130).toFixed(1)); // 20-150°C
                    lastUpdateRef.current.temperature[key] = now;
                } else {
                    temperature[key] = null;
                }
            }

            setRealtimeData({ humidity, temperature });
            setSensorStatus({ humidity: humidityStatus, temperature: temperatureStatus });
        };

        generateData();
        const intervalId = setInterval(generateData, 1000);
        return () => clearInterval(intervalId);
    }, []);

    // 3. CONTROLS (Call Backend APIs)
    const toggleLogging = async () => {
        try {
            if (isLogging) {
                await sensorService.stopLogger();
                setIsLogging(false);
            } else {
                await sensorService.configLogger(logInterval);
                await sensorService.startLogger();
                setIsLogging(true);
                setLogCount(0);
            }
            syncStatus();
        } catch (error) {
            console.error("Error toggling logger:", error);
            alert("Gagal menghubungi server backend. Pastikan server berjalan.");
        }
    };

    const changeInterval = async (newInterval) => {
        try {
            setLogInterval(newInterval);
            if (isLogging) {
                await sensorService.configLogger(newInterval);
            }
        } catch (error) {
            console.error("Error updating interval:", error);
        }
    };

    return (
        <LoggerContext.Provider value={{
            isLogging,
            toggleLogging,
            logInterval,
            changeInterval,
            logCount,
            realtimeData,
            sensorStatus
        }}>
            {children}
        </LoggerContext.Provider>
    );
};
