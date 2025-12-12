const BackgroundLogger = require('../services/BackgroundLogger');

const LoggerController = {
    getStatus: (req, res) => {
        const status = BackgroundLogger.getStatus();
        res.json(status);
    },

    start: (req, res) => {
        const { enableHumidity, enableTemperature, enableWaterLevel } = req.body;

        // Configure sensor types if provided
        if (enableHumidity !== undefined || enableTemperature !== undefined || enableWaterLevel !== undefined) {
            BackgroundLogger.setSensorTypes(
                enableHumidity !== false,
                enableTemperature !== false,
                enableWaterLevel !== false
            );
        }

        BackgroundLogger.start();
        res.json({ message: 'Logger started', status: BackgroundLogger.getStatus() });
    },

    stop: (req, res) => {
        BackgroundLogger.stop();
        res.json({ message: 'Logger stopped', status: BackgroundLogger.getStatus() });
    },

    config: (req, res) => {
        const { interval, enableHumidity, enableTemperature, enableWaterLevel } = req.body;

        // Update interval if provided
        if (interval && typeof interval === 'number') {
            BackgroundLogger.setIntervalTime(interval);
        }

        // Update sensor types if provided
        if (enableHumidity !== undefined || enableTemperature !== undefined || enableWaterLevel !== undefined) {
            BackgroundLogger.setSensorTypes(
                enableHumidity !== false,
                enableTemperature !== false,
                enableWaterLevel !== false
            );
        }

        if (!interval && enableHumidity === undefined && enableTemperature === undefined && enableWaterLevel === undefined) {
            return res.status(400).json({ error: 'No valid configuration provided' });
        }

        res.json({ message: 'Logger configured', status: BackgroundLogger.getStatus() });
    }
};

module.exports = LoggerController;
