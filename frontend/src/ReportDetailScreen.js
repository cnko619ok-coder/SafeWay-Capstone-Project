// frontend/src/ReportDetailScreen.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin, Clock, ThumbsUp, MessageSquare, AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev';

export default function ReportDetailScreen({ userUid }) {
    const { id } = useParams(); // URL에서 글 ID 가져오기
    const navigate = useNavigate();
    
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]); // 댓글 목록 (추후 API 연동 시 사용)

    // 1. 게시글 상세 정보 불러오기
    const fetchReportDetail = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/reports/detail/${id}`);
            setReport(response.data);
            // 댓글 불러오기 로직도 여기에 추가 가능
        } catch (error) {
            console.error("상세 정보 로드 실패:", error);
            toast.error("글을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportDetail();
    }, [id]);

    // 2. 좋아요 기능
    const handleLike = async () => {
        if (!userUid) return toast.error("로그인이 필요합니다.");
        try {
            const res = await axios.post(`${API_BASE_URL}/api/reports/${id}/like`, { uid: userUid });
            // 화면 숫자 즉시 업데이트
            setReport(prev => ({
                ...prev,
                likes: res.data.liked ? (prev.likes || 0) + 1 : (prev.likes || 0) - 1
            }));
            toast.success(res.data.message);
        } catch (e) {
            toast.error("좋아요 실패");
        }
    };

    // 3. 댓글 작성 기능
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        if (!userUid) return toast.error("로그인이 필요합니다.");

        try {
            await axios.post(`${API_BASE_URL}/api/reports/${id}/comments`, {
                uid: userUid,
                content: commentText
            });
            toast.success("댓글이 등록되었습니다.");
            setCommentText('');
            // 댓글 수 즉시 업데이트
            setReport(prev => ({ ...prev, comments: (prev.comments || 0) + 1 }));
            // 실제로는 댓글 목록도 다시 불러와야 함
        } catch (e) {
            toast.error("댓글 등록 실패");
        }
    };

    if (loading) return <div className="text-center p-10">로딩 중...</div>;
    if (!report) return <div className="text-center p-10">데이터가 없습니다.</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* 헤더 */}
            <header className="bg-white p-4 flex items-center border-b sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-lg font-bold">신고 상세</h1>
            </header>

            <main className="p-5 space-y-4">
                {/* 제목 및 상태 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            report.type === 'danger' ? 'bg-red-100 text-red-600' : 
                            report.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
                            'bg-green-100 text-green-600'
                        }`}>
                            {report.type === 'danger' ? '위험' : report.type === 'warning' ? '주의' : '안전'}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> {report.displayDate}
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{report.title}</h2>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {report.location}
                        <span className="mx-2 text-gray-300">|</span>
                        작성자: {report.writer}
                    </div>
                    
                    <hr className="border-gray-100 my-4" />
                    
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {report.content}
                    </p>
                </div>

                {/* 좋아요 및 댓글 버튼 */}
                <div className="flex gap-3">
                    <button 
                        onClick={handleLike}
                        className="flex-1 bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2 font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    >
                        <ThumbsUp className="w-5 h-5" />
                        좋아요 {report.likes || 0}
                    </button>
                    <div className="flex-1 bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2 font-bold text-gray-600">
                        <MessageSquare className="w-5 h-5" />
                        댓글 {report.comments || 0}
                    </div>
                </div>

                {/* 댓글 입력창 */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">댓글 작성</h3>
                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="댓글을 입력하세요..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button type="submit" className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition">
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}