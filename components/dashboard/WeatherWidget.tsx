'use client';
import React, { useState, useEffect } from 'react';
import { CloudRain, Wind, Thermometer, MapPin, Loader2, Sun, Cloud } from 'lucide-react';

const WeatherWidget: React.FC = () => {
    const [data, setData] = useState<{
        temp: number;
        rain: number;
        wind: number;
        location: string;
        condition: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async (lat: number, lon: number) => {
            try {
                // Using wttr.in as a free, keyless weather API that supports JSON
                const res = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
                const json = await res.json();

                const current = json.current_condition[0];
                const area = json.nearest_area[0];

                setData({
                    temp: parseInt(current.temp_C),
                    rain: parseInt(json.weather[0].hourly[0].chanceofrain),
                    wind: parseInt(current.windspeedKmph),
                    location: `${area.areaName[0].value}, ${area.region[0].value}`,
                    condition: current.weatherDesc[0].value
                });
            } catch (err) {
                console.error('Weather fetch error:', err);
                // Fallback mock data
                setData({
                    temp: 13,
                    rain: 15,
                    wind: 12,
                    location: 'Local Region',
                    condition: 'Cloudy'
                });
            } finally {
                setLoading(false);
            }
        };

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                () => {
                    console.warn('Geolocation denied, using fallback');
                    fetchWeather(40.4168, -3.7038); // Baseline (Madrid)
                }
            );
        } else {
            fetchWeather(40.4168, -3.7038);
        }
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 animate-pulse">
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-500 font-mono italic">Locating...</span>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="flex items-center gap-4 px-5 py-2.5 bg-white/5 rounded-full border border-white/10 shadow-lg backdrop-blur-md">
            {/* Location */}
            <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                <MapPin className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-xs font-bold text-white max-w-[120px] truncate">{data.location}</span>
            </div>

            {/* Temp */}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                <Thermometer className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-white font-black tabular-nums">{data.temp}°C</span>
                {data.temp > 20 ? <Sun className="h-3.5 w-3.5 text-yellow-400 ml-1" /> : <Cloud className="h-3.5 w-3.5 text-blue-400 ml-1" />}
            </div>

            {/* Details (Hidden on mobile if needed, but keeping for now) */}
            <div className="hidden md:flex items-center gap-4 pl-2 border-l border-white/10 ml-2">
                <div className="flex items-center gap-1.5">
                    <CloudRain className="h-3.5 w-3.5 text-blue-400/70" />
                    <span className="text-[10px] text-gray-400 font-medium">{data.rain}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Wind className="h-3.5 w-3.5 text-green-400/70" />
                    <span className="text-[10px] text-gray-400 font-medium">{data.wind} km/h</span>
                </div>
            </div>
        </div>
    );
};

export default WeatherWidget;
