// frontend/src/NavigationScreen.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';
import { Phone, Check, AlertTriangle, User } from 'lucide-react';
import axios from 'axios';

const KAKAO_APP_KEY = 'e8757f3638207e014bcea23f202b11d8';

export default function NavigationScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { path, routeInfo, searchData } = location.state || {};
    
    // 주행 시뮬레이션 상태
    const [currentPos, setCurrentPos] = useState(path ? path[0] : null);
    const [progress, setProgress] = useState(0); // 0 ~ 100%
    const [isSOSPressed, setIsSOSPressed] = useState(false); // SOS 버튼 누름 상태

    // 🚨 주행 시뮬레이션 (자동으로 마커가 이동함)
    useEffect(() => {
        if (!path || path.length < 2) return;
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1; // 1%씩 이동
            });
        }, 500); // 속도 조절

        return () => clearInterval(interval);
    }, [path]);

    // 진행률에 따라 현재 위치 계산 (선형 보간)
    useEffect(() => {
        if (path && path.length >= 2) {
            const start = path[0];
            const end = path[path.length - 1];
            const lat = start.lat + (end.lat - start.lat) * (progress / 100);
            const lng = start.lng + (end.lng - start.lng) * (progress / 100);
            setCurrentPos({ lat, lng });
        }
    }, [progress, path]);

    if (!path) return <div>경로 데이터 없음</div>;

    // SOS 버튼 롱프레스 이벤트 핸들러
    let pressTimer;
    const startPress = () => {
        setIsSOSPressed(true);
        pressTimer = setTimeout(() => {
            alert("🚨 SOS 긴급 알림이 전송되었습니다!");
            // 실제 문자 전송 로직 (window.location.href = 'sms:...')
        }, 2000); // 2초
    };
    const endPress = () => {
        setIsSOSPressed(false);
        clearTimeout(pressTimer);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans relative">
            
            {/* 1. 상단 지도 (실시간 이동) */}
            <div className="h-[45vh] w-full relative">
                <Map center={currentPos} style={{ width: "100%", height: "100%" }} level={3} appkey={KAKAO_APP_KEY}>
                    <MapMarker position={currentPos} image={{src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png", size: {width: 40, height: 42}}} />
                    <Polyline path={[path]} strokeWeight={8} strokeColor={"#3b82f6"} strokeOpacity={0.7} />
                    <Polyline path={[[path[0], currentPos]]} strokeWeight={8} strokeColor={"#ef4444"} strokeOpacity={1} /> {/* 지나온 길 빨간색 */}
                </Map>
                
                {/* 상단 정보 카드 (떠있는 UI) */}
                <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-xl z-10 flex justify-between items-center border border-gray-100">
                    <div>
                        <div className="text-xs text-gray-500">남은 시간</div>
                        <div className="text-2xl font-bold text-blue-600">{routeInfo?.time || '15분'}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500">예상 도착</div>
                        <div className="text-lg font-bold text-gray-800">오후 10:30</div>
                    </div>
                </div>
            </div>

            {/* 2. 하단 컨트롤 영역 */}
            <div className="flex-1 bg-gray-50 p-6 flex flex-col items-center">
                
                {/* 보호자 모니터링 표시 */}
                <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="flex items-center text-sm font-bold text-gray-700 mb-3">
                        <User className="w-4 h-4 mr-2 text-blue-500" /> 실시간 지켜보는 중
                    </div>
                    <div className="flex space-x-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center">● 엄마</span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center">● 아빠</span>
                    </div>
                </div>

                {/* 🚨 SOS 버튼 (빅 버튼) */}
                <div className="flex-1 flex flex-col items-center justify-center w-full">
                    <p className="text-sm text-gray-500 mb-4 font-medium">위험 시 2초간 길게 눌러주세요</p>
                    <button
                        onMouseDown={startPress} onMouseUp={endPress} onMouseLeave={endPress}
                        onTouchStart={startPress} onTouchEnd={endPress}
                        className={`w-40 h-40 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-200 ${isSOSPressed ? 'bg-red-700 scale-95' : 'bg-red-600 hover:bg-red-500'} border-4 border-white ring-4 ring-red-100`}
                    >
                        <AlertTriangle className="w-12 h-12 mb-1" />
                        <span className="text-3xl font-black tracking-widest">SOS</span>
                    </button>
                </div>

                {/* 하단 버튼 그룹 */}
                <div className="w-full mt-6 space-y-3">
                    <a href="tel:112" className="block w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold text-center shadow-sm hover:bg-gray-50">
                        <Phone className="w-4 h-4 inline mr-2" /> 112 긴급 신고
                    </a>
                    <button 
                        onClick={() => { alert("안전 귀가 완료! 수고하셨습니다."); navigate('/'); }}
                        className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-green-700 flex items-center justify-center"
                    >
                        <Check className="w-5 h-5 mr-2" /> 안전하게 도착했어요
                    </button>
                </div>
            </div>
        </div>
    );
}