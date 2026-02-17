# Postman API Testing Guide - ESP32 IoT Desalinasi v3.0

**Last Updated**: 2026-01-29  
**Collection Version**: 3.0  
**Environment**: Local Development

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoints](#api-endpoints)
5. [Testing Scenarios](#testing-scenarios)
6. [Environment Variables](#environment-variables)
7. [Common Issues](#common-issues)

---

## Overview

Collection ini berisi **complete API testing** untuk ESP32 IoT Desalinasi system dengan fitur:

✅ **Authentication & Authorization** (JWT)  
✅ **User Management** (Admin only)  
✅ **Interval Management** (Admin only)  
✅ **Sensor Data CRUD**  
✅ **ESP32 Communication**  
✅ **Background Logger Control**  
✅ **Realtime Data**  
✅ **Database Monitoring**

### Sensor Configuration
- **Humidity**: RH1-RH7 (7 sensors)
- **Air Temperature**: T1-T7 (7 sensors)
- **Water Temperature**: T8-T15 (8 sensors)
- **Water Level**: WL1 (1 sensor - realtime only)
- **Water Weight**: WW1 (1 sensor)
- **Total**: 23 sensors + 1 valve

---

## Setup Instructions

### 1. Import Collection & Environment

#### Import Collection
1. Buka Postman
2. Click **Import** button
3. Pilih file: `docs/postman/ESP32_IoT_API.postman_collection.json`
4. Click **Import**

#### Import Environment
1. Click **Environments** di sidebar
2. Click **Import**
3. Pilih file: `docs/postman/ESP32_IoT_Local.postman_environment.json`
4. Click **Import**
5. **Activate** environment dengan click nama environment

### 2. Verify Backend is Running

Pastikan backend sudah running:
```bash
cd backend
npm run dev
```

Expected output:
```
✅ Database connected successfully
🚀 Server running on port 3000
```

### 3. Test Connection

Jalankan request pertama:
- **GET Database Status** di folder "Database Status"
- Expected: Status 200 OK

---

## Authentication Flow

### Default Credentials

#### Admin Account
```
Username: admin
Password: admin123
```

#### Test User Account (Buat dulu via Admin)
```
Username: user1
Password: password123
```

### Authentication Steps

#### 1. Login as Admin
```http
POST {{api_url}}/auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "role": "ADMIN"
        }
    }
}
```

**Auto-saved to Environment:**
- `access_token` ✅
- `refresh_token` ✅
- `user_id` ✅
- `user_role` ✅

#### 2. Use Protected Endpoints

Setelah login, semua request akan otomatis menggunakan Bearer Token:
```
Authorization: Bearer {{access_token}}
```

Collection sudah di-configure dengan **Collection-level Auth**, jadi tidak perlu set manual per request.

#### 3. Refresh Token (Optional)

Jika access token expired:
```http
POST {{api_url}}/auth/refresh
Content-Type: application/json

{
    "refreshToken": "{{refresh_token}}"
}
```

#### 4. Logout

```http
POST {{api_url}}/auth/logout
Authorization: Bearer {{access_token}}
```

Environment variables akan di-clear otomatis.

---

## API Endpoints

### 1️⃣ Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/login` | POST | ❌ | Login user |
| `/auth/logout` | POST | ✅ | Logout user |
| `/auth/me` | GET | ✅ | Get current user info |
| `/auth/refresh` | POST | ❌ | Refresh access token |

**Example: Login Admin**
```javascript
// Request
POST /api/auth/login
{
    "username": "admin",
    "password": "admin123"
}

// Test Script (Auto-run)
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set('access_token', jsonData.data.accessToken);
    pm.environment.set('refresh_token', jsonData.data.refreshToken);
    pm.environment.set('user_id', jsonData.data.user.id);
    pm.environment.set('user_role', jsonData.data.user.role);
}
```

---

### 2️⃣ User Management (Admin Only)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/users` | GET | 🔐 Admin | Get all users |
| `/users/:id` | GET | 🔐 Admin | Get user by ID |
| `/users` | POST | 🔐 Admin | Create new user |
| `/users/:id` | PUT | 🔐 Admin | Update user |
| `/users/:id/status` | PATCH | 🔐 Admin | Toggle user status |
| `/users/:id` | DELETE | 🔐 Admin | Delete user |

**Example: Create User**
```javascript
// Request
POST /api/users
Authorization: Bearer {{access_token}}
{
    "username": "user_test",
    "email": "user.test@example.com",
    "password": "password123",
    "role": "USER"
}

// Test Script (Auto-run)
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set('new_user_id', jsonData.data.id);
    console.log('✅ User created:', jsonData.data.username);
}
```

**Example: Get All Users**
```javascript
// Request
GET /api/users
Authorization: Bearer {{access_token}}

// Response
{
    "success": true,
    "data": [
        {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "role": "ADMIN",
            "isActive": true,
            "activeInterval": {
                "id": 1,
                "intervalName": "Setiap 5 Menit",
                "intervalSeconds": 300
            },
            "_count": {
                "sensorData": 1250
            }
        }
    ]
}
```

---

### 3️⃣ Interval Management

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/intervals` | GET | ✅ | Get all global intervals |
| `/intervals/active` | GET | ✅ | Get user's active interval |
| `/intervals` | POST | 🔐 Admin | Create global interval |
| `/intervals/:id` | PUT | 🔐 Admin | Update interval |
| `/intervals/:id/activate` | PATCH | ✅ | Set active interval |
| `/intervals/:id` | DELETE | 🔐 Admin | Delete interval |

**Example: Create Interval (Jam/Menit/Detik)**
```javascript
// Pre-request Script
const hours = 0;
const minutes = 5;
const seconds = 0;

const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
pm.environment.set('interval_seconds', totalSeconds);
pm.environment.set('interval_name', `Setiap ${minutes} Menit`);

// Request
POST /api/intervals
Authorization: Bearer {{access_token}}
{
    "intervalSeconds": {{interval_seconds}},
    "intervalName": "{{interval_name}}"
}

// Response
{
    "success": true,
    "message": "Global interval created successfully.",
    "data": {
        "id": 1,
        "intervalSeconds": 300,
        "intervalName": "Setiap 5 Menit",
        "createdAt": "2026-01-29T12:00:00.000Z"
    }
}
```

**Example: Set Active Interval**
```javascript
// Request
PATCH /api/intervals/1/activate
Authorization: Bearer {{access_token}}

// Response
{
    "success": true,
    "message": "Active interval set successfully",
    "data": {
        "id": 1,
        "username": "user1",
        "activeInterval": {
            "id": 1,
            "intervalName": "Setiap 5 Menit",
            "intervalSeconds": 300
        }
    }
}
```

---

### 4️⃣ ESP32 Endpoints (No Auth)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/esp32/temperature` | POST | ❌ | Send temperature data |
| `/esp32/humidity` | POST | ❌ | Send humidity data |
| `/esp32/waterlevel` | POST | ❌ | Send water level data |
| `/esp32/waterweight` | POST | ❌ | Send water weight data |
| `/esp32/valve` | POST | ❌ | Send valve status |
| `/esp32/realtime` | GET | ❌ | Get cached realtime data |
| `/esp32/status` | GET | ❌ | Get ESP32 status |
| `/esp32/cache` | DELETE | ❌ | Clear cache |
| `/esp32/save` | POST | ❌ | Save cache to DB |

**Example: POST Temperature Data**
```javascript
// Request
POST /api/esp32/temperature
Content-Type: application/json
{
    "T1": 25.5,
    "T2": 26.0,
    "T3": 27.2,
    "T4": 24.8,
    "T5": 26.5,
    "T6": 25.9,
    "T7": 26.3,
    "T8": 30.1,
    "T9": 31.5,
    "T10": 32.0,
    "T11": 30.8,
    "T12": 31.2,
    "T13": 30.5,
    "T14": 31.8,
    "T15": 32.1
}

// Response
{
    "success": true,
    "message": "Temperature data received",
    "cached": true
}
```

---

### 5️⃣ Realtime Data (No Auth)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/sensors/realtime` | GET | ❌ | Get formatted realtime data |

**Example: GET Realtime Data**
```javascript
// Request
GET /api/sensors/realtime

// Response
{
    "success": true,
    "data": {
        "realtimeData": {
            "humidity": {
                "RH1": { "value": 65.5, "status": "active" },
                "RH2": { "value": 68.0, "status": "active" },
                // ... RH3-RH7
            },
            "airTemperature": {
                "T1": { "value": 25.5, "status": "active" },
                // ... T2-T7
            },
            "waterTemperature": {
                "T8": { "value": 30.1, "status": "active" },
                // ... T9-T15
            },
            "waterLevel": {
                "WL1": { "value": 75.5, "status": "active" }
            }
        },
        "sensorStatus": {
            "RH1": "active",
            "T1": "active",
            // ... all sensors
        },
        "pumpStatus": "ON",
        "waterWeight": 500.5,
        "valveStatus": "open"
    }
}
```

---

### 6️⃣ Logger Control (No Auth)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/logger/status` | GET | ❌ | Get logger status |
| `/logger/start` | POST | ❌ | Start background logger |
| `/logger/stop` | POST | ❌ | Stop background logger |
| `/logger/config` | POST | ❌ | Configure logger |

**Example: Start Logger**
```javascript
// Request
POST /api/logger/start
Content-Type: application/json
{
    "humidity": "all",
    "temperature": "all"
}

// Response
{
    "success": true,
    "message": "Background logger started",
    "config": {
        "interval": 5000,
        "humidity": "all",
        "temperature": "all"
    }
}
```

---

### 7️⃣ Sensor Data (No Auth for most)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/sensors` | GET | ❌ | Get all sensor data |
| `/sensors?limit=50` | GET | ❌ | Get with limit |
| `/sensors?sensorId=RH1` | GET | ❌ | Get by sensor ID |
| `/sensors?sensorType=humidity` | GET | ❌ | Get by type |
| `/sensors?startDate=...&endDate=...` | GET | ❌ | Get by date range |
| `/sensors` | POST | ❌ | Create sensor data |
| `/sensors/:id` | DELETE | ❌ | Delete single record |
| `/sensors/sensor/:sensorId` | DELETE | ❌ | Delete by sensor ID |
| `/sensors/type/:type` | DELETE | ❌ | Delete by type |
| `/sensors/interval/:interval` | DELETE | ❌ | Delete by interval |
| `/sensors` | DELETE | ❌ | Delete all (⚠️) |

**Example: Create Sensor Data (Random)**
```javascript
// Pre-request Script (Auto-generate random data)
const sensorTypes = ['humidity', 'temperature'];
const type = sensorTypes[Math.floor(Math.random() * 2)];
let sensorId, unit, value;

if (type === 'humidity') {
    sensorId = 'RH' + (Math.floor(Math.random() * 7) + 1);
    value = (50 + Math.random() * 40).toFixed(1);
    unit = '%';
} else {
    sensorId = 'T' + (Math.floor(Math.random() * 15) + 1);
    value = (20 + Math.random() * 50).toFixed(1);
    unit = '°C';
}

pm.environment.set('random_sensor_id', sensorId);
pm.environment.set('random_sensor_type', type);
pm.environment.set('random_value', value);
pm.environment.set('random_unit', unit);

// Request
POST /api/sensors
{
    "sensor_id": "{{random_sensor_id}}",
    "sensor_type": "{{random_sensor_type}}",
    "value": {{random_value}},
    "unit": "{{random_unit}}",
    "status": "active",
    "interval": 5
}
```

---

## Testing Scenarios

### Scenario 1: Complete Admin Workflow

**Step 1: Login as Admin**
```
1. Run: Authentication > Login Admin
2. Verify: access_token saved to environment
3. Verify: user_role = "ADMIN"
```

**Step 2: Create Global Interval**
```
1. Edit Pre-request Script di "Create Interval (Hours/Minutes/Seconds)"
   - Set: hours = 0, minutes = 5, seconds = 0
2. Run request
3. Verify: new_interval_id saved to environment
4. Verify: Response shows "Setiap 5 Menit"
```

**Step 3: Create New User**
```
1. Run: User Management > Create User
2. Verify: new_user_id saved to environment
3. Verify: User created successfully
```

**Step 4: View All Users**
```
1. Run: User Management > Get All Users
2. Verify: New user appears in list
3. Verify: User has no activeInterval yet
```

**Step 5: Logout**
```
1. Run: Authentication > Logout
2. Verify: Tokens cleared from environment
```

---

### Scenario 2: User Data Logger Workflow

**Step 1: Login as User**
```
1. Update credentials in "Login User" request
2. Run: Authentication > Login User
3. Verify: access_token saved
4. Verify: user_role = "USER"
```

**Step 2: View Available Intervals**
```
1. Run: Interval Management > Get All Intervals
2. Verify: List of global intervals
3. Note: interval ID yang ingin digunakan
```

**Step 3: Set Active Interval**
```
1. Update {{new_interval_id}} di environment (atau hardcode)
2. Run: Interval Management > Set Active Interval
3. Verify: Active interval set successfully
```

**Step 4: Check Current User Info**
```
1. Run: Authentication > Get Current User
2. Verify: activeInterval field populated
3. Verify: Shows selected interval name
```

**Step 5: Start Data Logger**
```
1. Run: Logger Control > POST Start Logger
2. Verify: Logger started
3. Wait 5-10 seconds
```

**Step 6: Check Logger Status**
```
1. Run: Logger Control > GET Logger Status
2. Verify: isRunning = true
3. Verify: logCount > 0
```

**Step 7: View Logged Data**
```
1. Run: Sensor Data > GET All Sensors
2. Verify: Data exists
3. Verify: interval field matches selected interval
```

---

### Scenario 3: ESP32 Simulation

**Step 1: Send Temperature Data**
```
1. Run: ESP32 Endpoints > POST Temperature Data
2. Verify: Success response
3. Verify: Data cached
```

**Step 2: Send Humidity Data**
```
1. Run: ESP32 Endpoints > POST Humidity Data
2. Verify: Success response
```

**Step 3: Send Water Level**
```
1. Run: ESP32 Endpoints > POST Water Level Data
2. Verify: Success response
```

**Step 4: Check Realtime Data**
```
1. Run: Realtime Data > GET Realtime Sensor Data
2. Verify: All sensor data populated
3. Verify: Sensor status = "active"
```

**Step 5: Check ESP32 Status**
```
1. Run: ESP32 Endpoints > GET ESP32 Status
2. Verify: Connection status
3. Verify: Active sensor count
```

---

### Scenario 4: Data Management

**Step 1: Create Random Sensor Data**
```
1. Run: Sensor Data > POST Create Sensor Data (multiple times)
2. Verify: last_created_id saved each time
3. Verify: Random sensor IDs generated
```

**Step 2: Query by Sensor ID**
```
1. Run: Sensor Data > GET Sensors by Sensor ID
2. Change query param: ?sensorId=RH1
3. Verify: Only RH1 data returned
```

**Step 3: Query by Type**
```
1. Run: Sensor Data > GET Sensors by Type
2. Change query param: ?sensorType=humidity
3. Verify: Only humidity sensors returned
```

**Step 4: Query by Date Range**
```
1. Run: Sensor Data > GET Sensors by Date Range
2. Update startDate and endDate
3. Verify: Data within range returned
```

**Step 5: Delete by Sensor ID**
```
1. Run: Sensor Data > DELETE by Sensor ID
2. Change path param: /sensor/RH1
3. Verify: All RH1 data deleted
```

---

## Environment Variables

### Auto-Managed Variables

These are automatically set by test scripts:

| Variable | Set By | Description |
|----------|--------|-------------|
| `access_token` | Login requests | JWT access token |
| `refresh_token` | Login requests | JWT refresh token |
| `user_id` | Login requests | Current user ID |
| `user_role` | Login requests | Current user role (ADMIN/USER) |
| `new_user_id` | Create User | ID of newly created user |
| `new_interval_id` | Create Interval | ID of newly created interval |
| `interval_seconds` | Create Interval | Calculated total seconds |
| `interval_name` | Create Interval | Generated interval name |
| `random_sensor_id` | Create Sensor Data | Random sensor ID (RH1-RH7, T1-T15) |
| `random_sensor_type` | Create Sensor Data | Random type (humidity/temperature) |
| `random_value` | Create Sensor Data | Random sensor value |
| `random_unit` | Create Sensor Data | Unit (%, °C) |
| `last_created_id` | Create Sensor Data | ID of last created sensor data |

### Manual Variables

These can be edited manually:

| Variable | Default | Description |
|----------|---------|-------------|
| `base_url` | `http://localhost:3000` | Backend base URL |
| `api_url` | `http://localhost:3000/api` | API base URL |

---

## Common Issues

### Issue 1: 401 Unauthorized

**Symptoms:**
```json
{
    "success": false,
    "message": "No token provided"
}
```

**Solutions:**
1. ✅ Run "Login Admin" or "Login User" first
2. ✅ Check `access_token` exists in environment
3. ✅ Verify Collection Auth is set to Bearer Token
4. ✅ Check token hasn't expired (run Refresh Token)

---

### Issue 2: 403 Forbidden

**Symptoms:**
```json
{
    "success": false,
    "message": "Access denied. Admin only."
}
```

**Solutions:**
1. ✅ Login as Admin (not regular user)
2. ✅ Check `user_role` in environment = "ADMIN"
3. ✅ Verify endpoint requires admin access

---

### Issue 3: Connection Refused

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solutions:**
1. ✅ Start backend: `cd backend && npm run dev`
2. ✅ Check port 3000 is not used by other app
3. ✅ Verify `api_url` in environment is correct

---

### Issue 4: Token Expired

**Symptoms:**
```json
{
    "success": false,
    "message": "Token expired"
}
```

**Solutions:**
1. ✅ Run "Refresh Token" request
2. ✅ Or re-login using "Login Admin/User"

---

### Issue 5: Interval Not Found

**Symptoms:**
```json
{
    "success": false,
    "message": "Interval not found"
}
```

**Solutions:**
1. ✅ Run "Get All Intervals" to see available intervals
2. ✅ Create interval first using "Create Interval"
3. ✅ Update `new_interval_id` in environment

---

## Tips & Tricks

### 1. Run Collection with Newman (CLI)

Install Newman:
```bash
npm install -g newman
```

Run collection:
```bash
newman run "docs/postman/ESP32_IoT_API.postman_collection.json" \
  -e "docs/postman/ESP32_IoT_Local.postman_environment.json"
```

### 2. Export Test Results

```bash
newman run collection.json -e environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

### 3. Run Specific Folder

```bash
newman run collection.json -e environment.json \
  --folder "Authentication"
```

### 4. Use Variables in Tests

```javascript
// Access environment variable
const token = pm.environment.get('access_token');

// Set environment variable
pm.environment.set('my_var', 'value');

// Access collection variable
const apiUrl = pm.collectionVariables.get('api_url');
```

### 5. Chain Requests

```javascript
// In Test Script of Request A
pm.environment.set('user_id', responseData.id);

// In Request B
// Use {{user_id}} in URL or body
```

---

## Advanced Testing

### Test Script Examples

#### Assert Status Code
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

#### Assert Response Time
```javascript
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

#### Assert JSON Structure
```javascript
pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData).to.have.property('data');
    pm.expect(jsonData.data).to.be.an('array');
});
```

#### Assert Value
```javascript
pm.test("User role is ADMIN", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.user.role).to.equal('ADMIN');
});
```

---

## Changelog

### v3.0 (2026-01-29)
- ✅ Added Authentication endpoints
- ✅ Added User Management (Admin only)
- ✅ Added Interval Management with hours/minutes/seconds
- ✅ Added JWT Bearer token authentication
- ✅ Added auto-save tokens to environment
- ✅ Updated sensor configuration (T8-T15 for water temp)
- ✅ Added comprehensive test scripts
- ✅ Added pre-request scripts for dynamic data

### v2.2 (Previous)
- ✅ ESP32 endpoints
- ✅ Logger control
- ✅ Sensor data CRUD
- ✅ Realtime data

---

## Support

Jika ada masalah atau pertanyaan:
1. Check [Common Issues](#common-issues)
2. Verify backend is running
3. Check environment variables
4. Review test scripts output in Postman Console

---

**Created by**: Antigravity AI Assistant  
**Date**: 2026-01-29  
**Version**: 3.0
