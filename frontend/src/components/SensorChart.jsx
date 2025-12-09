import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SensorChart = ({ data, dataKeys }) => {
    // Default dataKeys if not provided (for backward compatibility)
    const defaultDataKeys = [
        { key: 'humidity', name: 'Kelembapan (%)', color: '#3b82f6' },
        { key: 'temperature', name: 'Suhu (°C)', color: '#f97316' }
    ];

    const keysToRender = dataKeys || defaultDataKeys;

    return (
        <div className="h-[300px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 20,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        {keysToRender.map((item, index) => (
                            <linearGradient
                                key={`gradient-${index}`}
                                id={`gradient-${item.key}`}
                                x1="0" y1="0" x2="0" y2="1"
                            >
                                <stop offset="0%" stopColor={item.color} stopOpacity={0.8} />
                                <stop offset="100%" stopColor={item.color} stopOpacity={0.3} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="time"
                        stroke="#9ca3af"
                        fontSize={11}
                        tickMargin={10}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        fontSize={11}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                            fontSize: '13px',
                            padding: '12px 16px'
                        }}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
                        iconSize={12}
                        iconType="circle"
                    />

                    {/* Render dynamic lines based on dataKeys */}
                    {keysToRender.map((item, index) => (
                        <Line
                            key={item.key}
                            type="monotone"
                            dataKey={item.key}
                            name={item.name}
                            stroke={item.color}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                            isAnimationActive={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SensorChart;
