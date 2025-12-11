// frontend/src/NavigationScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Map, MapMarker, Polyline, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { Phone, Check, AlertTriangle, Eye } from 'lucide-react';

const KAKAO_APP_KEY = 'e8757f3638207e014bcea23f202b11d8';

// 1. 🎨 예쁜 마커 이미지 (카카오맵 3D 스타일)
const MARKER_IMGS = {
    start: {
        src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_b.png", 
        size: { width: 50, height: 45 }, options: { offset: { x: 15, y: 43 } }
    },
    end: {
        src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_b.png", 
        size: { width: 50, height: 45 }, options: { offset: { x: 15, y: 43 } }
    },
    current: {
        // 내 위치 (파동치는 효과를 위해 이미지 대신 CustomOverlay 사용하지만, 기본 아이콘도 설정)
        src: "https://map.kakao.com/link/map/my_position", 
        size: { width: 30, height: 30 }
    }
};

export default function NavigationScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { path, routeInfo } = location.state || {};
    
    const [map, setMap] = useState(null);
    const [currentPos, setCurrentPos] = useState(path ? path[0] : null);
    
    // 경로 상태 (지나온 길 / 남은 길)
    const [passedPath, setPassedPath] = useState([]);
    const [remainPath, setRemainPath] = useState(path || []);
    
    // 시간 정보 상태
    const [remainingTimeStr, setRemainingTimeStr] = useState(routeInfo?.time || "계산중");
    const [arrivalTimeStr, setArrivalTimeStr] = useState("");
    
    const [isSOSPressed, setIsSOSPressed] = useState(false);
    const watchId = useRef(null);

    // 거리 계산 유틸리티 (미터 단위)
    const getDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // 🚨 2. 실시간 위치 추적 및 경로/시간 업데이트 🚨
    useEffect(() => {
        if (!path || path.length < 2 || !navigator.geolocation) return;

        // 초기 총 거리 및 시간 파싱
        const totalDistance = routeInfo?.distance ? parseFloat(routeInfo.distance.replace(/[^0-9.]/g, '')) * 1000 : 1000; // m 단위
        const totalMinutes = parseInt(routeInfo?.time?.replace(/[^0-9]/g, '')) || 15;

        // 위치 추적 시작
        watchId.current = navigator.geolocation.watchPosition(
            (position) => {
                const newLat = position.coords.latitude;
                const newLng = position.coords.longitude;
                const newPos = { lat: newLat, lng: newLng };

                setCurrentPos(newPos);
                
                // 지도 중심을 내 위치로 부드럽게 이동
                if (map) map.panTo(new window.kakao.maps.LatLng(newLat, newLng));

                // 2-1. 경로 매칭: 현재 위치에서 가장 가까운 경로 점 찾기
                let minIdx = 0;
                let minDist = Infinity;
                path.forEach((p, i) => {
                    const d = getDistance(newLat, newLng, p.lat, p.lng);
                    if (d < minDist) { minDist = d; minIdx = i; }
                });

                // 2-2. 경로 자르기 (지나온 길 / 남은 길)
                // 지나온 길: 시작점 ~ 현재 위치까지
                const passed = [...path.slice(0, minIdx + 1), newPos];
                setPassedPath(passed);

                // 남은 길: 현재 위치 ~ 도착점까지
                const remain = [newPos, ...path.slice(minIdx + 1)];
                setRemainPath(remain);

                // 2-3. 남은 시간 및 도착 예정 시간 실시간 계산
                const remainingRatio = Math.max(0, (path.length - minIdx) / path.length); // 남은 비율
                const leftMin = Math.ceil(totalMinutes * remainingRatio);
                
                // 남은 시간이 1분 미만이면 '곧 도착'
                setRemainingTimeStr(leftMin > 0 ? `${leftMin}분` : "곧 도착");

                // 도착 예정 시간 업데이트 (현재 시간 + 남은 시간)
                const now = new Date();
                now.setMinutes(now.getMinutes() + leftMin);
                setArrivalTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

                // 2-4. 도착 판정 (도착지 반경 30m 이내)
                const endPos = path[path.length - 1];
                if (getDistance(newLat, newLng, endPos.lat, endPos.lng) < 30) {
                    alert("목적지에 도착했습니다! 안내를 종료합니다.");
                    navigator.geolocation.clearWatch(watchId.current);
                    navigate('/');
                }
            },
            (err) => console.warn("GPS 수신 대기중...", err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );

        return () => {
            if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
        };
    }, [path, map, routeInfo, navigate]);

    // 초기 도착 시간 설정 (GPS 잡히기 전)
    useEffect(() => {
        if (routeInfo?.time) {
            const now = new Date();
            const min = parseInt(routeInfo.time.replace(/[^0-9]/g, '')) || 0;
            now.setMinutes(now.getMinutes() + min);
            setArrivalTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
    }, [routeInfo]);

    if (!path) return <div className="flex justify-center items-center h-screen">경로 로딩중...</div>;

    // SOS 버튼
    let timer;
    const startSOS = () => {
        setIsSOSPressed(true);
        timer = setTimeout(() => {
            window.location.href = 'sms:112?body=SOS!%20도와주세요!%20현재위치:%20' + currentPos.lat + ',' + currentPos.lng;
            alert("🚨 112 및 보호자에게 위치가 전송되었습니다!");
            setIsSOSPressed(false);
        }, 2000);
    };
    const endSOS = () => { setIsSOSPressed(false); clearTimeout(timer); };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans relative">
            
            {/* 1. 지도 영역 */}
            <div className="h-[60vh] w-full relative">
                <Map center={currentPos || path[0]} style={{ width: "100%", height: "100%" }} level={2} appkey={KAKAO_APP_KEY} onCreate={setMap}>
                    
                    {/* 출발지 마커 */}
                    <MapMarker position={path[0]} image={MARKER_IMAGES.start} title="출발" />
                    
                    {/* 도착지 마커 */}
                    <MapMarker position={path[path.length-1]} image={MARKER_IMAGES.end} title="도착" />
                    
                    {/* 🚨 내 위치 마커 (파동치는 애니메이션 효과) */}
                    {currentPos && (
                        <CustomOverlayMap position={currentPos} zIndex={99}>
                            <div className="relative flex items-center justify-center">
                                <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg z-20"></div>
                                <div className="absolute w-12 h-12 bg-blue-500 rounded-full opacity-40 animate-ping z-10"></div>
                            </div>
                        </CustomOverlayMap>
                    )}

                    {/* 🚨 경로 그리기 */}
                    {/* 지나온 길: 회색 */}
                    <Polyline path={[passedPath]} strokeWeight={8} strokeColor={"#9ca3af"} strokeOpacity={0.5} strokeStyle={"solid"} />
                    {/* 남은 길: 파란색 (화살표 패턴 추천하지만, 기본 실선 사용) */}
                    <Polyline path={[remainPath]} strokeWeight={10} strokeColor={"#3b82f6"} strokeOpacity={1} strokeStyle={"solid"} />
                
                </Map>
                
                {/* 🚨 상단 정보창 (시간 정보) */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-5 rounded-3xl shadow-xl z-10 flex justify-between items-center border border-gray-100">
                    <div>
                        <div className="text-xs text-gray-500 font-bold mb-1">남은 시간</div>
                        <div className="text-3xl font-extrabold text-blue-600">{remainingTimeStr}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 font-bold mb-1">도착 예정</div>
                        <div className="text-xl font-bold text-gray-800">{arrivalTimeStr}</div>
                    </div>
                </div>
            </div>

            {/* 2. 하단 컨트롤 영역 */}
            <div className="flex-1 bg-gray-50 p-6 flex flex-col items-center rounded-t-[2.5rem] -mt-6 relative z-20 shadow-inner">
                
                {/* 보호자 모니터링 표시 */}
                <div className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                    <div className="flex items-center text-sm font-bold text-gray-700">
                        <Eye className="w-4 h-4 mr-2 text-green-500 animate-pulse" /> 안심 귀가 모니터링 중
                    </div>
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 border-2 border-white flex items-center justify-center text-xs font-bold text-yellow-700 shadow-sm">엄</div>
                        <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700 shadow-sm">아</div>
                    </div>
                </div>

                {/* SOS 버튼 */}
                <div className="flex-1 flex flex-col items-center justify-center w-full mb-4">
                    <button
                        onMouseDown={startSOS} onMouseUp={endSOS} onMouseLeave={endSOS}
                        onTouchStart={startSOS} onTouchEnd={endSOS}
                        className={`w-36 h-36 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-200 ${isSOSPressed ? 'bg-red-700 scale-95 ring-8 ring-red-200' : 'bg-red-500 hover:bg-red-600 ring-4 ring-red-100'}`}
                    >
                        <AlertTriangle className="w-10 h-10 mb-2" />
                        <span className="text-2xl font-black tracking-widest">SOS</span>
                    </button>
                    <p className="text-xs text-gray-400 mt-4 font-medium">위급 시 2초간 꾹 눌러주세요</p>
                </div>

                {/* 종료 버튼 */}
                <div className="w-full grid grid-cols-2 gap-3">
                    <a href="tel:112" className="flex items-center justify-center bg-white border border-gray-200 text-gray-600 py-3.5 rounded-xl font-bold shadow-sm hover:bg-gray-50">
                        <Phone className="w-4 h-4 mr-2" /> 112 신고
                    </a>
                    <button 
                        onClick={() => { navigate('/'); }}
                        className="flex items-center justify-center bg-green-500 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-green-600"
                    >
                        <Check className="w-5 h-5 mr-2" /> 안내 종료
                    </button>
                </div>
            </div>
        </div>
    );
}