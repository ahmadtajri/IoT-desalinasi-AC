const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const intervalRoutes = require('./routes/intervals');
const schemaRoutes = require('./routes/schema');
const sensorConfigRoutes = require('./routes/sensorConfigRoutes');
const valveRoutes = require('./routes/valve');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for SVG uploads

// Authentication routes
app.use('/api/auth', authRoutes);

// User management routes (admin only)
app.use('/api/users', userRoutes);

// Interval management routes
app.use('/api/intervals', intervalRoutes);

// Schema management routes
app.use('/api/schema', schemaRoutes);

// Sensor configuration routes
app.use('/api/sensor-config', sensorConfigRoutes);

// Valve control routes
app.use('/api/valve', valveRoutes);

// Main API routes
app.use('/api', routes);

app.get('/', (req, res) => {
    res.send('IoT Desalinasi Monitoring API - v2.0 with RBAC');
});

module.exports = app;
