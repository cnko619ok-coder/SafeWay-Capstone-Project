// frontend/src/SOSScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, AlertTriangle, X, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SOSScreen() {
    const [isPressing, setIsPressing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isActivated, setIsActivated] = useState(false);
    const [countdown, setCountdown] = useState(3);
    
    // 🚨 내 위치 정보 상태 (기본값은 빈 문자열)
    const [locationInfo, setLocationInfo] = useState({
        lat: null,
        lng: null,
        mapLink: ''
    });
    const [locationStatus, setLocationStatus] = useState('위치 파악 중...');

    const pressTimer = useRef(null);
    const countdownTimer = useRef(null);

    // 🚨 1. 화면이 켜지면 내 위치를 미리 가져옵니다.
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationStatus('위치 정보 사용 불가');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                // 구글 지도 링크 생성 (가장 호환성이 좋음)
                const link = `https://www.google.com/maps?q=${lat},${lng}`;
                
                setLocationInfo({ lat, lng, mapLink: link });
                setLocationStatus('현위치 확보 완료');
                console.log("📍 SOS 위치 확보:", link);
            },
            (error) => {
                console.error("위치 파악 실패:", error);
                setLocationStatus('위치 파악 실패 (GPS 확인 필요)');
            },
            { enableHighAccuracy: true } // 높은 정확도 사용
        );
    }, []);

    const triggerSOS = () => {
        setIsActivated(true);
        
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
        const phoneNumbers = "010-1234-5678"; // (나중에 DB에서 가져온 번호로 교체 가능)
        
        // 🚨 2. 확보된 위치 링크를 문자에 포함
        const locationMsg = locationInfo.mapLink 
            ? `현재 제 위치입니다: ${locationInfo.mapLink}` 
            : `(위치 정보를 가져오지 못했습니다)`;
            
        const message = `[SafeWay 긴급 알림] 🚨 지금 위험한 상황입니다! 도와주세요.\n${locationMsg}`;
        
        // 문자 앱 실행
        window.location.href = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
        
        // 문자 앱 실행 후에는 앱의 SOS 상태 초기화
        setTimeout(() => {
            setIsActivated(false);
            setCountdown(3);
            setProgress(0);
        }, 1000);
    };

    const handleMouseDown = () => {
        setIsPressing(true);
        let currentProgress = 0;
        pressTimer.current = setInterval(() => {
            currentProgress += 2; 
            setProgress(currentProgress);
            if (currentProgress >= 100) {
                clearInterval(pressTimer.current);
                triggerSOS();
            }
        }, 20); 
    };

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
                
                {isActivated && <div className="absolute inset-0 bg-red-600 animate-pulse z-0"></div>}

                <div className="relative z-10 w-full max-w-xs">
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
                            <div className="mb-10">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">위급 상황인가요?</h2>
                                <p className="text-gray-500">버튼을 꾹 누르면 보호자에게<br/>현재 위치와 알림이 전송됩니다.</p>
                                
                                {/* 🚨 위치 상태 표시 (GPS 잡혔는지 확인용) */}
                                <div className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${locationInfo.lat ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {locationStatus}
                                </div>
                            </div>

                            {/* SOS 버튼 */}
                            <div className="relative w-56 h-56 mx-auto select-none touch-none">
                                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                    <circle cx="112" cy="112" r="106" stroke="#fee2e2" strokeWidth="12" fill="none" />
                                    <circle 
                                        cx="112" cy="112" r="106" 
                                        stroke="#ef4444" strokeWidth="12" fill="none" 
                                        strokeDasharray="666" 
                                        strokeDashoffset={666 - (666 * progress) / 100}
                                        strokeLinecap="round"
                                        className="transition-all duration-75"
                                    />
                                </svg>
                                
                                <button
                                    onMouseDown={handleMouseDown}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onTouchStart={handleMouseDown}
                                    onTouchEnd={handleMouseUp}
                                    className="absolute inset-3 bg-red-500 hover:bg-red-600 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transform active:scale-95 transition-all"
                                >
                                    <span className="text-5xl font-black tracking-widest mb-1 drop-shadow-md">SOS</span>
                                    <span className="text-sm opacity-90 font-medium">2초간 꾹 누르세요</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>

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