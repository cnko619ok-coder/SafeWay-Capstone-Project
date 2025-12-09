// frontend/src/MyReportsScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, MapPin, ThumbsUp, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

export default function MyReportsScreen({ userUid }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyReports = async () => {
            if (!userUid) return;
            try {
                // 🚨 내 UID를 경로에 붙여서 "내 글만 주세요"라고 요청함
                const response = await axios.get(`${API_BASE_URL}/api/reports/user/${userUid}`);
                setReports(response.data);
            } catch (error) {
                console.error("내역 로드 실패", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyReports();
    }, [userUid]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 border-b shadow-sm flex items-center sticky top-0 z-10">
                <Link to="/profile" className="mr-4 text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">내 신고 내역</h1>
            </header>

            <main className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center p-10 text-gray-500">불러오는 중...</div>
                ) : reports.length === 0 ? (
                    <div className="text-center p-10 text-gray-400">
                        <p>작성한 신고 내역이 없습니다.</p>
                        <Link to="/report-board" className="text-blue-500 text-sm mt-2 inline-block">게시판에서 글쓰기</Link>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                    report.type === 'danger' ? 'bg-red-100 text-red-600' : 
                                    report.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
                                    'bg-green-100 text-green-600'
                                }`}>
                                    {report.type === 'danger' ? '위험' : report.type === 'warning' ? '주의' : '안전'}
                                </span>
                                <span className="text-xs text-gray-400">{report.displayDate}</span>
                            </div>
                            
                            <h3 className="font-bold text-gray-800 text-lg mb-1">{report.title}</h3>
                            <div className="flex items-center text-gray-500 text-sm mb-3">
                                <MapPin className="w-3 h-3 mr-1" /> {report.location}
                            </div>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{report.content}</p>
                            
                            <div className="border-t pt-3 flex text-sm text-gray-400 space-x-3">
                                <span className="flex items-center"><ThumbsUp className="w-4 h-4 mr-1"/> {report.likes || 0}</span>
                                <span className="flex items-center"><MessageSquare className="w-4 h-4 mr-1"/> {report.comments || 0}</span>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}