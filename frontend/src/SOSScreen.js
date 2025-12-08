// frontend/src/SOSScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SOSScreen() {
    const [isPressing, setIsPressing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isActivated, setIsActivated] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const pressTimer = useRef(null);
    const countdownTimer = useRef(null);

    // 🚨 SOS 발동 시 실행되는 함수 (문자 전송)
    const triggerSOS = () => {
        setIsActivated(true);
        
        // 3초 카운트다운 후 문자 앱 실행
        let count = 3;
        countdownTimer.current = setInterval(() => {
            count--;
            setCountdown(count);
            if (count === 0) {
                clearInterval(countdownTimer.current);
                sendSMS();
            }
        }, 1000);
    };

    const sendSMS = () => {
        // 보호자 연락처 (실제로는 DB에서 가져와야 함)
        const phoneNumbers = "010-1234-5678"; 
        const message = "[SafeWay 긴급 알림] 현재 위험 상황입니다! 제 위치를 확인하고 도와주세요. (위치: 서울시청 부근)";
        
        // 모바일의 문자 앱을 엽니다 (sms: 프로토콜 사용)
        window.location.href = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
        
        alert("🚨 긴급 문자가 전송되었습니다! (실제 기기에서는 문자 앱이 열립니다)");
        setIsActivated(false);
        setCountdown(3);
        setProgress(0);
    };

    // 버튼 누르기 시작
    const handleMouseDown = () => {
        setIsPressing(true);
        let currentProgress = 0;
        pressTimer.current = setInterval(() => {
            currentProgress += 2; // 2%씩 증가
            setProgress(currentProgress);
            if (currentProgress >= 100) {
                clearInterval(pressTimer.current);
                triggerSOS();
            }
        }, 20); // 1초 동안 누르면 발동 (속도 조절 가능)
    };

    // 버튼에서 손 뗄 때 (취소)
    const handleMouseUp = () => {
        if (!isActivated) {
            setIsPressing(false);
            setProgress(0);
            clearInterval(pressTimer.current);
        }
    };

    return (
        <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${isActivated ? 'bg-red-600' : 'bg-white'}`}>
            
            {/* 헤더 */}
            <header className="p-4 flex items-center justify-between absolute top-0 w-full z-10">
                <Link to="/" className={`p-2 rounded-full ${isActivated ? 'text-white hover:bg-red-500' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className={`text-xl font-bold ${isActivated ? 'text-white' : 'text-gray-800'}`}>긴급 호출</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                
                {/* 배경 효과 (발동 시) */}
                {isActivated && (
                    <div className="absolute inset-0 bg-red-600 animate-pulse z-0"></div>
                )}

                <div className="relative z-10">
                    {isActivated ? (
                        <div className="text-white animate-bounce">
                            <AlertTriangle className="w-24 h-24 mx-auto mb-4" />
                            <h2 className="text-3xl font-extrabold mb-2">SOS 전송 중</h2>
                            <p className="text-xl opacity-90 mb-8">{countdown}초 후 문자가 전송됩니다.</p>
                            <button 
                                onClick={() => {
                                    clearInterval(countdownTimer.current);
                                    setIsActivated(false);
                                    setCountdown(3);
                                    setProgress(0);
                                }}
                                className="bg-white text-red-600 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100"
                            >
                                <X className="w-5 h-5 inline mr-2" /> 전송 취소
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">위급 상황인가요?</h2>
                                <p className="text-gray-500">버튼을 꾹 누르면 보호자에게 알림이 갑니다.</p>
                            </div>

                            {/* SOS 버튼 */}
                            <div className="relative w-48 h-48 mx-auto">
                                {/* 진행률 원형 게이지 */}
                                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                    <circle cx="96" cy="96" r="90" stroke="#fee2e2" strokeWidth="12" fill="none" />
                                    <circle 
                                        cx="96" cy="96" r="90" 
                                        stroke="#ef4444" strokeWidth="12" fill="none" 
                                        strokeDasharray="565" 
                                        strokeDashoffset={565 - (565 * progress) / 100}
                                        className="transition-all duration-75"
                                    />
                                </svg>
                                
                                <button
                                    onMouseDown={handleMouseDown}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onTouchStart={handleMouseDown} // 모바일 터치 지원
                                    onTouchEnd={handleMouseUp}
                                    className="absolute inset-2 bg-red-500 hover:bg-red-600 rounded-full flex flex-col items-center justify-center text-white shadow-xl transform active:scale-95 transition-all"
                                >
                                    <span className="text-4xl font-black tracking-widest mb-1">SOS</span>
                                    <span className="text-xs opacity-80">꾹 누르세요</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* 하단 긴급 전화 버튼 */}
            {!isActivated && (
                <div className="p-6 bg-gray-50 border-t">
                    <a href="tel:112" className="flex items-center justify-center w-full bg-white border-2 border-red-100 text-red-500 py-4 rounded-xl font-bold hover:bg-red-50 transition shadow-sm">
                        <Phone className="w-5 h-5 mr-2" />
                        112 경찰서 전화 걸기
                    </a>
                </div>
            )}
        </div>
    );
}