// frontend/src/ReportDetailScreen.js

import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, ThumbsUp, MessageSquare, Send, User } from 'lucide-react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

const KAKAO_APP_KEY = '15b6d60e4095cdc453d99c4883ad6e6d';

export default function ReportDetailScreen() {
    const location = useLocation();
    const { report } = location.state || {}; // 목록에서 넘겨준 데이터 받기

    // 댓글 상태 관리 (임시)
    const [comment, setComment] = useState('');
    const [commentsList, setCommentsList] = useState([
        { id: 1, user: '안전이', content: '저도 어제 그곳을 지나갔는데 정말 어두워서 무서웠어요. 정보 감사합니다!', time: '1시간 전', likes: 5 },
        { id: 2, user: '조심이', content: '가로등이 빨리 수리되었으면 좋겠네요.', time: '30분 전', likes: 2 },
    ]);

    const handleAddComment = (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        
        // 새 댓글 추가 (임시)
        const newComment = {
            id: Date.now(),
            user: '나',
            content: comment,
            time: '방금 전',
            likes: 0
        };
        setCommentsList([newComment, ...commentsList]);
        setComment('');
    };

    if (!report) return <div className="p-10 text-center">데이터가 없습니다.</div>;

    // 지도 중심 좌표 (데이터가 없으면 기본값)
    // 실제로는 report.lat, report.lng가 있어야 하지만, 없으면 서울 시청으로
    const center = { lat: 37.5668, lng: 126.9790 }; 

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            
            {/* 1. 상단 지도 영역 (40%) */}
            <div className="w-full h-[40vh] relative z-0">
                <Map
                    center={center}
                    style={{ width: "100%", height: "100%" }}
                    level={3}
                    appkey={KAKAO_APP_KEY}
                >
                    <MapMarker position={center} />
                </Map>
                <Link to="/report-board" className="absolute top-4 left-4 z-10 bg-white p-2 rounded-full shadow-md text-gray-700">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
            </div>

            {/* 2. 상세 내용 영역 (위로 겹치게) */}
            <div className="flex-grow bg-white rounded-t-3xl -mt-6 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] p-6 flex flex-col overflow-y-auto">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

                {/* 제목 및 정보 */}
                <div className="mb-6 border-b pb-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            report.type === 'danger' ? 'bg-red-100 text-red-600' : 
                            report.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
                            'bg-green-100 text-green-600'
                        }`}>
                            {report.type === 'danger' ? '위험' : report.type === 'warning' ? '주의' : '안전'}
                        </span>
                        <span className="text-xs text-gray-400">{report.displayDate || '방금 전'}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{report.title}</h1>
                    <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" /> {report.location}
                    </div>
                </div>

                {/* 본문 내용 */}
                <p className="text-gray-700 leading-relaxed mb-8 whitespace-pre-wrap">
                    {report.content}
                </p>

                {/* 좋아요/댓글 수 */}
                <div className="flex items-center space-x-4 text-gray-500 text-sm mb-6">
                    <button className="flex items-center hover:text-blue-500">
                        <ThumbsUp className="w-5 h-5 mr-1.5" /> 좋아요 {report.likes || 0}
                    </button>
                    <div className="flex items-center">
                        <MessageSquare className="w-5 h-5 mr-1.5" /> 댓글 {commentsList.length}
                    </div>
                </div>

                {/* 댓글 입력창 */}
                <form onSubmit={handleAddComment} className="relative mb-6">
                    <input 
                        type="text" 
                        placeholder="댓글을 입력하세요..." 
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Send className="w-5 h-5" />
                    </button>
                </form>

                {/* 댓글 목록 */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800">댓글 {commentsList.length}개</h3>
                    {commentsList.map((c) => (
                        <div key={c.id} className="flex space-x-3">
                            <div className="bg-gray-100 p-2 rounded-full h-8 w-8 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="flex-1 bg-gray-50 p-3 rounded-xl rounded-tl-none">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm text-gray-700">{c.user}</span>
                                    <span className="text-xs text-gray-400">{c.time}</span>
                                </div>
                                <p className="text-sm text-gray-600">{c.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}