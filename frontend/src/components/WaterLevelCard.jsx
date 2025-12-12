import React from 'react';
import { Waves } from 'lucide-react';

const WaterLevelCard = ({ value, status }) => {
    const percentage = value !== null ? Math.min(Math.max(parseFloat(value), 0), 100) : 0;

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-cyan-100 overflow-hidden flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Waves size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Water Level</h3>
                        <p className="text-sm text-white/80">Monitoring ketinggian air</p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-row items-center justify-between gap-6 flex-1">

                {/* Left Side: Stats */}
                <div className="flex flex-col justify-center">
                    <div className="mb-4">
                        <span className="text-gray-500 text-sm font-medium">Level Saat Ini</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-bold text-cyan-600">
                                {value !== null ? value : '--'}
                            </span>
                            <span className="text-xl font-medium text-gray-400">%</span>
                        </div>
                    </div>

                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium w-fit ${status ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        {status ? 'Online' : 'Offline'}
                    </div>
                </div>

                {/* Right Side: Visual Tank */}
                <div className="h-40 w-24 bg-gray-100 rounded-2xl border-2 border-gray-200 relative overflow-hidden flex flex-col justify-end shadow-inner">
                    {/* Measurement Lines */}
                    <div className="absolute inset-0 z-10 flex flex-col justify-between py-2 px-1 opacity-30 pointer-events-none">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-full border-t border-gray-400"></div>
                        ))}
                    </div>

                    {/* Liquid Fill */}
                    <div
                        className="w-full bg-gradient-to-t from-cyan-500 to-blue-400 transition-all duration-1000 ease-out relative"
                        style={{ height: `${percentage}%` }}
                    >
                        {/* Surface Line */}
                        <div className="w-full h-1 bg-white/50 absolute top-0"></div>

                        {/* Bubbles Animation (Simple CSS) */}
                        {status && percentage > 0 && (
                            <>
                                <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDuration: '2s' }}></div>
                                <div className="absolute bottom-2 left-1/2 w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
                                <div className="absolute bottom-1 left-3/4 w-2.5 h-2.5 bg-white/40 rounded-full animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '1s' }}></div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaterLevelCard;
