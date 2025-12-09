import React, { useState, useEffect, useRef } from 'react';
import { Download, Trash2, Filter, Calendar, RefreshCw, ChevronDown, CheckCircle, XCircle, X, Droplets, Thermometer } from 'lucide-react';
import sensorService from '../services/sensorService';
import DataLogger from '../components/DataLogger';
import { useLogger } from '../context/LoggerContext';
import CustomAlert from '../components/CustomAlert';

const Report = () => {
    // Separate filters for humidity and temperature sensors
    const [selectedHumiditySensor, setSelectedHumiditySensor] = useState('all'); // 'all', 'H1', 'H2', ..., 'H6'
    const [selectedTemperatureSensor, setSelectedTemperatureSensor] = useState('all'); // 'all', 'T1', 'T2', ..., 'T12'
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDeleteMenu, setShowDeleteMenu] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const deleteMenuRef = useRef(null);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        isConfirm: false,
        onConfirm: () => { }
    });

    // Use Global Logger Context
    const { isLogging, toggleLogging, changeInterval, logCount, logInterval, realtimeData, sensorStatus } = useLogger();

    // Calculate active sensors
    const activeHumiditySensors = sensorStatus?.humidity
        ? Object.values(sensorStatus.humidity).filter(s => s).length
        : 0;
    const activeTempSensors = sensorStatus?.temperature
        ? Object.values(sensorStatus.temperature).filter(s => s).length
        : 0;
    const totalActiveSensors = activeHumiditySensors + activeTempSensors;
    const totalInactiveSensors = 18 - totalActiveSensors;

    // Sensor options
    const humidityOptions = Array.from({ length: 6 }, (_, i) => ({ value: `H${i + 1}`, label: `H${i + 1}` }));
    const temperatureOptions = Array.from({ length: 12 }, (_, i) => ({ value: `T${i + 1}`, label: `T${i + 1}` }));

    // Helper for Custom Alerts
    const showAlert = (title, message, type = 'info') => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
            isConfirm: false,
            onConfirm: () => { }
        });
    };

    const showConfirm = (title, message, onConfirm, type = 'warning') => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
            isConfirm: true,
            onConfirm
        });
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
    };

    // Auto-refresh table when new log comes in
    useEffect(() => {
        if (logCount > 0) {
            fetchData();
        }
    }, [logCount]);

    const handleToggleLogging = () => {
        toggleLogging();
    };

    const handleIntervalChange = (newInterval) => {
        changeInterval(newInterval);
    };

    // Fetch data from backend
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedSensor !== 'all') {
                params.sensor = selectedSensor;
            }
            if (selectedSensorType !== 'all') {
                params.sensorType = selectedSensorType;
            }
            if (dateRange.start && dateRange.end) {
                params.startDate = dateRange.start;
                params.endDate = dateRange.end;
            }

            const result = await sensorService.getAll(params);
            if (Array.isArray(result)) {
                setData(result);
            } else {
                console.error('API returned non-array data:', result);
                setData([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Fallback to mock data with new structure
            const mockData = Array.from({ length: 30 }, (_, i) => {
                const isHumidity = Math.random() > 0.5;
                const sensorNum = isHumidity ? Math.floor(Math.random() * 6) + 1 : Math.floor(Math.random() * 12) + 1;
                return {
                    id: i + 1,
                    sensor_id: isHumidity ? `H${sensorNum}` : `T${sensorNum}`,
                    sensor_type: isHumidity ? 'humidity' : 'temperature',
                    value: isHumidity
                        ? (50 + Math.random() * 40).toFixed(1)
                        : (20 + Math.random() * 130).toFixed(1),
                    unit: isHumidity ? '%' : '°C',
                    status: Math.random() > 0.2 ? 'active' : 'inactive',
                    interval: [5, 10, 60][Math.floor(Math.random() * 3)],
                    timestamp: new Date(Date.now() - i * 3600000).toISOString()
                };
            });
            setData(mockData);
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        fetchData();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target)) {
                setShowDeleteMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter data
    const safeData = Array.isArray(data) ? data : [];
    const filteredData = safeData.filter(item => {
        // Filter by interval
        if (item.interval) {
            const selectedSeconds = Math.floor(logInterval / 1000);
            if (item.interval !== selectedSeconds) return false;
        }

        // Filter by humidity sensor
        if (item.sensor_type === 'humidity') {
            if (selectedHumiditySensor !== 'all' && item.sensor_id !== selectedHumiditySensor) return false;
        }

        // Filter by temperature sensor
        if (item.sensor_type === 'temperature') {
            if (selectedTemperatureSensor !== 'all' && item.sensor_id !== selectedTemperatureSensor) return false;
        }

        return true;
    });

    const handleExport = () => {
        if (filteredData.length === 0) {
            const intervalSeconds = Math.floor(logInterval / 1000);
            showAlert(
                'Data Kosong',
                `Tidak ada data untuk di-export.\n\nData saat ini difilter berdasarkan interval ${intervalSeconds}s.`,
                'warning'
            );
            return;
        }

        // Custom CSV export for new structure
        const headers = ['ID', 'Sensor ID', 'Type', 'Value', 'Unit', 'Status', 'Interval (s)', 'Timestamp'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => [
                row.id,
                row.sensor_id,
                row.sensor_type,
                row.value,
                row.unit,
                row.status,
                row.interval || 'N/A',
                `"${new Date(row.timestamp).toLocaleString()}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sensor_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRefresh = async () => {
        await fetchData();
        setTimeout(() => {
            showAlert('Berhasil', 'Data berhasil diperbarui!', 'success');
        }, 100);
    };

    const handleDelete = (id) => {
        showConfirm(
            'Hapus Data?',
            'Apakah Anda yakin ingin menghapus data ini?',
            async () => {
                try {
                    await sensorService.delete(id);
                    setData(prev => prev.filter(item => item.id !== id));
                    showAlert('Sukses', 'Data berhasil dihapus', 'success');
                } catch (error) {
                    console.error('Error deleting data:', error);
                    showAlert('Gagal', 'Gagal menghapus data. Silakan coba lagi.', 'error');
                }
            },
            'error'
        );
    };

    const handleDeleteAll = () => {
        showConfirm(
            'Hapus SEMUA Data?',
            'Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan!',
            async () => {
                try {
                    await sensorService.deleteAll();
                    setData([]);
                    showAlert('Sukses', 'Semua data berhasil dihapus', 'success');
                } catch (error) {
                    console.error('Error deleting all data:', error);
                    showAlert('Gagal', 'Gagal menghapus data. Silakan coba lagi.', 'error');
                }
            },
            'error'
        );
    };

    const handleDeleteBySensor = (sensorType) => {
        const selectedSensor = sensorType === 'humidity' ? selectedHumiditySensor : selectedTemperatureSensor;
        const sensorTypeName = sensorType === 'humidity' ? 'Kelembapan' : 'Suhu';

        if (selectedSensor === 'all') {
            showAlert('Pilih Sensor', `Silakan pilih sensor ${sensorTypeName} tertentu terlebih dahulu`, 'info');
            return;
        }

        showConfirm(
            `Hapus Data Sensor ${selectedSensor}?`,
            `Apakah Anda yakin ingin menghapus SEMUA data dari Sensor ${selectedSensor}?`,
            async () => {
                try {
                    const newData = data.filter(item => item.sensor_id !== selectedSensor);
                    setData(newData);
                    showAlert('Sukses', `Data sensor ${selectedSensor} berhasil dihapus.`, 'success');
                } catch (error) {
                    console.error('Error deleting sensor data:', error);
                    showAlert('Error', 'Gagal menghapus data.', 'error');
                }
            },
            'error'
        );
    };

    const handleDeleteByInterval = () => {
        const intervalSeconds = Math.floor(logInterval / 1000);
        showConfirm(
            `Hapus Data Interval ${intervalSeconds}s?`,
            `Apakah Anda yakin ingin menghapus SEMUA data dengan interval ${intervalSeconds} detik?`,
            async () => {
                try {
                    const result = await sensorService.deleteByInterval(intervalSeconds);
                    if (result.success) {
                        showAlert('Sukses', `Data interval ${intervalSeconds}s berhasil dihapus.`, 'success');
                        fetchData();
                    } else {
                        showAlert('Gagal', 'Terjadi kesalahan saat menghapus.', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting interval data:', error);
                    showAlert('Error', 'Gagal menghapus data.', 'error');
                }
            },
            'error'
        );
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <CustomAlert
                isOpen={alertConfig.isOpen}
                onClose={closeAlert}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                isConfirm={alertConfig.isConfirm}
                onConfirm={alertConfig.onConfirm}
            />

            {/* Header Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Data Report</h1>
                        <p className="text-gray-500 mt-1 text-sm">Historical data analysis and export</p>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Live Indicator */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 rounded-xl border border-green-200">
                            <div className="relative">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute top-0 left-0 opacity-75"></div>
                            </div>
                            <span className="text-green-700 font-medium text-sm">Live</span>
                        </div>

                        {/* Sensor Status Button */}
                        <button
                            onClick={() => setShowStatusModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 cursor-pointer"
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
                            <span className="text-gray-500 text-xs ml-1">Detail →</span>
                        </button>

                        {/* Action Buttons */}
                        <button
                            onClick={handleRefresh}
                            className={`flex items-center gap-2 px-4 py-2.5 text-white rounded-xl transition-colors ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}
                            disabled={loading}
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
                        </button>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                        >
                            <Download size={18} />
                            <span className="hidden sm:inline">Export CSV</span>
                        </button>

                        {/* Delete Dropdown */}
                        <div className="relative" ref={deleteMenuRef}>
                            <button
                                onClick={() => data.length === 0 ? showAlert('Data Kosong', 'Tidak ada data untuk dihapus.', 'info') : setShowDeleteMenu(!showDeleteMenu)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                            >
                                <Trash2 size={18} />
                                <span className="hidden sm:inline">Delete</span>
                                <ChevronDown size={16} className={`transition-transform ${showDeleteMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showDeleteMenu && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                                    {/* Delete Humidity Sensor */}
                                    <button
                                        onClick={() => { handleDeleteBySensor('humidity'); setShowDeleteMenu(false); }}
                                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 ${selectedHumiditySensor === 'all' ? 'opacity-50' : ''}`}
                                        disabled={selectedHumiditySensor === 'all'}
                                    >
                                        <Droplets size={16} className="text-blue-600" />
                                        <div>
                                            <p className="font-medium text-gray-800">Delete Sensor Kelembapan</p>
                                            <p className="text-xs text-gray-500">
                                                {selectedHumiditySensor === 'all' ? 'Pilih sensor H terlebih dahulu' : `Hapus data ${selectedHumiditySensor}`}
                                            </p>
                                        </div>
                                    </button>

                                    {/* Delete Temperature Sensor */}
                                    <button
                                        onClick={() => { handleDeleteBySensor('temperature'); setShowDeleteMenu(false); }}
                                        className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex items-center gap-3 ${selectedTemperatureSensor === 'all' ? 'opacity-50' : ''}`}
                                        disabled={selectedTemperatureSensor === 'all'}
                                    >
                                        <Thermometer size={16} className="text-orange-600" />
                                        <div>
                                            <p className="font-medium text-gray-800">Delete Sensor Suhu</p>
                                            <p className="text-xs text-gray-500">
                                                {selectedTemperatureSensor === 'all' ? 'Pilih sensor T terlebih dahulu' : `Hapus data ${selectedTemperatureSensor}`}
                                            </p>
                                        </div>
                                    </button>

                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button
                                        onClick={() => { handleDeleteByInterval(); setShowDeleteMenu(false); }}
                                        className="w-full text-left px-4 py-3 hover:bg-yellow-50 transition-colors flex items-center gap-3"
                                    >
                                        <Trash2 size={16} className="text-yellow-600" />
                                        <div>
                                            <p className="font-medium text-gray-800">Delete by Interval</p>
                                            <p className="text-xs text-gray-500">Delete data with {Math.floor(logInterval / 1000)}s interval</p>
                                        </div>
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button
                                        onClick={() => { handleDeleteAll(); setShowDeleteMenu(false); }}
                                        className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex items-center gap-3"
                                    >
                                        <Trash2 size={16} className="text-red-600" />
                                        <div>
                                            <p className="font-medium text-gray-800">Delete All Data</p>
                                            <p className="text-xs text-gray-500">Remove all records permanently</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
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

                        <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
                            {/* Humidity Sensors */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Droplets size={20} className="text-blue-500" />
                                    <h3 className="font-bold text-gray-800">Sensor Kelembapan (H1-H6)</h3>
                                    <span className="text-sm text-gray-500 ml-auto">{activeHumiditySensors}/6 Aktif</span>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                    {Object.entries(sensorStatus?.humidity || {}).map(([key, isActive]) => {
                                        const value = realtimeData?.humidity?.[key];
                                        return (
                                            <div
                                                key={key}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
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
                                                <span className={`font-bold text-sm ${isActive ? 'text-green-700' : 'text-red-600'}`}>{key}</span>
                                                <span className={`text-lg font-bold mt-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {isActive && value !== null ? `${value}%` : '--'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Temperature Sensors */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Thermometer size={20} className="text-orange-500" />
                                    <h3 className="font-bold text-gray-800">Sensor Suhu (T1-T12)</h3>
                                    <span className="text-sm text-gray-500 ml-auto">{activeTempSensors}/12 Aktif</span>
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                    {Object.entries(sensorStatus?.temperature || {}).map(([key, isActive]) => {
                                        const value = realtimeData?.temperature?.[key];
                                        return (
                                            <div
                                                key={key}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
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
                                                <span className={`font-bold text-sm ${isActive ? 'text-green-700' : 'text-red-600'}`}>{key}</span>
                                                <span className={`text-lg font-bold mt-1 ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
                                                    {isActive && value !== null ? `${value}°` : '--'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

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

            {/* Data Logger Section */}
            <div className="mb-6">
                <DataLogger
                    onIntervalChange={handleIntervalChange}
                    isLogging={isLogging}
                    onToggleLogging={handleToggleLogging}
                />
                {isLogging && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
                        <p className="text-sm text-blue-700">
                            📊 Sedang merekam data... Total siklus: <span className="font-bold">{logCount}</span>
                        </p>
                        <p className="text-xs text-blue-600">
                            Data otomatis muncul di tabel di bawah
                        </p>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Filter Data Sensor</h3>
                <div className="flex flex-wrap gap-4 items-end">
                    {/* Humidity Sensor Filter */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Droplets size={16} className="text-blue-500" />
                            Sensor Kelembapan (H1-H6)
                        </label>
                        <div className="relative">
                            <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                            <select
                                className="w-full pl-10 pr-4 py-2.5 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-blue-50 text-gray-700 font-medium"
                                value={selectedHumiditySensor}
                                onChange={(e) => setSelectedHumiditySensor(e.target.value)}
                            >
                                <option value="all">Semua Sensor H</option>
                                {humidityOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={18} />
                        </div>
                    </div>

                    {/* Temperature Sensor Filter */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Thermometer size={16} className="text-orange-500" />
                            Sensor Suhu (T1-T12)
                        </label>
                        <div className="relative">
                            <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
                            <select
                                className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none appearance-none bg-orange-50 text-gray-700 font-medium"
                                value={selectedTemperatureSensor}
                                onChange={(e) => setSelectedTemperatureSensor(e.target.value)}
                            >
                                <option value="all">Semua Sensor T</option>
                                {temperatureOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none" size={18} />
                        </div>
                    </div>

                    {/* Start Date */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="datetime-local"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* End Date */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="datetime-local"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        onClick={fetchData}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                        Apply Filter
                    </button>
                </div>
            </div>

            {/* Data Count */}
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Menampilkan <span className="font-bold">{filteredData.length}</span> data (dari total {data.length})
                </p>
                {loading && <p className="text-sm text-blue-600">Loading...</p>}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 bg-gray-50">Time</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 bg-gray-50 text-center">Sensor</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 bg-gray-50">Type</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 bg-gray-50">Value</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 bg-gray-50 text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 bg-gray-50">Interval</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right bg-gray-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        Tidak ada data untuk filter yang dipilih.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                            {new Date(row.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-lg font-bold ${row.sensor_type === 'humidity' ? 'text-blue-600' : 'text-orange-600'}`}>
                                                {row.sensor_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.sensor_type === 'humidity' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {row.sensor_type === 'humidity' ? 'Kelembapan' : 'Suhu'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {row.value}{row.unit}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {row.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${row.interval === 5 ? 'bg-green-100 text-green-700' :
                                                row.interval === 10 ? 'bg-yellow-100 text-yellow-700' :
                                                    row.interval === 60 ? 'bg-purple-100 text-purple-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {row.interval ? `${row.interval}s` : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(row.id)}
                                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete this record"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Report;
