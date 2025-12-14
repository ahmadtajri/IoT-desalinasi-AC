const BackgroundLogger = require('../services/BackgroundLogger');

const LoggerController = {
    getStatus: (req, res) => {
        const status = BackgroundLogger.getStatus();
        res.json(status);
    },

    start: (req, res) => {
        const { humidity, temperature, waterLevel } = req.body;

        // Configure specific sensors if provided
        // Values can be: true/'all', false/'none', or specific sensor ID like 'H1', 'T5'
        const sensorConfig = {
            humidity: humidity !== undefined ? humidity : 'all',
            temperature: temperature !== undefined ? temperature : 'all',
            waterLevel: waterLevel !== undefined ? waterLevel : 'all'
        };

        BackgroundLogger.setSensorConfig(sensorConfig);
        BackgroundLogger.start();
        res.json({ message: 'Logger started', status: BackgroundLogger.getStatus() });
    },

    stop: (req, res) => {
        BackgroundLogger.stop();
        res.json({ message: 'Logger stopped', status: BackgroundLogger.getStatus() });
    },

    config: (req, res) => {
        const { interval, humidity, temperature, waterLevel } = req.body;

        // Update interval if provided
        if (interval && typeof interval === 'number') {
            BackgroundLogger.setIntervalTime(interval);
        }

        // Update sensor config if any sensor parameter is provided
        if (humidity !== undefined || temperature !== undefined || waterLevel !== undefined) {
            const sensorConfig = {};
            if (humidity !== undefined) sensorConfig.humidity = humidity;
            if (temperature !== undefined) sensorConfig.temperature = temperature;
            if (waterLevel !== undefined) sensorConfig.waterLevel = waterLevel;

            BackgroundLogger.setSensorConfig(sensorConfig);
        }

        if (!interval && humidity === undefined && temperature === undefined && waterLevel === undefined) {
            return res.status(400).json({ error: 'No valid configuration provided' });
        }

        res.json({ message: 'Logger configured', status: BackgroundLogger.getStatus() });
    }
};

module.exports = LoggerController;
