const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');

const prisma = new PrismaClient();

const DailyLogService = {
    /**
     * Generate CSV content from sensor data for a specific date and user
     */
    generateCSV(sensorData) {
        if (!sensorData || sensorData.length === 0) {
            return { csv: '', recordCount: 0 };
        }

        const headers = ['ID', 'Sensor ID', 'Tipe', 'Nilai', 'Satuan', 'Status', 'Interval (s)', 'Waktu'];

        // Group by sensor type category
        const groups = {
            humidity: [],
            air_temperature: [],
            water_temperature: [],
            other: []
        };

        sensorData.forEach((row) => {
            const sensorId = row.sensorId || '';
            if (sensorId.startsWith('RH') || sensorId.startsWith('H') || row.sensorType === 'humidity') {
                groups.humidity.push(row);
            } else if (sensorId.startsWith('T') && parseInt(sensorId.slice(1)) <= 7) {
                groups.air_temperature.push(row);
            } else if (sensorId.startsWith('T') && parseInt(sensorId.slice(1)) >= 8) {
                groups.water_temperature.push(row);
            } else {
                groups.other.push(row);
            }
        });

        const buildSection = (title, rows) => {
            if (rows.length === 0) return [];
            return [
                title,
                headers.join(','),
                ...rows.map(row => [
                    row.id,
                    row.sensorId,
                    row.sensorType,
                    row.value,
                    row.sensorType === 'humidity' ? '%' : '°C',
                    row.status,
                    row.intervalSeconds || 'N/A',
                    `"${new Date(row.timestamp).toLocaleString('id-ID')}"`
                ].join(',')),
                ''
            ];
        };

        const csvLines = [
            `Laporan Data Sensor - ${new Date(sensorData[0].timestamp).toLocaleDateString('id-ID')}`,
            '',
            ...buildSection('Kelembapan', groups.humidity),
            ...buildSection('Suhu Udara', groups.air_temperature),
            ...buildSection('Suhu Air', groups.water_temperature),
            ...buildSection('Lainnya', groups.other)
        ];

        return {
            csv: csvLines.join('\n'),
            recordCount: sensorData.length
        };
    },

    /**
     * Generate and save daily logs for all users who have data today
     */
    async generateDailyLogs(targetDate = null) {
        const date = targetDate || new Date();
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const dateOnly = startOfDay.toISOString().slice(0, 10); // YYYY-MM-DD

        console.log(`[DailyLog] Generating daily logs for ${dateOnly}...`);

        try {
            // Find all users who have sensor data for this day
            const usersWithData = await prisma.sensorData.findMany({
                where: {
                    timestamp: { gte: startOfDay, lte: endOfDay },
                    userId: { not: null }
                },
                select: { userId: true },
                distinct: ['userId']
            });

            // Also get data without userId (system/realtime data)
            const systemData = await prisma.sensorData.findMany({
                where: {
                    timestamp: { gte: startOfDay, lte: endOfDay },
                    userId: null
                },
                orderBy: { timestamp: 'asc' }
            });

            const results = [];

            // Generate CSV for each user
            for (const { userId } of usersWithData) {
                const userData = await prisma.sensorData.findMany({
                    where: {
                        timestamp: { gte: startOfDay, lte: endOfDay },
                        userId: userId
                    },
                    orderBy: { timestamp: 'asc' }
                });

                if (userData.length === 0) continue;

                // Get username
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { username: true }
                });

                const username = user?.username || `user_${userId}`;
                const { csv, recordCount } = this.generateCSV(userData);
                const fileName = `sensor_report_${username}_${dateOnly}.csv`;
                const fileSize = Buffer.byteLength(csv, 'utf-8');

                // Upsert (update if exists for same date+user)
                const log = await prisma.dailyLog.upsert({
                    where: {
                        date_userId: {
                            date: new Date(dateOnly),
                            userId: userId
                        }
                    },
                    update: {
                        csvContent: csv,
                        recordCount,
                        fileSize,
                        fileName,
                        userName: username
                    },
                    create: {
                        date: new Date(dateOnly),
                        userId,
                        userName: username,
                        fileName,
                        csvContent: csv,
                        recordCount,
                        fileSize
                    }
                });

                results.push(log);
                console.log(`[DailyLog] Saved log for user "${username}": ${recordCount} records, ${fileSize} bytes`);
            }

            // Generate CSV for system data (no user)
            if (systemData.length > 0) {
                const { csv, recordCount } = this.generateCSV(systemData);
                const fileName = `sensor_report_system_${dateOnly}.csv`;
                const fileSize = Buffer.byteLength(csv, 'utf-8');

                // Can't use upsert with null userId in unique constraint
                const existing = await prisma.dailyLog.findFirst({
                    where: {
                        date: new Date(dateOnly),
                        userId: null
                    }
                });

                let log;
                if (existing) {
                    log = await prisma.dailyLog.update({
                        where: { id: existing.id },
                        data: { csvContent: csv, recordCount, fileSize, fileName, userName: 'System' }
                    });
                } else {
                    log = await prisma.dailyLog.create({
                        data: {
                            date: new Date(dateOnly),
                            userId: null,
                            userName: 'System',
                            fileName,
                            csvContent: csv,
                            recordCount,
                            fileSize
                        }
                    });
                }

                results.push(log);
                console.log(`[DailyLog] Saved system log: ${recordCount} records, ${fileSize} bytes`);
            }

            console.log(`[DailyLog] Completed: ${results.length} logs generated for ${dateOnly}`);
            return { success: true, count: results.length, date: dateOnly };

        } catch (error) {
            console.error('[DailyLog] Error generating daily logs:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get all daily logs (without CSV content for listing)
     */
    async getAll() {
        return prisma.dailyLog.findMany({
            select: {
                id: true,
                date: true,
                userId: true,
                userName: true,
                fileName: true,
                recordCount: true,
                fileSize: true,
                createdAt: true
            },
            orderBy: [
                { date: 'desc' },
                { userName: 'asc' }
            ]
        });
    },

    /**
     * Get a single log by ID (with CSV content for download)
     */
    async getById(id) {
        return prisma.dailyLog.findUnique({
            where: { id: parseInt(id) }
        });
    },

    /**
     * Delete a log by ID
     */
    async deleteById(id) {
        return prisma.dailyLog.delete({
            where: { id: parseInt(id) }
        });
    },

    /**
     * Setup cron job to run daily at 23:59
     */
    setupCronJob() {
        // Run at 23:59 every day
        cron.schedule('59 23 * * *', async () => {
            console.log('[DailyLog] Cron triggered at 23:59');
            await this.generateDailyLogs();
        }, {
            timezone: 'Asia/Jakarta'
        });

        console.log('[DailyLog] Cron job scheduled: daily at 23:59 WIB');
    }
};

module.exports = DailyLogService;
