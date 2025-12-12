// frontend/src/MyReportsScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, MapPin, Clock, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'sonner';

// 🚨 ngrok 주소 확인
const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev';

export default function MyReportsScreen({ userUid }) {
    const navigate = useNavigate();
    const [myReports, setMyReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. 내 신고 내역 불러오기
    const fetchMyReports = async () => {
        if (!userUid) return;
        try {
            // 서버에 "내 UID로 쓴 글만 줘!" 요청
            const response = await axios.get(`${API_BASE_URL}/api/reports/user/${userUid}`);
            setMyReports(response.data);
        } catch (error) {
            console.error("내역 로드 실패:", error);
            toast.error("내역을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyReports();
    }, [userUid]);

    // 2. 삭제 함수
    const handleDelete = async (reportId) => {
        if (!window.confirm("정말 이 신고를 삭제하시겠습니까?")) return;

        try {
            // 삭제 요청 (내 UID를 같이 보내서 본인 인증)
            await axios.delete(`${API_BASE_URL}/api/reports/${reportId}`, {
                data: { uid: userUid } 
            });
            toast.success("삭제되었습니다.");
            fetchMyReports(); // 목록 새로고침
        } catch (error) {
            toast.error("삭제 실패: " + (error.response?.data?.error || "오류 발생"));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-10">
            {/* 헤더 */}
            <header className="bg-white p-4 border-b border-gray-100 shadow-sm sticky top-0 z-10 flex items-center">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">내 신고 내역</h1>
            </header>

            {/* 리스트 영역 */}
            <main className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
                ) : myReports.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>작성한 신고 내역이 없습니다.</p>
                        <Link to="/report-board" className="text-blue-500 font-bold mt-2 inline-block">신고하러 가기</Link>
                    </div>
                ) : (
                    myReports.map((report) => (
                        <div key={report.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group">
                            
                            {/* 내용 (클릭 시 상세 이동 가능하도록 Link로 감싸도 됨) */}
                            <div className="pr-8"> {/* 삭제 버튼 자리 확보 */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                        report.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                        {report.type === 'danger' ? '위험' : report.type === 'warning' ? '주의' : '안전'}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" /> {report.displayDate}
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">{report.title}</h3>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{report.content}</p>
                                
                                <div className="flex items-center text-xs text-gray-500">
                                    <MapPin className="w-3.5 h-3.5 mr-1" /> {report.location}
                                </div>
                            </div>

                            {/* 🚨 삭제 버튼 (우측 상단 쓰레기통) */}
                            <button 
                                onClick={() => handleDelete(report.id)}
                                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                title="삭제하기"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}