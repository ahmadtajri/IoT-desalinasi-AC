const DataService = require('./DataService');

class BackgroundLogger {
    constructor() {
        this.isLogging = false;
        this.interval = 5000; // Default 5 seconds
        this.timer = null;
        this.logCount = 0;

        // Default sensor configuration - which sensors to log
        this.allSensors = {
            humidity: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7'],
            temperature: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15'],
            waterLevel: ['WL1']
        };

        // Active sensors to record (can be specific sensors or 'all')
        this.activeSensors = {
            humidity: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7'], // Default: all
            temperature: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15'],
            waterLevel: ['WL1']
        };

        // Which sensor types are enabled
        this.enabledSensorTypes = {
            humidity: true,
            temperature: true,
            waterLevel: true
        };
    }

    start() {
        if (this.isLogging) {
            console.log('[BackgroundLogger] Already running.');
            return;
        }

        this.isLogging = true;
        this.logCount = 0;
        console.log(`[BackgroundLogger] Started with interval ${this.interval}ms`);
        console.log(`[BackgroundLogger] Active Humidity Sensors: ${this.activeSensors.humidity.join(', ') || 'NONE'}`);
        console.log(`[BackgroundLogger] Active Temperature Sensors: ${this.activeSensors.temperature.join(', ') || 'NONE'}`);
        console.log(`[BackgroundLogger] Active Water Level Sensors: ${this.activeSensors.waterLevel.join(', ') || 'NONE'}`);

        this.timer = setInterval(() => this.runCycle(), this.interval);
    }

    stop() {
        if (!this.isLogging) return;

        this.isLogging = false;
        clearInterval(this.timer);
        this.timer = null;
        console.log('[BackgroundLogger] Stopped.');
    }

    setIntervalTime(ms) {
        this.interval = ms;
        if (this.isLogging) {
            clearInterval(this.timer);
            this.timer = setInterval(() => this.runCycle(), this.interval);
            console.log(`[BackgroundLogger] Interval updated to ${this.interval}ms`);
        }
    }

    // Configure which sensors to record
    // sensorConfig format: { humidity: 'all'|'none'|'H1', temperature: 'all'|'none'|'T5', waterLevel: 'all'|'none'|'WL1' }
    setSensorConfig(sensorConfig) {
        console.log('[BackgroundLogger] Configuring sensors:', sensorConfig);

        // Process humidity
        if (sensorConfig.humidity === 'none' || sensorConfig.humidity === false) {
            this.enabledSensorTypes.humidity = false;
            this.activeSensors.humidity = [];
        } else if (sensorConfig.humidity === 'all' || sensorConfig.humidity === true) {
            this.enabledSensorTypes.humidity = true;
            this.activeSensors.humidity = [...this.allSensors.humidity];
        } else if (typeof sensorConfig.humidity === 'string') {
            // Specific sensor like 'H1'
            this.enabledSensorTypes.humidity = true;
            this.activeSensors.humidity = [sensorConfig.humidity];
        }

        // Process temperature
        if (sensorConfig.temperature === 'none' || sensorConfig.temperature === false) {
            this.enabledSensorTypes.temperature = false;
            this.activeSensors.temperature = [];
        } else if (sensorConfig.temperature === 'all' || sensorConfig.temperature === true) {
            this.enabledSensorTypes.temperature = true;
            this.activeSensors.temperature = [...this.allSensors.temperature];
        } else if (typeof sensorConfig.temperature === 'string') {
            // Specific sensor like 'T5'
            this.enabledSensorTypes.temperature = true;
            this.activeSensors.temperature = [sensorConfig.temperature];
        }

        // Process water level
        if (sensorConfig.waterLevel === 'none' || sensorConfig.waterLevel === false) {
            this.enabledSensorTypes.waterLevel = false;
            this.activeSensors.waterLevel = [];
        } else if (sensorConfig.waterLevel === 'all' || sensorConfig.waterLevel === true) {
            this.enabledSensorTypes.waterLevel = true;
            this.activeSensors.waterLevel = [...this.allSensors.waterLevel];
        } else if (typeof sensorConfig.waterLevel === 'string') {
            // Specific sensor like 'WL1'
            this.enabledSensorTypes.waterLevel = true;
            this.activeSensors.waterLevel = [sensorConfig.waterLevel];
        }

        console.log(`[BackgroundLogger] Updated - H: [${this.activeSensors.humidity.join(',')}], T: [${this.activeSensors.temperature.join(',')}], WL: [${this.activeSensors.waterLevel.join(',')}]`);
    }

    // Legacy method for backwards compatibility
    setSensorTypes(humidity = true, temperature = true, waterLevel = true) {
        this.setSensorConfig({
            humidity: humidity ? 'all' : 'none',
            temperature: temperature ? 'all' : 'none',
            waterLevel: waterLevel ? 'all' : 'none'
        });
    }

    getStatus() {
        return {
            isLogging: this.isLogging,
            interval: this.interval,
            logCount: this.logCount,
            enabledSensorTypes: this.enabledSensorTypes,
            activeSensors: this.activeSensors
        };
    }

    async runCycle() {
        try {
            const intervalSeconds = Math.floor(this.interval / 1000);
            let recordsCreated = 0;

            // Log Humidity Sensors (only active ones)
            if (this.enabledSensorTypes.humidity && this.activeSensors.humidity.length > 0) {
                for (const sensorId of this.activeSensors.humidity) {
                    // Simulate: H1-H4 always active, H5-H7 70% chance active
                    const sensorNum = parseInt(sensorId.substring(1));
                    const isActive = sensorNum <= 4 ? true : Math.random() > 0.3;

                    if (isActive) {
                        const sensorData = {
                            sensor_id: sensorId,
                            sensor_type: 'humidity',
                            value: parseFloat((50 + Math.random() * 40).toFixed(1)), // 50-90%
                            unit: '%',
                            status: 'active',
                            interval: intervalSeconds
                        };
                        await DataService.createData(sensorData);
                        recordsCreated++;
                    }
                }
            }

            // Log Temperature Sensors (only active ones)
            if (this.enabledSensorTypes.temperature && this.activeSensors.temperature.length > 0) {
                for (const sensorId of this.activeSensors.temperature) {
                    // Simulate: T1-T8 always active, T9-T15 60% chance active
                    const sensorNum = parseInt(sensorId.substring(1));
                    const isActive = sensorNum <= 8 ? true : Math.random() > 0.4;

                    if (isActive) {
                        const sensorData = {
                            sensor_id: sensorId,
                            sensor_type: 'temperature',
                            value: parseFloat((20 + Math.random() * 50).toFixed(1)), // 20-70°C
                            unit: '°C',
                            status: 'active',
                            interval: intervalSeconds
                        };
                        await DataService.createData(sensorData);
                        recordsCreated++;
                    }
                }
            }

            // Log Water Level Sensor (only if active)
            if (this.enabledSensorTypes.waterLevel && this.activeSensors.waterLevel.length > 0) {
                for (const sensorId of this.activeSensors.waterLevel) {
                    const sensorData = {
                        sensor_id: sensorId,
                        sensor_type: 'waterLevel',
                        value: parseFloat((10 + Math.random() * 90).toFixed(1)), // 10-100%
                        unit: '%',
                        status: 'active',
                        interval: intervalSeconds
                    };
                    await DataService.createData(sensorData);
                    recordsCreated++;
                }
            }

            this.logCount++;
            console.log(`[BackgroundLogger] Cycle #${this.logCount} completed. ${recordsCreated} records saved.`);
        } catch (error) {
            console.error('[BackgroundLogger] Error in logging cycle:', error);
        }
    }
}

// Singleton instance
const loggerInstance = new BackgroundLogger();
module.exports = loggerInstance;
