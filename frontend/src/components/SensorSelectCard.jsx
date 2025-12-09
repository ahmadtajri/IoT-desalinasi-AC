import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

const SensorSelectCard = ({
    title,
    subtitle,
    value,
    unit,
    icon: Icon,
    colorTheme,
    options,
    selectedOption,
    onSelectChange,
    sensorStatus = {},
    max = 100
}) => {
    // Color configurations
    const themes = {
        blue: {
            bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
            border: 'border-blue-200',
            text: 'text-blue-600',
            iconBg: 'bg-blue-100',
            barBg: 'bg-blue-100',
            barFill: 'bg-gradient-to-r from-blue-400 to-cyan-500',
            valueColor: 'text-blue-700',
            selectBg: 'bg-white',
            selectBorder: 'border-blue-200 focus:ring-blue-300',
            headerBg: 'bg-gradient-to-r from-blue-500 to-cyan-500'
        },
        orange: {
            bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
            border: 'border-orange-200',
            text: 'text-orange-600',
            iconBg: 'bg-orange-100',
            barBg: 'bg-orange-100',
            barFill: 'bg-gradient-to-r from-orange-400 to-red-500',
            valueColor: 'text-orange-700',
            selectBg: 'bg-white',
            selectBorder: 'border-orange-200 focus:ring-orange-300',
            headerBg: 'bg-gradient-to-r from-orange-500 to-red-500'
        }
    };

    const theme = themes[colorTheme] || themes.blue;
    const percentage = value !== null ? Math.min((parseFloat(value) / max) * 100, 100) : 0;

    // Current sensor status
    const isCurrentSensorActive = sensorStatus[selectedOption] ?? true;

    return (
        <div className={`${theme.bg} rounded-2xl shadow-lg border ${theme.border} overflow-hidden transition-all duration-300 hover:shadow-xl`}>
            {/* Card Header */}
            <div className={`${theme.headerBg} px-6 py-4`}>
                <div className="flex items-center gap-3 text-white">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        <Icon size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">{title}</h3>
                        <p className="text-sm text-white text-opacity-80">{subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
                {/* Sensor Selection Dropdown */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                        Pilih Sensor
                    </label>
                    <div className="relative">
                        <select
                            value={selectedOption}
                            onChange={(e) => onSelectChange(e.target.value)}
                            className={`w-full px-4 py-3 pl-10 ${theme.selectBg} border ${theme.selectBorder} rounded-xl text-gray-700 font-medium outline-none focus:ring-2 cursor-pointer appearance-none shadow-sm transition-all duration-200`}
                        >
                            {options.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {/* Status indicator on select */}
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            {isCurrentSensorActive ? (
                                <div className="relative">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute top-0 left-0 opacity-75"></div>
                                </div>
                            ) : (
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            )}
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDown size={20} />
                        </div>
                    </div>
                </div>

                {/* Value Display */}
                <div className="text-center mb-6">
                    {isCurrentSensorActive ? (
                        <>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className={`text-6xl font-bold ${theme.valueColor}`}>
                                    {value}
                                </span>
                                <span className={`text-2xl font-medium ${theme.valueColor}`}>
                                    {unit}
                                </span>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <div className="relative">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute top-0 left-0 opacity-75"></div>
                                </div>
                                <p className="text-green-600 text-sm font-medium">
                                    Sensor {selectedOption} Aktif
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-5xl font-bold text-gray-300">--</span>
                                <span className="text-xl font-medium text-gray-300">{unit}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <AlertCircle size={16} className="text-red-500" />
                                <p className="text-red-500 text-sm font-medium">
                                    Sensor {selectedOption} Tidak Aktif
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>0{unit}</span>
                        <span>{max}{unit}</span>
                    </div>
                    <div className={`w-full h-4 ${theme.barBg} rounded-full overflow-hidden`}>
                        <div
                            className={`h-full ${isCurrentSensorActive ? theme.barFill : 'bg-gray-300'} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SensorSelectCard;
