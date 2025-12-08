// frontend/src/ReportBoardScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios'; // 🚨 통신 모듈 추가
import { ArrowLeft, Plus, MapPin, ThumbsUp, MessageSquare, X } from 'lucide-react';
import { Link } from 'react-router-dom';

// 🚨 ngrok 주소 확인 (바뀌었다면 수정 필수!)
const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

export default function ReportBoardScreen({ userUid }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 1. 신고 목록 불러오기 (GET)
    const fetchReports = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/reports`);
            setReports(response.data);
        } catch (error) {
            console.error("목록 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    // 화면이 켜지면 목록 불러오기
    useEffect(() => {
        fetchReports();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 border-b shadow-sm flex items-center sticky top-0 z-10">
                <Link to="/" className="mr-4 text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">위험 지역 신고</h1>
            </header>

            <main className="flex-grow p-4 space-y-4 overflow-y-auto">
                {loading ? (
                    <div className="text-center p-10 text-gray-500">로딩 중...</div>
                ) : reports.length === 0 ? (
                    <div className="text-center p-10 text-gray-400">
                        <p>등록된 신고가 없습니다.</p>
                        <p className="text-sm mt-2">첫 번째 신고를 남겨보세요!</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        // 클릭 시 상세 화면으로 이동
                        <Link 
                            to={`/report-board/${report.id}`} 
                            state={{ report: report }} 
                            key={report.id} 
                            className="block bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98]"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                        report.type === 'danger' ? 'bg-red-100 text-red-600' : 
                                        report.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
                                        'bg-green-100 text-green-600'
                                    }`}>
                                        {report.type === 'danger' ? '위험' : report.type === 'warning' ? '주의' : '안전'}
                                    </span>
                                    <h3 className="font-bold text-gray-800 text-lg">{report.title}</h3>
                                </div>
                                <span className="text-xs text-gray-400">{report.displayDate}</span>
                            </div>

                            <div className="flex items-center text-gray-500 text-sm mb-3">
                                <MapPin className="w-4 h-4 mr-1" />
                                {report.location} <span className="mx-2 text-gray-300">|</span> {report.writer}
                            </div>

                            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                                {report.content}
                            </p>

                            <div className="flex items-center space-x-4 border-t pt-3">
                                <span className="flex items-center text-gray-500 text-sm">
                                    <ThumbsUp className="w-4 h-4 mr-1.5" /> 좋아요 {report.likes || 0}
                                </span>
                                <span className="flex items-center text-gray-500 text-sm">
                                    <MessageSquare className="w-4 h-4 mr-1.5" /> 댓글 {report.comments || 0}
                                </span>
                            </div>
                        </Link>
                    ))
                )}
            </main>

            {/* 글쓰기 버튼 */}
            <button 
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-24 right-6 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition-transform active:scale-95 z-20 flex items-center justify-center"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* 글쓰기 모달 */}
            {isModalOpen && (
                <AddReportModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={fetchReports} // 🚨 성공 시 목록 새로고침
                    userUid={userUid}        // 🚨 사용자 UID 전달
                />
            )}
        </div>
    );
}

// 🚨 신고 등록 모달 (기능 구현됨)
function AddReportModal({ isOpen, onClose, onSuccess, userUid }) {
    const [formData, setFormData] = useState({ title: '', type: 'danger', content: '', location: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 로그인 체크
        if (!userUid) return alert("로그인이 필요합니다. 다시 로그인해주세요.");

        try {
            // 🚨 백엔드 저장 API 호출 (POST)
            await axios.post(`${API_BASE_URL}/api/reports`, {
                uid: userUid,
                ...formData
            });
            alert("신고가 등록되었습니다.");
            onSuccess(); // 목록 새로고침 호출
            onClose();   // 모달 닫기
        } catch (error) {
            alert("등록 실패: " + (error.response?.data?.error || error.message));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                <h2 className="text-xl font-bold mb-6 text-gray-800">새 신고 등록</h2>
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                        <input type="text" required placeholder="어떤 위험인가요?" className="w-full p-3 border rounded-xl"
                            onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                        <input type="text" required placeholder="위치를 입력해주세요 (예: 강남역 10번 출구)" className="w-full p-3 border rounded-xl"
                            onChange={e => setFormData({...formData, location: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                        <div className="flex space-x-2">
                            {['danger', 'warning', 'safe'].map(t => (
                                <button type="button" key={t} 
                                    className={`flex-1 py-2 border rounded-lg text-sm font-bold ${formData.type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}
                                    onClick={() => setFormData({...formData, type: t})}>
                                    {t === 'danger' ? '위험' : t === 'warning' ? '주의' : '안전'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                        <textarea required rows="3" placeholder="상세 내용을 적어주세요" className="w-full p-3 border rounded-xl resize-none"
                            onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
                    </div>
                    
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
                        등록하기
                    </button>
                </form>
            </div>
        </div>
    );
}