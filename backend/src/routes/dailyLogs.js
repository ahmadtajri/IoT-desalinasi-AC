const express = require('express');
const router = express.Router();
const DailyLogController = require('../controllers/DailyLogController');

// GET /api/daily-logs - List all daily logs
router.get('/', DailyLogController.getAll);

// GET /api/daily-logs/:id/download - Download CSV
router.get('/:id/download', DailyLogController.download);

// POST /api/daily-logs/generate - Manual trigger (admin only)
router.post('/generate', DailyLogController.triggerManual);

// DELETE /api/daily-logs/:id - Delete a log
router.delete('/:id', DailyLogController.delete);

module.exports = router;
