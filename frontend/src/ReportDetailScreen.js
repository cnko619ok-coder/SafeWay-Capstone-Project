// frontend/src/ReportDetailScreen.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin, Clock, ThumbsUp, MessageSquare, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev';

export default function ReportDetailScreen({ userUid }) {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]); // 댓글 목록

    // 1. 데이터 불러오기
    useEffect(() => {
        fetchReportDetail();
        fetchComments(); // 댓글도 불러오기
    }, [id]);

    const fetchReportDetail = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/reports/detail/${id}`);
            setReport(response.data);
        } catch (error) {
            console.error(error);
            toast.error("글을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 🚨 댓글 목록 가져오기
    const fetchComments = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/reports/${id}/comments`);
            setComments(res.data);
        } catch (e) { console.error("댓글 로드 실패", e); }
    };

    const handleLike = async () => {
        if (!userUid) return toast.error("로그인이 필요합니다.");
        try {
            const res = await axios.post(`${API_BASE_URL}/api/reports/${id}/like`, { uid: userUid });
            setReport(prev => ({ ...prev, likes: res.data.liked ? (prev.likes || 0) + 1 : (prev.likes || 0) - 1 }));
            toast.success(res.data.message);
        } catch (e) { toast.error("실패"); }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        if (!userUid) return toast.error("로그인이 필요합니다.");

        try {
            await axios.post(`${API_BASE_URL}/api/reports/${id}/comments`, { uid: userUid, content: commentText });
            toast.success("댓글 등록 완료");
            setCommentText('');
            fetchComments(); // 🚨 목록 갱신
            setReport(prev => ({ ...prev, comments: (prev.comments || 0) + 1 }));
        } catch (e) { toast.error("댓글 등록 실패"); }
    };

    const handleDeleteReport = async () => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            // 🚨 data 속성에 uid를 담아서 보내야 서버가 인식합니다.
            await axios.delete(`${API_BASE_URL}/api/reports/${id}`, { data: { uid: userUid } });
            toast.success("삭제되었습니다.");
            navigate(-1);
        } catch (e) { toast.error("삭제 실패"); }
    };

    if (loading) return <div className="text-center p-10">로딩 중...</div>;
    if (!report) return <div className="text-center p-10">데이터가 없습니다.</div>;

    const isMyReport = report.uid === userUid;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <header className="bg-white p-4 flex items-center justify-between border-b sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>
                    <h1 className="text-lg font-bold">신고 상세</h1>
                </div>
                {isMyReport && (
                    <button onClick={handleDeleteReport} className="text-red-500 hover:bg-red-50 p-2 rounded-full"><Trash2 className="w-5 h-5" /></button>
                )}
            </header>

            <main className="p-5 space-y-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${report.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            {report.type === 'danger' ? '위험' : report.type === 'warning' ? '주의' : '안전'}
                        </span>
                        <span className="text-xs text-gray-400"><Clock className="w-3 h-3 inline mr-1" />{report.displayDate}</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">{report.title}</h2>
                    <p className="text-sm text-gray-500 mb-4"><MapPin className="w-4 h-4 inline mr-1" />{report.location} | 작성자: {report.writer}</p>
                    <hr className="my-4" />
                    <p className="text-gray-700 whitespace-pre-wrap">{report.content}</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={handleLike} className="flex-1 bg-white p-3 rounded-xl border flex justify-center gap-2 font-bold text-gray-600">
                        <ThumbsUp className="w-5 h-5" /> 좋아요 {report.likes || 0}
                    </button>
                    <div className="flex-1 bg-white p-3 rounded-xl border flex justify-center gap-2 font-bold text-gray-600">
                        <MessageSquare className="w-5 h-5" /> 댓글 {comments.length}
                    </div>
                </div>

                {/* 🚨 댓글 목록 렌더링 */}
                <div className="space-y-3">
                    {comments.map((comment, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border shadow-sm">
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-sm text-gray-700">{comment.writer}</span>
                                <span className="text-xs text-gray-400">{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : '방금'}</span>
                            </div>
                            <p className="text-gray-800 text-sm">{comment.content}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border sticky bottom-4">
                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                        <input type="text" className="flex-grow bg-gray-50 border rounded-xl px-4 py-2 text-sm outline-none" placeholder="댓글 입력..." value={commentText} onChange={e => setCommentText(e.target.value)} />
                        <button type="submit" className="bg-blue-600 text-white p-2 rounded-xl"><Send className="w-5 h-5" /></button>
                    </form>
                </div>
            </main>
        </div>
    );
}