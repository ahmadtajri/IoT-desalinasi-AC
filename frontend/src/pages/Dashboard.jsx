import React, { useState, useEffect } from 'react';
import SensorSelectCard from '../components/SensorSelectCard';
import WaterLevelCard from '../components/WaterLevelCard';
import SensorChart from '../components/SensorChart';
import sensorService from '../services/sensorService';
import { useLogger } from '../context/LoggerContext';
import { Thermometer, Droplets, AlertTriangle, AlertOctagon, X, CheckCircle, XCircle, Waves } from 'lucide-react';

const Dashboard = () => {
    // Get Realtime Data Stream and Sensor Status
    const { realtimeData, sensorStatus } = useLogger();

    // Selected sensors for each card
    const [selectedHumidity, setSelectedHumidity] = useState('H1');
    const [selectedTemperature, setSelectedTemperature] = useState('T1');
    const [selectedWaterLevel, setSelectedWaterLevel] = useState('WL1');

    const [dbStatus, setDbStatus] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);

    // History data for chart
    const [chartData, setChartData] = useState([]);

    // Options for dropdown
    const humidityOptions = Array.from({ length: 7 }, (_, i) => ({
        value: `H${i + 1}`,
        label: `Kelembapan (H${i + 1})`
    }));

    const temperatureOptions = Array.from({ length: 15 }, (_, i) => ({
        value: `T${i + 1}`,
        label: `Suhu (T${i + 1})`
    }));

    const waterLevelOptions = [
        { value: 'WL1', label: 'Water Level (WL1)' }
    ];

    // Fetch database status
    useEffect(() => {
        const fetchDbStatus = async () => {
            try {
                const status = await sensorService.getDatabaseStatus();
                setDbStatus(status);
            } catch (error) {
                console.error("Error fetching DB status:", error);
            }
        };

        fetchDbStatus();
        const interval = setInterval(fetchDbStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    // Update chart when realtime data changes
    useEffect(() => {
        if (!realtimeData || !realtimeData.humidity || !realtimeData.temperature || !realtimeData.waterLevel) return;

        const humidValue = realtimeData.humidity[selectedHumidity];
        const tempValue = realtimeData.temperature[selectedTemperature];
        const waterValue = realtimeData.waterLevel[selectedWaterLevel];

        if (humidValue === null && tempValue === null && waterValue === null) return;

        const timeString = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        setChartData(prev => {
            const newPoint = {
                time: timeString,
                humidity: humidValue ?? prev[prev.length - 1]?.humidity ?? 0,
                temperature: tempValue ?? prev[prev.length - 1]?.temperature ?? 0,
                waterLevel: waterValue ?? prev[prev.length - 1]?.waterLevel ?? 0
            };

            const newHistory = [...prev, newPoint];
            if (newHistory.length > 20) return newHistory.slice(newHistory.length - 20);
            return newHistory;
        });
    }, [realtimeData, selectedHumidity, selectedTemperature, selectedWaterLevel]);

    // Clear chart when switching sensors
    useEffect(() => {
        setChartData([]);
    }, [selectedHumidity, selectedTemperature, selectedWaterLevel]);

    // Get current values
    const currentHumidityValue = realtimeData?.humidity?.[selectedHumidity] ?? 0;
    const currentTemperatureValue = realtimeData?.temperature?.[selectedTemperature] ?? 0;
    const currentWaterLevelValue = realtimeData?.waterLevel?.[selectedWaterLevel] ?? 0;

    // Count active sensors
    const activeHumiditySensors = sensorStatus?.humidity
        ? Object.values(sensorStatus.humidity).filter(s => s).length
        : 0;
    const activeTempSensors = sensorStatus?.temperature
        ? Object.values(sensorStatus.temperature).filter(s => s).length
        : 0;
    const activeWaterLevelSensors = sensorStatus?.waterLevel
        ? Object.values(sensorStatus.waterLevel).filter(s => s).length
        : 0;

    const totalActiveSensors = activeHumiditySensors + activeTempSensors + activeWaterLevelSensors;
    const totalInactiveSensors = (7 + 15 + 1) - totalActiveSensors;

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Database Status Alert */}
            {dbStatus && dbStatus.status !== 'OK' && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 shadow-sm ${dbStatus.status === 'CRITICAL'
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                    }`}>
                    <div className="mt-1">
                        {dbStatus.status === 'CRITICAL' ? <AlertOctagon size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">
                            {dbStatus.status === 'CRITICAL' ? 'Database Critical Warning!' : 'Database Warning'}
                        </h3>
                        <p className="mt-1">{dbStatus.message}</p>
                        <div className="mt-2 text-sm opacity-90 flex gap-4">
                            <span>Current Records: <strong>{dbStatus.total_records?.toLocaleString()}</strong></span>
                            <span>Size: <strong>{dbStatus.table_size_mb} MB</strong></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Monitoring Sensor</h2>
                        <p className="text-gray-500 text-sm mt-1">Pilih sensor individual untuk melihat data real-time</p>
                    </div>

                    {/* Status Indicators - Clickable */}
                    <div className="flex items-center gap-3">
                        {/* Live Data indicator removed as per request */}

                        {/* Clickable Sensor Status */}
                        <button
                            onClick={() => setShowStatusModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 cursor-pointer group"
                        >
                            <div className="flex items-center gap-1.5">
                                <CheckCircle size={16} className="text-green-500" />
                                <span className="text-green-700 font-bold text-sm">{totalActiveSensors}</span>
                            </div>
                            <div className="w-px h-4 bg-gray-300"></div>
                            <div className="flex items-center gap-1.5">
                                <XCircle size={16} className="text-red-400" />
                                <span className="text-red-600 font-bold text-sm">{totalInactiveSensors}</span>
                            </div>
                            <span className="text-gray-500 text-xs ml-1 group-hover:text-blue-600 transition-colors">Detail →</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Sensor Status Modal */}
            {showStatusModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
                    onClick={() => setShowStatusModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-white">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Status Semua Sensor</h2>
                                    <p className="text-blue-100 text-sm mt-1">
                                        {totalActiveSensors} Aktif • {totalInactiveSensors} Tidak Aktif
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={24} className="text-white" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
                            {/* Humidity Sensors */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Droplets size={20} className="text-blue-500" />
                                    <h3 className="font-bold text-gray-800">Sensor Kelembapan (H1-H7)</h3>
                                    <span className="text-sm text-gray-500 ml-auto">
                                        {activeHumiditySensors}/7 Aktif
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
                                    {Object.entries(sensorStatus?.humidity || {}).map(([key, isActive]) => {
                                        const value = realtimeData?.humidity?.[key];
                                        return (
                                            <div
                                                key={key}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${isActive
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-red-50 border-red-200'
                                                    }`}
                                            >
                                                <div className="relative mb-1">
                                                    {isActive ? (
                                                        <>
                                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute top-0 left-0 opacity-75"></div>
                                                        </>
                                                    ) : (
                                                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                                    )}
                                                </div>
                                                <span className={`font-bold text-sm ${isActive ? 'text-green-700' : 'text-red-600'}`}>
                                                    {key}
                                                </span>
                                                <span className={`text-lg font-bold mt-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {isActive && value !== null ? `${value}%` : '--'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Temperature Sensors */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Thermometer size={20} className="text-orange-500" />
                                    <h3 className="font-bold text-gray-800">Sensor Suhu (T1-T15)</h3>
                                    <span className="text-sm text-gray-500 ml-auto">
                                        {activeTempSensors}/15 Aktif
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-3">
                                    {Object.entries(sensorStatus?.temperature || {}).map(([key, isActive]) => {
                                        const value = realtimeData?.temperature?.[key];
                                        return (
                                            <div
                                                key={key}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${isActive
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-red-50 border-red-200'
                                                    }`}
                                            >
                                                <div className="relative mb-1">
                                                    {isActive ? (
                                                        <>
                                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute top-0 left-0 opacity-75"></div>
                                                        </>
                                                    ) : (
                                                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                                    )}
                                                </div>
                                                <span className={`font-bold text-sm ${isActive ? 'text-green-700' : 'text-red-600'}`}>
                                                    {key}
                                                </span>
                                                <span className={`text-lg font-bold mt-1 ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
                                                    {isActive && value !== null ? `${value}°` : '--'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Water Level Sensors */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Waves size={20} className="text-cyan-500" />
                                    <h3 className="font-bold text-gray-800">Sensor Water Level</h3>
                                    <span className="text-sm text-gray-500 ml-auto">
                                        {activeWaterLevelSensors}/1 Aktif
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {Object.entries(sensorStatus?.waterLevel || {}).map(([key, isActive]) => {
                                        const value = realtimeData?.waterLevel?.[key];
                                        return (
                                            <div
                                                key={key}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${isActive
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-red-50 border-red-200'
                                                    }`}
                                            >
                                                <div className="relative mb-1">
                                                    {isActive ? (
                                                        <>
                                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute top-0 left-0 opacity-75"></div>
                                                        </>
                                                    ) : (
                                                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                                    )}
                                                </div>
                                                <span className={`font-bold text-sm ${isActive ? 'text-green-700' : 'text-red-600'}`}>
                                                    {key}
                                                </span>
                                                <span className={`text-lg font-bold mt-1 ${isActive ? 'text-cyan-600' : 'text-gray-400'}`}>
                                                    {isActive && value !== null ? `${value}%` : '--'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer with Legend */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm text-gray-600">Sensor Aktif</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                        <span className="text-sm text-gray-600">Sensor Offline</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content - Three Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Card 1: Kelembapan (H1-H6) */}
                <SensorSelectCard
                    title="Kelembapan (Humidity)"
                    subtitle="Monitoring kelembapan udara"
                    value={currentHumidityValue}
                    unit="%"
                    icon={Droplets}
                    colorTheme="blue"
                    options={humidityOptions}
                    selectedOption={selectedHumidity}
                    onSelectChange={setSelectedHumidity}
                    sensorStatus={sensorStatus?.humidity || {}}
                    max={100}
                />

                {/* Card 2: Suhu (T1-T12) */}
                <SensorSelectCard
                    title="Suhu (Temperature)"
                    subtitle="Monitoring suhu"
                    value={currentTemperatureValue}
                    unit="°C"
                    icon={Thermometer}
                    colorTheme="orange"
                    options={temperatureOptions}
                    selectedOption={selectedTemperature}
                    onSelectChange={setSelectedTemperature}
                    sensorStatus={sensorStatus?.temperature || {}}
                    max={70}
                />

                {/* Card 3: Water Level */}
                <WaterLevelCard
                    value={currentWaterLevelValue}
                    status={sensorStatus?.waterLevel?.[selectedWaterLevel] ?? true}
                />
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Grafik Real-time</h3>
                    <p className="text-gray-500 text-sm mt-1">
                        Menampilkan data {selectedHumidity} (Kelembapan), {selectedTemperature} (Suhu), dan {selectedWaterLevel} (Water Level)
                    </p>
                </div>
                <SensorChart
                    data={chartData}
                    dataKeys={[
                        { key: 'humidity', name: `Kelembapan (${selectedHumidity})`, color: '#3b82f6' },
                        { key: 'temperature', name: `Suhu (${selectedTemperature})`, color: '#f97316' },
                        { key: 'waterLevel', name: `Water Level (${selectedWaterLevel})`, color: '#06b6d4' }
                    ]}
                />
            </div>
        </div>
    );
};

export default Dashboard;
