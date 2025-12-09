// frontend/src/ReportDetailScreen.js

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, ThumbsUp, MessageSquare, Send, User, Trash2 } from 'lucide-react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

const KAKAO_APP_KEY = 'e8757f3638207e014bcea23f202b11d8';

export default function ReportDetailScreen({ userUid }) {
    const location = useLocation();
    const { report } = location.state || {}; // 목록에서 넘겨준 데이터 받기

    // 댓글 상태 관리 (임시)
    const [comment, setComment] = useState('');
    
    // 🚨 [핵심 수정] 초기 댓글을 로컬 스토리지에서 가져오기
    const [commentsList, setCommentsList] = useState(() => {
        if (!report) return [];
        
        // 브라우저 저장소에서 'comments_글번호'로 저장된 데이터가 있는지 확인
        const savedComments = localStorage.getItem(`comments_${report.id}`);
        
        if (savedComments) {
            return JSON.parse(savedComments); // 저장된 게 있으면 그거 사용
        } else {
            // 없으면 기본 가짜 댓글 보여주기
            return [
                { id: 1, uid: 'other-1', user: '안전이', content: '저도 어제 그곳을 지나갔는데 정말 어두워서 무서웠어요.', time: '1시간 전' },
                { id: 2, uid: 'other-2', user: '조심이', content: '가로등이 빨리 수리되었으면 좋겠네요.', time: '30분 전' },
            ];
        }
    });

    // 🚨 [핵심 수정] 댓글 목록이 바뀔 때마다 로컬 스토리지에 저장
    useEffect(() => {
        if (report && commentsList) {
            localStorage.setItem(`comments_${report.id}`, JSON.stringify(commentsList));
        }
    }, [commentsList, report]);
    const handleAddComment = (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        
        const newComment = {
            id: Date.now(),
            uid: userUid, // 🚨 내 UID를 댓글에 저장 (핵심!)
            user: '나',   // (실제로는 사용자 이름 가져와야 함)
            content: comment,
            time: '방금 전',
        };
        setCommentsList([newComment, ...commentsList]);
        setComment('');
    };

    // 🚨 댓글 삭제 함수
    const handleDeleteComment = (commentId) => {
        if (window.confirm("댓글을 삭제하시겠습니까?")) {
            // 선택한 댓글만 제외하고 목록 업데이트
            setCommentsList(commentsList.filter(c => c.id !== commentId));
        }
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
                        placeholder={userUid ? "댓글을 입력하세요..." : "로그인이 필요합니다."}
                        disabled={!userUid}
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
                        <div key={c.id} className="flex space-x-3 group">
                            <div className="bg-gray-100 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="flex-1 bg-gray-50 p-3 rounded-xl rounded-tl-none relative">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm text-gray-700">{c.user}</span>
                                    <span className="text-xs text-gray-400">{c.time}</span>
                                </div>
                                <p className="text-sm text-gray-600 pr-6">{c.content}</p>

                                {/* 🚨🚨🚨 내 댓글일 때만 삭제 버튼 표시 🚨🚨🚨 */}
                                {userUid && c.uid === userUid && (
                                    <button 
                                        onClick={() => handleDeleteComment(c.id)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="댓글 삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}