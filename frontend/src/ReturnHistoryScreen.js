// frontend/src/ReturnHistoryScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Clock, MapPin, Shield, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

export default function ReturnHistoryScreen({ userUid }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🚨 서버에서 기록 불러오기
    useEffect(() => {
        const fetchHistory = async () => {
            if (!userUid) return;
            try {
                const response = await axios.get(`${API_BASE_URL}/api/history/${userUid}`);
                setHistory(response.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [userUid]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 border-b shadow-sm flex items-center sticky top-0 z-10">
                <Link to="/profile" className="mr-4 text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">귀가 기록</h1>
            </header>

            <main className="p-4 space-y-4">
                {loading ? <div className="text-center p-10 text-gray-500">로딩 중...</div> :
                 history.length === 0 ? <div className="text-center p-10 text-gray-400">아직 귀가 기록이 없습니다.</div> : (
                    history.map((item) => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex-1">
                                <div className="text-xs text-gray-400 mb-1 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" /> {item.date}
                                </div>
                                <div className="font-bold text-gray-800 text-lg mb-2">
                                    {item.start} <span className="text-gray-300 mx-1">➔</span> {item.end}
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold flex items-center">
                                        <Shield className="w-3 h-3 mr-1" /> {item.score}점
                                    </span>
                                    <span className="text-gray-500">{item.time} 소요</span>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}