// frontend/src/MainScreen.js

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Map as MapIcon, X, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

export default function MainScreen({ userUid }) { 
    const navigate = useNavigate();
    const [stats, setStats] = useState({ safeReturnCount: 0, reportCount: 0 });
    const [contacts, setContacts] = useState([]);
    const [myPos, setMyPos] = useState(null);
    
    // 🚨 SOS 모달 상태 관리
    const [showSOSModal, setShowSOSModal] = useState(false);
    const [progress, setProgress] = useState(0); // 게이지 (0~100)
    const [isSent, setIsSent] = useState(false); // 전송 완료 여부
    const requestRef = useRef(null);
    const startTimeRef = useRef(null);

    // 1. 내 위치 확보
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => console.error("위치 권한 필요"),
            { enableHighAccuracy: true }
        );
    }, []);

    // 2. 데이터 불러오기
    useEffect(() => {
        const fetchData = async () => {
            if (!userUid) return;
            try {
                const userRes = await axios.get(`${API_BASE_URL}/api/users/${userUid}`);
                setStats({
                    safeReturnCount: userRes.data.stats?.safeReturnCount || 0,
                    reportCount: userRes.data.stats?.reportCount || 0
                });

                const contactRes = await axios.get(`${API_BASE_URL}/api/contacts/${userUid}`);
                setContacts(contactRes.data);
            } catch (error) {
                console.error("데이터 로드 실패:", error);
            }
        };
        fetchData();
    }, [userUid]);

    // 🚨 3. SOS 게이지 로직 (핵심)
    const startHolding = () => {
        if (!myPos) {
            toast.error("위치 정보를 가져오는 중입니다...");
            return;
        }
        if (isSent) return;

        startTimeRef.current = Date.now();
        setIsSent(false);

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min((elapsed / 2000) * 100, 100); // 2초 동안 0->100
            
            setProgress(newProgress);

            if (newProgress < 100) {
                requestRef.current = requestAnimationFrame(animate);
            } else {
                // 100% 도달 시 발송
                handleSOSSend();
            }
        };
        requestRef.current = requestAnimationFrame(animate);
    };

    const stopHolding = () => {
        if (isSent) return; // 이미 보내졌으면 취소 안 함
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        setProgress(0); // 게이지 초기화
    };

    // 4. 실제 문자 발송 함수
    const handleSOSSend = () => {
        setIsSent(true);
        if (contacts.length === 0) {
            if(window.confirm("등록된 비상연락처가 없습니다.\n112로 연결하시겠습니까?")) {
                window.location.href = 'tel:112';
            }
            setIsSent(false);
            setProgress(0);
            return;
        }

        const phoneNumbers = contacts.map(c => c.phone).join(',');
        const message = `[SafeWay 긴급] 도와주세요! 현재 위험한 상황입니다.\n위치: https://map.kakao.com/link/map/${myPos.lat},${myPos.lng}`;
        
        const separator = navigator.userAgent.match(/iPhone|iPad/i) ? '&' : '?';
        const smsLink = `sms:${phoneNumbers}${separator}body=${encodeURIComponent(message)}`;
        
        // 약간의 딜레이 후 실행 (UI 효과 보여주기 위함)
        setTimeout(() => {
            window.location.href = smsLink;
            toast.success("메시지 앱을 엽니다.");
            // 전송 후 모달 닫기
            setTimeout(() => {
                setShowSOSModal(false);
                setIsSent(false);
                setProgress(0);
            }, 1000);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
            <header className="bg-white p-4 border-b flex items-center justify-between shadow-sm sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Shield className="w-6 h-6 text-blue-500 mr-2" /> SafeWay
                </h1>
                <p className="text-gray-500 text-sm">안전한 귀가를 함께합니다</p>
            </header>

            <main className="flex-grow p-4 space-y-6 pb-24"> 
                {/* 통계 카드 */}
                <section className="flex space-x-4">
                    <div className="flex-1 bg-blue-600 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                        <div className="text-4xl font-extrabold">{stats.safeReturnCount}회</div>
                        <p className="text-sm opacity-90 mt-2">총 안전 귀가</p>
                    </div>
                    <div className="flex-1 bg-cyan-500 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                        <div className="text-4xl font-extrabold">{stats.reportCount}건</div>
                        <p className="text-sm opacity-90 mt-2">나의 신고</p>
                    </div>
                </section>
                
                {/* 빠른 실행 */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">빠른 실행</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => navigate('/route/search')} className="bg-white p-5 rounded-xl shadow-md border hover:bg-gray-100 transition-colors flex flex-col items-center justify-center">
                            <MapIcon className="w-8 h-8 text-green-500 mb-2" /> 
                            <p className="font-semibold text-gray-800">경로 검색</p>
                        </button>
                        <button onClick={() => navigate('/contacts')} className="bg-white p-5 rounded-xl shadow-md border hover:bg-gray-100 transition-colors flex flex-col items-center justify-center">
                            <Users className="w-8 h-8 text-blue-500 mb-2" />
                            <p className="font-semibold text-gray-800">긴급 연락처</p>
                        </button>
                    </div>
                </section>

                {/* 안전 수칙 */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">안전 수칙</h2>
                    <ul className="bg-white p-4 rounded-xl shadow-md space-y-2 text-sm text-gray-700">
                        <li>• 밝은 곳으로 이동하고 어두운 골목은 피하세요.</li>
                        <li>• 이어폰 사용을 자제하고 주변을 살피세요.</li>
                        <li>• 위험을 느끼면 즉시 SOS 버튼을 눌러주세요.</li>
                    </ul>
                </section>

                {/* 긴급 전화번호 */}
                <section>
                    <h2 className="text-lg font-bold text-gray-800 mb-3">긴급 전화번호</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <a href="tel:112" className="block bg-red-50 border border-red-100 p-5 rounded-2xl active:scale-95 transition-transform hover:bg-red-100">
                            <div className="text-xs font-bold text-gray-600 mb-1">경찰 신고</div>
                            <div className="text-3xl font-extrabold text-red-600">112</div>
                        </a>
                        <a href="tel:182" className="block bg-red-50 border border-red-100 p-5 rounded-2xl active:scale-95 transition-transform hover:bg-red-100">
                            <div className="text-xs font-bold text-gray-600 mb-1">범죄 신고</div>
                            <div className="text-3xl font-extrabold text-red-600">182</div>
                        </a>
                    </div>
                </section>
            </main>

            {/* 🚨 메인화면 SOS 플로팅 버튼 (누르면 모달 열림) */}
            <button 
                onClick={() => setShowSOSModal(true)}
                className="fixed bottom-24 right-4 bg-red-500 text-white p-4 rounded-full shadow-lg shadow-red-300 hover:bg-red-600 hover:scale-105 transition-all z-40 flex items-center justify-center border-4 border-white animate-pulse"
            >
                <span className="font-black text-xs">SOS</span>
            </button>

            {/* 🚨🚨🚨 SOS 전용 풀스크린 모달 🚨🚨🚨 */}
            {showSOSModal && (
                <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
                    {/* 닫기 버튼 */}
                    <button 
                        onClick={() => { setShowSOSModal(false); setProgress(0); }}
                        className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                        <X className="w-8 h-8 text-gray-600" />
                    </button>

                    <h2 className="text-3xl font-black text-gray-900 mb-2">SOS 긴급 호출</h2>
                    <p className="text-gray-500 mb-12 text-center px-4">
                        버튼을 <span className="text-red-500 font-bold">2초간 꾹 누르면</span><br/>
                        보호자 <span className="font-bold text-gray-800">{contacts.length}명</span>에게 문자가 전송됩니다.
                    </p>

                    {/* 🔴 게이지 버튼 (SVG 애니메이션 적용) */}
                    <div className="relative mb-10">
                        {/* 배경 원 */}
                        <svg className="w-64 h-64 transform -rotate-90">
                            <circle
                                cx="128" cy="128" r="120"
                                stroke="#fee2e2" strokeWidth="12" fill="none"
                            />
                            {/* 게이지 원 */}
                            <circle
                                cx="128" cy="128" r="120"
                                stroke="#ef4444" strokeWidth="12" fill="none"
                                strokeDasharray={2 * Math.PI * 120}
                                strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                                className="transition-all duration-[50ms] ease-linear"
                            />
                        </svg>

                        {/* 실제 누르는 버튼 (가운데) */}
                        <button
                            onMouseDown={startHolding} onMouseUp={stopHolding} onMouseLeave={stopHolding}
                            onTouchStart={startHolding} onTouchEnd={stopHolding}
                            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full shadow-2xl flex flex-col items-center justify-center transition-all ${isSent ? 'bg-green-500' : 'bg-red-500 active:scale-95'}`}
                        >
                            {isSent ? (
                                <>
                                    <Check className="w-16 h-16 text-white mb-2" />
                                    <span className="text-white font-bold text-xl">전송 완료!</span>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-16 h-16 text-white mb-2" />
                                    <span className="text-white font-black text-3xl tracking-widest">SOS</span>
                                    {progress > 0 && progress < 100 && (
                                        <span className="text-white/90 text-sm mt-1 font-medium">전송 중...</span>
                                    )}
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-sm text-gray-400 font-medium animate-pulse">
                        {isSent ? "잠시 후 화면이 닫힙니다." : "위급 상황 시 꾹 눌러주세요"}
                    </p>
                </div>
            )}
        </div>
    );
}