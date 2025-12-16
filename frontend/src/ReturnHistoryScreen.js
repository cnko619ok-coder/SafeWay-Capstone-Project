// frontend/src/ReturnHistoryScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, MapPin, Clock, ArrowRight, Shield, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from './config';

export default function ReturnHistoryScreen({ userUid }) {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        if (!userUid) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/history/${userUid}`);
            // 데이터가 있는 것만 추림 (빈 껍데기 제거)
            setHistory(res.data);
        } catch (error) {
            console.error("로드 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [userUid]);

    // 개별 삭제
    const handleDelete = async (itemId) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        
        // 화면에서 즉시 삭제
        setHistory(prev => prev.filter(item => item.id !== itemId));

        try {
            await axios.delete(`${API_BASE_URL}/api/history/${userUid}/${itemId}`);
            toast.success("삭제되었습니다.");
        } catch (error) {
            fetchHistory(); // 실패 시 복구
        }
    };

    // 전체 삭제
    const handleDeleteAll = async () => {
        if (!window.confirm("정말 모든 기록을 삭제하시겠습니까?")) return;
        
        setHistory([]); // 화면 비우기

        try {
            await axios.delete(`${API_BASE_URL}/api/history/all/${userUid}`);
            toast.success("전체 삭제 완료");
        } catch (e) {
            toast.error("전체 삭제 실패");
            fetchHistory();
        }
    };

    // 날짜 포맷 함수 (안전장치 포함)
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '날짜 정보 없음';
            return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
        } catch (e) { return '-'; }
    };

    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } catch (e) { return ''; }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-10">
            {/* 헤더 */}
            <header className="bg-white p-4 border-b border-gray-100 shadow-sm sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">귀가 기록</h1>
                </div>
                {history.length > 0 && (
                    <button onClick={handleDeleteAll} className="text-xs text-white bg-red-500 font-bold hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                        전체 삭제
                    </button>
                )}
            </header>

            {/* 리스트 영역 */}
            <main className="p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-20 text-gray-400">로딩 중...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <p>저장된 귀가 기록이 없습니다.</p>
                    </div>
                ) : (
                    history.map((item) => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group">
                            {/* 상단: 날짜 및 소요시간 */}
                            <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                                <div className="flex items-center text-xs text-gray-400">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {formatDate(item.createdAt)}
                                    <span className="mx-2">|</span>
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatTime(item.createdAt)}
                                </div>
                                {/* 우측 상단 삭제 버튼 */}
                                <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* 중간: 출발지 -> 목적지 */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                    <div className="text-xs text-gray-400 mb-1">출발</div>
                                    <div className="font-bold text-gray-800 text-sm truncate">
                                        {/* 예전 데이터는 start가 없을 수 있음 -> name으로 대체하거나 '알 수 없음' 표시 */}
                                        {item.start || item.name || '위치 정보 없음'}
                                    </div>
                                </div>
                                <div className="px-2">
                                    <ArrowRight className="w-5 h-5 text-blue-300" />
                                </div>
                                <div className="flex-1 text-right">
                                    <div className="text-xs text-gray-400 mb-1">도착</div>
                                    <div className="font-bold text-gray-800 text-sm truncate">
                                        {item.end || item.address || '위치 정보 없음'}
                                    </div>
                                </div>
                            </div>

                            {/* 하단: 점수 및 태그 */}
                            <div className="flex items-center space-x-2">
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center">
                                    <Shield className="w-3 h-3 mr-1" /> {item.score || 0}점
                                </span>
                                <span className="text-xs text-gray-400">
                                    {item.time || '0분'} 소요
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}