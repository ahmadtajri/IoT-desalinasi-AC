const DataService = require('./DataService');

class BackgroundLogger {
    constructor() {
        this.isLogging = false;
        this.interval = 5000; // Default 5 seconds
        this.timer = null;
        this.logCount = 0;

        // Sensor configuration - which sensors to log
        this.sensorConfig = {
            humidity: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7'],
            temperature: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15'],
            waterLevel: ['WL1']
        };

        // Which sensor types to record (set by frontend filter)
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
        console.log(`[BackgroundLogger] Recording sensors: Humidity=${this.enabledSensorTypes.humidity}, Temperature=${this.enabledSensorTypes.temperature}, WaterLevel=${this.enabledSensorTypes.waterLevel}`);

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

    // Configure which sensor types to record
    setSensorTypes(humidity = true, temperature = true, waterLevel = true) {
        this.enabledSensorTypes = { humidity, temperature, waterLevel };
        console.log(`[BackgroundLogger] Sensor types updated: H=${humidity}, T=${temperature}, WL=${waterLevel}`);
    }

    getStatus() {
        return {
            isLogging: this.isLogging,
            interval: this.interval,
            logCount: this.logCount,
            enabledSensorTypes: this.enabledSensorTypes
        };
    }

    async runCycle() {
        try {
            const intervalSeconds = Math.floor(this.interval / 1000);
            let recordsCreated = 0;

            // Log Humidity Sensors (H1-H7)
            if (this.enabledSensorTypes.humidity) {
                for (const sensorId of this.sensorConfig.humidity) {
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

            // Log Temperature Sensors (T1-T15)
            if (this.enabledSensorTypes.temperature) {
                for (const sensorId of this.sensorConfig.temperature) {
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

            // Log Water Level Sensor (WL1)
            if (this.enabledSensorTypes.waterLevel) {
                const sensorData = {
                    sensor_id: 'WL1',
                    sensor_type: 'waterLevel',
                    value: parseFloat((10 + Math.random() * 90).toFixed(1)), // 10-100%
                    unit: '%',
                    status: 'active',
                    interval: intervalSeconds
                };
                await DataService.createData(sensorData);
                recordsCreated++;
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
