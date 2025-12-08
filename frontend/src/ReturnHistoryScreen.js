// frontend/src/ReturnHistoryScreen.js

import React from 'react';
import { ArrowLeft, Clock, MapPin, Shield, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// 🚨 임시 데이터
const DUMMY_HISTORY = [
    { id: 1, date: '2025.10.05', time: '23:40', start: '강남역', end: '역삼동 우리집', score: 95, duration: '18분' },
    { id: 2, date: '2025.10.03', time: '21:15', start: '회사', end: '역삼동 우리집', score: 88, duration: '25분' },
    { id: 3, date: '2025.10.01', time: '22:30', start: '홍대입구', end: '역삼동 우리집', score: 92, duration: '45분' },
];

export default function ReturnHistoryScreen() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 border-b shadow-sm flex items-center sticky top-0 z-10">
                <Link to="/profile" className="mr-4 text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">귀가 기록</h1>
            </header>

            <main className="p-4 space-y-4">
                {DUMMY_HISTORY.map((item) => (
                    <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex-1">
                            <div className="text-xs text-gray-400 mb-1 flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> {item.date} • {item.time}
                            </div>
                            <div className="font-bold text-gray-800 text-lg mb-2">
                                {item.start} <span className="text-gray-300">➔</span> {item.end}
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold flex items-center">
                                    <Shield className="w-3 h-3 mr-1" /> {item.score}점
                                </span>
                                <span className="text-gray-500">{item.duration} 소요</span>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                ))}
            </main>
        </div>
    );
}