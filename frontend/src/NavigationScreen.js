// frontend/src/NavigationScreen.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';
import { Phone, Check, AlertTriangle, User, Eye } from 'lucide-react';
import axios from 'axios';

const KAKAO_APP_KEY = 'e8757f3638207e014bcea23f202b11d8';

// 1. 커스텀 마커 이미지 정의
const MARKER_IMAGES = {
    start: {
        src: "https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png", 
        size: { width: 30, height: 40 }, options: { offset: { x: 15, y: 40 } }
    },
    end: {
        src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png",
        size: { width: 35, height: 40 }, options: { offset: { x: 17.5, y: 40 } }
    },
    current: {
        // 카카오맵 모바일 웹에서 사용하는 내 위치 아이콘 예시
        src: "https://m.map.kakao.com/web/images/ico_here.png",
        size: { width: 32, height: 32 }, options: { offset: { x: 16, y: 16 } }
    }
};

export default function NavigationScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { path, routeInfo } = location.state || {};
    
    // 상태 관리
    const [map, setMap] = useState(null);
    const [currentPos, setCurrentPos] = useState(path ? path[0] : null);
    const [traveledPath, setTraveledPath] = useState([]);
    const [remainingPath, setRemainingPath] = useState(path || []);
    const [remainingTime, setRemainingTime] = useState(routeInfo?.time || "계산 중...");
    const [arrivalTime, setArrivalTime] = useState("");
    const [isSOSPressed, setIsSOSPressed] = useState(false);
    const watchId = useRef(null);

    // 유틸리티: 두 좌표 간 거리 계산 (Haversine formula)
    const getDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371e3; // 지구 반지름 (미터)
        const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // 2. 경로 상에서 현재 위치와 가장 가까운 인덱스 찾기
    const findNearestPathIndex = (current, fullPath) => {
        let minDistance = Infinity;
        let nearestIndex = 0;
        fullPath.forEach((point, index) => {
            const dist = getDistance(current.lat, current.lng, point.lat, point.lng);
            if (dist < minDistance) {
                minDistance = dist;
                nearestIndex = index;
            }
        });
        // 진행 방향 고려: 가장 가까운 점이 이미 지나온 점일 수 있으므로, 
        // 다음 점과의 거리가 더 멀어지면 그 전 점을 선택하는 등의 보정이 필요할 수 있음.
        // 여기서는 단순하게 가장 가까운 점을 기준으로 함.
        return nearestIndex;
    };

    // 3. 초기 도착 예정 시간 설정
    useEffect(() => {
        if (!routeInfo?.time) return;
        const now = new Date();
        const minutes = parseInt(routeInfo.time.replace(/[^0-9]/g, '')) || 0;
        now.setMinutes(now.getMinutes() + minutes);
        setArrivalTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, [routeInfo]);

    // 4. 🚨 실시간 위치 추적 및 경로 업데이트 (핵심!) 🚨
    useEffect(() => {
        if (!path || path.length < 2 || !navigator.geolocation) return;

        // 위치 추적 시작
        watchId.current = navigator.geolocation.watchPosition(
            (position) => {
                const newPos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setCurrentPos(newPos);

                // 지도 중심 이동 (부드럽게)
                if (map) map.panTo(new window.kakao.maps.LatLng(newPos.lat, newPos.lng));

                // 경로 분할: 가장 가까운 경로 포인트 찾기
                const nearestIndex = findNearestPathIndex(newPos, path);
                
                // 지나온 길: 시작점 ~ 가장 가까운 점까지
                const traveled = path.slice(0, nearestIndex + 1);
                // 남은 길: 가장 가까운 점 ~ 도착점까지
                // (현재 위치에서 경로까지 잇는 선을 위해 newPos 추가)
                const remaining = [newPos, ...path.slice(nearestIndex)];

                setTraveledPath(traveled);
                setRemainingPath(remaining);

                // 남은 시간 재계산 (단순 비례 계산)
                const totalLen = path.length;
                const remainingRatio = (totalLen - nearestIndex) / totalLen;
                const initialMin = parseInt(routeInfo.time.replace(/[^0-9]/g, '')) || 0;
                const leftMin = Math.ceil(initialMin * remainingRatio);
                setRemainingTime(`${leftMin}분`);

                // 도착 시 처리 (도착지 반경 20m 이내 접근)
                const endPos = path[path.length - 1];
                if (getDistance(newPos.lat, newPos.lng, endPos.lat, endPos.lng) < 20) {
                    setRemainingTime("도착!");
                    navigator.geolocation.clearWatch(watchId.current); // 추적 종료
                }
            },
            (error) => console.error("위치 정보를 가져올 수 없습니다.", error),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );

        // 컴포넌트 언마운트 시 위치 추적 종료
        return () => {
            if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
        };
    }, [path, routeInfo, map]);

    if (!path) return <div className="flex items-center justify-center h-screen">경로 데이터 없음</div>;

    // SOS 버튼 로직
    let pressTimer;
    const startPress = () => {
        setIsSOSPressed(true);
        pressTimer = setTimeout(() => {
            alert("🚨 보호자에게 SOS 알림이 전송되었습니다!");
            window.location.href = 'sms:01012345678?body=SOS!%20도와주세요!';
        }, 2000);
    };
    const endPress = () => {
        setIsSOSPressed(false);
        clearTimeout(pressTimer);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans relative">
            
            {/* 1. 상단 지도 (실시간 이동) */}
            <div className="h-[55vh] w-full relative">
                <Map center={path[0]} style={{ width: "100%", height: "100%" }} level={2} appkey={KAKAO_APP_KEY} onCreate={setMap}>
                    
                    {/* 마커: 출발, 도착, 현재 위치 (커스텀 이미지 적용) */}
                    <MapMarker position={path[0]} image={MARKER_IMAGES.start} title="출발지" />
                    <MapMarker position={path[path.length-1]} image={MARKER_IMAGES.end} title="도착지" />
                    {currentPos && <MapMarker position={currentPos} image={MARKER_IMAGES.current} title="현재 위치" zIndex={10} />}
                    
                    {/* 경로: 지나온 길 (회색) */}
                    <Polyline path={[traveledPath]} strokeWeight={7} strokeColor={"#9ca3af"} strokeOpacity={0.8} strokeStyle={"solid"} />
                    
                    {/* 경로: 남은 길 (파란색) */}
                    <Polyline path={[remainingPath]} strokeWeight={8} strokeColor={"#3b82f6"} strokeOpacity={1} strokeStyle={"solid"} />
                    
                </Map>

                {/* 상단 정보 카드 */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-5 rounded-3xl shadow-2xl z-10 flex justify-between items-center border border-gray-100">
                    <div>
                        <div className="text-xs text-gray-500 font-bold mb-1">남은 시간</div>
                        <div className="text-3xl font-extrabold text-blue-600">{remainingTime}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 font-bold mb-1">도착 예정</div>
                        <div className="text-xl font-bold text-gray-800">{arrivalTime}</div>
                    </div>
                </div>
            </div>

            {/* 2. 하단 컨트롤 영역 */}
            <div className="flex-1 bg-gray-50 p-6 flex flex-col items-center">
                
                {/* 지켜보는 사람 UI */}
                <div className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex items-center justify-between">
                    <div className="flex items-center text-sm font-bold text-gray-700">
                        <div className="relative mr-3">
                            <Eye className="w-5 h-5 text-green-500" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                        </div>
                        안심 귀가 모니터링 중
                    </div>
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 border-2 border-white flex items-center justify-center text-xs font-bold text-yellow-700">엄마</div>
                        <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700">아빠</div>
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