// frontend/src/NavigationScreen.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';
import { Phone, Check, AlertTriangle, User, Eye } from 'lucide-react';
import axios from 'axios';

const KAKAO_APP_KEY = 'e8757f3638207e014bcea23f202b11d8';

// 1. 커스텀 마커 이미지 정의
const MARKER_IMGS = {
    start: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_b.png", // 출발 (빨강)
    end: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_b.png", // 도착 (파랑)
    user: "https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png", // 내 위치 (파란 점)
};

export default function NavigationScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { path, routeInfo } = location.state || {};
    
    // 상태 관리
    const [map, setMap] = useState(null);
    const [currentPos, setCurrentPos] = useState(path ? path[0] : null); // 내 위치
    const [passedPath, setPassedPath] = useState([]); // 지나온 길
    const [remainPath, setRemainPath] = useState(path || []); // 남은 길
    
    const [isSOSPressed, setIsSOSPressed] = useState(false);
    const [info, setInfo] = useState({ time: routeInfo?.time || "계산중", dist: "..." });
    const watchId = useRef(null);

    // 유틸리티: 두 좌표 간 거리 계산 (Haversine formula)
    const getDist = (lat1, lng1, lat2, lng2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI/180, φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180, Δλ = (lng2-lng1) * Math.PI/180;
        const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)*Math.sin(Δλ/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    // 🚨 실제 위치 추적 (자동 이동 X, GPS 기반 O)
    useEffect(() => {
        if (!path || path.length === 0 || !navigator.geolocation) return;

        // 위치 감시 시작
        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                const newLat = pos.coords.latitude;
                const newLng = pos.coords.longitude;
                const newPos = { lat: newLat, lng: newLng };
                
                setCurrentPos(newPos);
                if (map) map.panTo(new window.kakao.maps.LatLng(newLat, newLng)); // 지도 중심 이동

                // 경로 상에서 현재 위치와 가장 가까운 점 찾기 (경로 쪼개기)
                let minDist = Infinity;
                let splitIdx = 0;
                path.forEach((p, i) => {
                    const d = getDist(newLat, newLng, p.lat, p.lng);
                    if (d < minDist) { minDist = d; splitIdx = i; }
                });

                // 지나온 길 vs 남은 길 분리
                setPassedPath(path.slice(0, splitIdx + 1)); // 0 ~ 현재
                setRemainPath([newPos, ...path.slice(splitIdx + 1)]); // 현재 ~ 끝

                // 도착 체크 (20m 이내)
                const end = path[path.length - 1];
                if (getDist(newLat, newLng, end.lat, end.lng) < 20) {
                    alert("도착했습니다!");
                    navigator.geolocation.clearWatch(watchId.current);
                    navigate('/');
                }
            },
            (err) => console.error("GPS 오류:", err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId.current);
    }, [path, map]);

    // SOS 버튼 (꾹 누르기)
    let timer;
    const startSOS = () => {
        setIsSOSPressed(true);
        timer = setTimeout(() => {
            window.location.href = 'sms:112?body=SOS!%20도와주세요!';
            alert("🚨 보호자에게 위치가 전송되었습니다!");
            setIsSOSPressed(false);
        }, 2000);
    };
    const endSOS = () => { setIsSOSPressed(false); clearTimeout(timer); };

    if (!path) return <div>데이터 없음</div>;

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans relative">
            
            {/* 1. 상단 지도 (실시간 이동) */}
            <div className="h-[55vh] w-full relative">
                <Map center={path[0]} style={{ width: "100%", height: "100%" }} level={2} appkey={KAKAO_APP_KEY} onCreate={setMap}>
                    
                    {/* 마커들 (이미지 변경됨) */}
                    <MapMarker position={path[0]} image={{src: MARKER_IMGS.start, size: {width: 40, height: 45}}} title="출발" />
                    <MapMarker position={path[path.length-1]} image={{src: MARKER_IMGS.end, size: {width: 40, height: 45}}} title="도착" />
                    
                    {/* 내 위치 마커 (커스텀 오버레이로 예쁘게) */}
                    {currentPos && (
                        <CustomOverlayMap position={currentPos} zIndex={99}>
                            <div className="relative flex items-center justify-center">
                                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg z-10"></div>
                                <div className="absolute w-10 h-10 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                            </div>
                        </CustomOverlayMap>
                    )}

                    {/* 🚨 경로 그리기 */}
                    {/* 지나온 길 (회색, 흐리게) */}
                    <Polyline path={[passedPath]} strokeWeight={6} strokeColor={"#9ca3af"} strokeOpacity={0.5} strokeStyle={"solid"} />
                    {/* 남은 길 (파란색, 진하게) */}
                    <Polyline path={[remainPath]} strokeWeight={8} strokeColor={"#3b82f6"} strokeOpacity={1} strokeStyle={"solid"} />
                </Map>

                {/* 상단 정보창 */}
                <div className="absolute bottom-6 left-6 right-6 bg-white p-5 rounded-3xl shadow-xl z-10 border border-gray-100 flex justify-between items-center">
                    <div>
                        <div className="text-xs text-gray-400 font-bold mb-1">남은 시간</div>
                        <div className="text-3xl font-extrabold text-gray-800">{routeInfo?.time}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400 font-bold mb-1">총 거리</div>
                        <div className="text-xl font-bold text-blue-600">{routeInfo?.distance}</div>
                    </div>
                </div>
            </div>

            {/* 2. 하단 컨트롤 영역 */}
            <div className="flex-1 bg-gray-50 p-6 flex flex-col items-center">
                
                {/* 보호자 모니터링 */}
                <div className="w-full bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                    <div className="flex items-center text-sm font-bold text-gray-700">
                        <Eye className="w-4 h-4 mr-2 text-green-500 animate-pulse" /> 보호자 연결됨
                    </div>
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-xs border-2 border-white font-bold text-yellow-700">엄</div>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs border-2 border-white font-bold text-blue-700">아</div>
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

                {/* 하단 버튼 */}
                <div className="w-full grid grid-cols-2 gap-3">
                    <a href="tel:112" className="flex items-center justify-center bg-white border border-gray-200 text-gray-600 py-3.5 rounded-xl font-bold shadow-sm hover:bg-gray-50">
                        <Phone className="w-4 h-4 mr-2" /> 112
                    </a>
                    <button 
                        onClick={() => { 
                            navigator.geolocation.clearWatch(watchId.current); // 종료 시 추적 중지
                            alert("안전하게 도착했습니다! 🎉"); 
                            navigate('/'); 
                        }}
                        className="flex items-center justify-center bg-green-500 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-green-600"
                    >
                        <Check className="w-5 h-5 mr-2" /> 도착 완료
                    </button>
                </div>
            </div>
        </div>
    );
}