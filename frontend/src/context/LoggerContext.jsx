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
        temperature: {},
        waterLevel: {}
    },
    sensorStatus: {
        humidity: {},
        temperature: {},
        waterLevel: {}
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
        temperature: {},
        waterLevel: {}
    });

    // Sensor Status - Track which sensors are active/inactive
    // true = active (receiving data), false = inactive (no data/error)
    const [sensorStatus, setSensorStatus] = useState({
        humidity: {},
        temperature: {},
        waterLevel: {}
    });

    // Last update timestamps for detecting inactive sensors
    const lastUpdateRef = useRef({
        humidity: {},
        temperature: {},
        waterLevel: {}
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

            // Generate Humidity sensors H1-H7
            // Simulate: H1-H4 always active, H5-H7 randomly active/inactive
            const humidity = {};
            const humidityStatus = {};

            for (let i = 1; i <= 7; i++) {
                const key = `H${i}`;
                // H1-H4 always active, H5-H7 have 70% chance of being active
                const isActive = i <= 4 ? true : Math.random() > 0.3;

                humidityStatus[key] = isActive;

                if (isActive) {
                    humidity[key] = parseFloat((50 + Math.random() * 40).toFixed(1));
                    lastUpdateRef.current.humidity[key] = now;
                } else {
                    // Return null or last known value for inactive sensors
                    humidity[key] = null;
                }
            }

            // Generate Temperature sensors T1-T15
            // Simulate: T1-T8 always active, T9-T15 randomly active/inactive
            const temperature = {};
            const temperatureStatus = {};

            for (let i = 1; i <= 15; i++) {
                const key = `T${i}`;
                // T1-T8 always active, T9-T15 have 60% chance of being active
                const isActive = i <= 8 ? true : Math.random() > 0.4;

                temperatureStatus[key] = isActive;

                if (isActive) {
                    // Max 70 degrees
                    temperature[key] = parseFloat((20 + Math.random() * 50).toFixed(1)); // 20-70°C
                    lastUpdateRef.current.temperature[key] = now;
                } else {
                    temperature[key] = null;
                }
            }

            // Generate Water Level sensor WL1
            const waterLevel = {};
            const waterLevelStatus = {};
            const wlKey = 'WL1';
            const isWlActive = true; // Always active for now

            waterLevelStatus[wlKey] = isWlActive;
            if (isWlActive) {
                waterLevel[wlKey] = parseFloat((10 + Math.random() * 90).toFixed(1)); // 10-100%
                lastUpdateRef.current.waterLevel[wlKey] = now;
            } else {
                waterLevel[wlKey] = null;
            }

            setRealtimeData({ humidity, temperature, waterLevel });
            setSensorStatus({ humidity: humidityStatus, temperature: temperatureStatus, waterLevel: waterLevelStatus });
        };

        generateData();
        const intervalId = setInterval(generateData, 1000);
        return () => clearInterval(intervalId);
    }, []);

    // 3. CONTROLS (Call Backend APIs)
    const toggleLogging = async (sensorConfig = null) => {
        try {
            if (isLogging) {
                await sensorService.stopLogger();
                setIsLogging(false);
            } else {
                // Configure with specific sensors if provided
                // Values can be: 'all', 'none', or specific sensor ID like 'H1'
                const config = sensorConfig || {
                    humidity: 'all',
                    temperature: 'all',
                    waterLevel: 'all'
                };
                console.log('[LoggerContext] Starting logger with config:', config);
                await sensorService.configLogger(logInterval, config);
                await sensorService.startLogger(config);
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
