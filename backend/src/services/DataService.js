// Data Service - Connected to MySQL Database with Auto-Fallback
const mockDataStore = require('./MockDataStore');
const { Op } = require('sequelize');
const { shouldUseMockData, isProduction } = require('../config/database');

// Dynamic check for mock data usage
const useMockData = () => shouldUseMockData();

const DataService = {
    async getAllData(limit = 100) {
        const USE_MOCK_DATA = useMockData();
        console.log('[DataService] getAllData called with limit:', limit, '| Using mock:', USE_MOCK_DATA);

        if (USE_MOCK_DATA) {
            return await mockDataStore.findAll({
                order: [['timestamp', 'DESC']],
                limit: parseInt(limit)
            });
        }

        const SensorData = require('../models/SensorData');
        return await SensorData.findAll({
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit)
        });
    },

    async getDataBySensorId(sensorId, limit = 100) {
        const USE_MOCK_DATA = useMockData();
        console.log('[DataService] getDataBySensorId called:', sensorId, '| Using mock:', USE_MOCK_DATA);

        if (USE_MOCK_DATA) {
            return await mockDataStore.findAll({
                where: { sensor_id: sensorId },
                order: [['timestamp', 'DESC']],
                limit: parseInt(limit)
            });
        }

        const SensorData = require('../models/SensorData');
        return await SensorData.findAll({
            where: { sensor_id: sensorId },
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit)
        });
    },

    async getDataBySensorType(sensorType, limit = 100) {
        const USE_MOCK_DATA = useMockData();
        console.log('[DataService] getDataBySensorType called:', sensorType, '| Using mock:', USE_MOCK_DATA);

        if (USE_MOCK_DATA) {
            return await mockDataStore.findAll({
                where: { sensor_type: sensorType },
                order: [['timestamp', 'DESC']],
                limit: parseInt(limit)
            });
        }

        const SensorData = require('../models/SensorData');
        return await SensorData.findAll({
            where: { sensor_type: sensorType },
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit)
        });
    },

    async getDataByDateRange(startDate, endDate) {
        const USE_MOCK_DATA = useMockData();
        console.log('[DataService] getDataByDateRange called | Using mock:', USE_MOCK_DATA);

        if (USE_MOCK_DATA) {
            const allData = await mockDataStore.findAll({
                order: [['timestamp', 'DESC']]
            });

            return allData.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
            });
        }

        const SensorData = require('../models/SensorData');
        return await SensorData.findAll({
            where: {
                timestamp: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['timestamp', 'DESC']]
        });
    },

    async createData(sensorData) {
        const USE_MOCK_DATA = useMockData();
        console.log('[DataService] createData called:', sensorData.sensor_id, '| Using mock:', USE_MOCK_DATA);

        if (USE_MOCK_DATA) {
            return await mockDataStore.create(sensorData);
        }

        const SensorData = require('../models/SensorData');
        return await SensorData.create(sensorData);
    },

    async deleteData(id) {
        const USE_MOCK_DATA = useMockData();
        console.log('[DataService] deleteData called for ID:', id, '| Using mock:', USE_MOCK_DATA);

        if (USE_MOCK_DATA) {
            return await mockDataStore.destroy({
                where: { id: parseInt(id) }
            });
        }

        const SensorData = require('../models/SensorData');
        return await SensorData.destroy({
            where: { id: id }
        });
    },

    async deleteAllData() {
        const USE_MOCK_DATA = useMockData();
        console.log('[DataService] deleteAllData called | Using mock:', USE_MOCK_DATA);

        if (USE_MOCK_DATA) {
            return await mockDataStore.destroy({
                where: {},
                truncate: true
            });
        }

        const SensorData = require('../models/SensorData');
        return await SensorData.destroy({
            where: {},
            truncate: true
        });
    },

    async deleteDataBySensorId(sensorId) {
        const USE_MOCK_DATA = useMockData();
        console.log('[DataService] deleteDataBySensorId called with ID:', sensorId, '| Using mock:', USE_MOCK_DATA);

        if (USE_MOCK_DATA) {
            try {
                const deleted = await mockDataStore.destroy({
                    where: { sensor_id: sensorId }
                });
                console.log(`[DataService] Successfully deleted ${deleted} records for sensor ${sensorId}`);
                return deleted;
            } catch (error) {
                console.error('[DataService] Error in deleteDataBySensorId:', error);
                throw error;
            }
        }

        const SensorData = require('../models/SensorData');
        try {
            const deleted = await SensorData.destroy({
                where: { sensor_id: sensorId }
            });
            console.log(`[DataService] Successfully deleted ${deleted} records for sensor ${sensorId}`);
            return deleted;
        } catch (error) {
            console.error('[DataService] Error in deleteDataBySensorId:', error);
            throw error;
        }
    },

    async deleteDataBySensorType(sensorType) {
        const USE_MOCK_DATA = useMockData();
        console.log('[DataService] deleteDataBySensorType called with type:', sensorType, '| Using mock:', USE_MOCK_DATA);

        if (USE_MOCK_DATA) {
            try {
                const deleted = await mockDataStore.destroy({
                    where: { sensor_type: sensorType }
                });
                console.log(`[DataService] Successfully deleted ${deleted} records for type ${sensorType}`);
                return deleted;
            } catch (error) {
                console.error('[DataService] Error in deleteDataBySensorType:', error);
                throw error;
            }
        }

        const SensorData = require('../models/SensorData');
        try {
            const deleted = await SensorData.destroy({
                where: { sensor_type: sensorType }
            });
            console.log(`[DataService] Successfully deleted ${deleted} records for type ${sensorType}`);
            return deleted;
        } catch (error) {
            console.error('[DataService] Error in deleteDataBySensorType:', error);
            throw error;
        }
    },

    async deleteDataByInterval(intervalSeconds) {
        const USE_MOCK_DATA = useMockData();
        console.log('[DataService] deleteDataByInterval called with interval:', intervalSeconds, '| Using mock:', USE_MOCK_DATA);

        if (USE_MOCK_DATA) {
            const deleted = await mockDataStore.destroy({
                where: { interval: parseInt(intervalSeconds) }
            });
            console.log(`[DataService] Successfully deleted ${deleted} records for interval ${intervalSeconds}s`);
            return deleted;
        }

        const SensorData = require('../models/SensorData');
        try {
            const deleted = await SensorData.destroy({
                where: { interval: intervalSeconds }
            });
            console.log(`[DataService] Successfully deleted ${deleted} records for interval ${intervalSeconds}s`);
            return deleted;
        } catch (error) {
            console.error('[DataService] Error in deleteDataByInterval:', error);
            throw error;
        }
    },

    // Get mock data statistics
    async getStats() {
        const USE_MOCK_DATA = useMockData();
        if (USE_MOCK_DATA) {
            return mockDataStore.getStats();
        }
        return null;
    },

    // Get database status and warnings
    async getDatabaseStatus() {
        const USE_MOCK_DATA = useMockData();
        console.log('[DataService] getDatabaseStatus called | Using mock:', USE_MOCK_DATA);

        if (USE_MOCK_DATA) {
            const stats = mockDataStore.getStats();
            const totalRecords = stats.totalRecords;

            return {
                total_records: totalRecords,
                table_size_mb: 0,
                database_size_mb: 0,
                status: totalRecords >= 500000 ? 'CRITICAL' : totalRecords >= 100000 ? 'WARNING' : 'OK',
                message: totalRecords >= 500000
                    ? `Database hampir penuh! ${totalRecords} records. Segera hapus data lama.`
                    : totalRecords >= 100000
                        ? `Perhatian: Database mencapai ${totalRecords} records. Pertimbangkan untuk menghapus data lama.`
                        : 'Database dalam kondisi normal',
                warning_threshold: 100000,
                critical_threshold: 500000,
                using_mock_data: true
            };
        }

        const sequelize = require('../config/database');
        try {
            const [results] = await sequelize.query('CALL check_database_status()');

            if (results && results.length > 0) {
                const status = results[0];
                return {
                    total_records: status.total_records,
                    table_size_mb: parseFloat(status.table_size_mb),
                    database_size_mb: parseFloat(status.database_size_mb),
                    status: status.status,
                    message: status.message,
                    warning_threshold: status.warning_threshold,
                    critical_threshold: status.critical_threshold,
                    using_mock_data: false
                };
            }
            throw new Error('No results from SP');
        } catch (error) {
            console.warn('[DataService] Stored Procedure failed, falling back to manual query:', error.message);

            try {
                const SensorData = require('../models/SensorData');
                const count = await SensorData.count();
                const warningLimit = 100000;
                const criticalLimit = 500000;

                let status = 'OK';
                let message = 'Database status normal (Fallback Mode)';

                if (count >= criticalLimit) {
                    status = 'CRITICAL';
                    message = `Database CRITICAL! Total records: ${count}.`;
                } else if (count >= warningLimit) {
                    status = 'WARNING';
                    message = `Database Warning. Total records: ${count}.`;
                }

                return {
                    total_records: count,
                    table_size_mb: 0,
                    database_size_mb: 0,
                    status: status,
                    message: message,
                    warning_threshold: warningLimit,
                    critical_threshold: criticalLimit,
                    using_mock_data: false,
                    fallback_mode: true
                };
            } catch (fallbackError) {
                console.error('[DataService] Fallback also failed:', fallbackError);
                throw fallbackError;
            }
        }
    }
};

module.exports = DataService;
