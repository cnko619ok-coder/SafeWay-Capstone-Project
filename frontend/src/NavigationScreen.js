// frontend/src/NavigationScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Map, MapMarker, Polyline, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { Phone, Check, AlertTriangle, Eye, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL } from './config';

const KAKAO_APP_KEY = 'e8757f3638207e014bcea23f202b11d8'; 

const MARKER_IMGS = {
    start: {
        src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png", 
        size: { width: 31, height: 35 }, 
        options: { offset: { x: 15, y: 35 } } 
    },
    end: {
        src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_b.png", 
        size: { width: 35, height: 40 }, 
        options: { offset: { x: 17, y: 40 } }
    }
};

export default function NavigationScreen({ userUid: propUserUid }) {
    const location = useLocation();
    const navigate = useNavigate();
    
    const userUid = propUserUid || localStorage.getItem('userUid');
    const { path, routeInfo } = location.state || {};

    const [map, setMap] = useState(null);
    const [currentPos, setCurrentPos] = useState(path ? path[0] : null); 
    const [passedPath, setPassedPath] = useState([]);
    const [remainPath, setRemainPath] = useState(path || []);
    const [remainingTimeStr, setRemainingTimeStr] = useState(routeInfo?.time || "계산중");
    const [arrivalTimeStr, setArrivalTimeStr] = useState("");
    const [isSOSPressed, setIsSOSPressed] = useState(false);
    const sosTimerRef = useRef(null);
    const [contacts, setContacts] = useState([]);
    const watchId = useRef(null);

    // 시트 상태
    const [isSheetOpen, setIsSheetOpen] = useState(true);

    // 🚨🚨🚨 [절대 고정 높이 전략] 🚨🚨🚨
    // 애매한 % 계산을 없애고 픽셀로 고정하여 오작동을 원천 차단합니다.
    const SHEET_TOTAL_HEIGHT = 380; // 시트가 열렸을 때 전체 높이
    const HANDLE_HEIGHT = 70;       // 닫혔을 때 보여질 손잡이 높이
    // 닫힐 때 내려갈 높이 = 전체 - 손잡이 (380 - 70 = 310px)
    const TRANSLATE_Y = SHEET_TOTAL_HEIGHT - HANDLE_HEIGHT; 

    // 1. 긴급 연락처 로드
    useEffect(() => {
        const fetchContacts = async () => {
            if (!userUid) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/contacts/${userUid}`);
                setContacts(res.data);
            } catch (e) { console.error(e); }
        };
        fetchContacts();
    }, [userUid]);

    // 2. 거리 계산 및 위치 추적
    useEffect(() => {
        if (!path || path.length < 2 || !navigator.geolocation) return;

        const getDistance = (lat1, lng1, lat2, lng2) => {
            if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
            const R = 6371e3;
            const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
            const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        const minutes = parseInt(routeInfo?.time?.replace(/[^0-9]/g, '')) || 0;
        const now = new Date();
        now.setMinutes(now.getMinutes() + minutes);
        setArrivalTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        watchId.current = navigator.geolocation.watchPosition(
            (position) => {
                const newLat = position.coords.latitude;
                const newLng = position.coords.longitude;
                const newPos = { lat: newLat, lng: newLng };
                setCurrentPos(newPos);
                
                let minIdx = 0;
                let minDist = Infinity;
                path.forEach((p, i) => {
                    const d = getDistance(newLat, newLng, p.lat, p.lng);
                    if (d < minDist) { minDist = d; minIdx = i; }
                });

                setPassedPath(path.slice(0, minIdx + 1));
                setRemainPath(path.slice(minIdx));

                const remainingRatio = Math.max(0, (path.length - minIdx) / path.length);
                const leftMin = Math.ceil(minutes * remainingRatio);
                const newRemainingTimeStr = leftMin > 0 ? `${leftMin}분` : "곧 도착";
                
                setRemainingTimeStr(newRemainingTimeStr);

                const endPos = path[path.length - 1];
                if (getDistance(newLat, newLng, endPos.lat, endPos.lng) < 30) {
                    toast.success("도착 완료!");
                    navigator.geolocation.clearWatch(watchId.current);
                }
            },
            (err) => console.warn(err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );

        return () => {
            if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
        };
    }, [path, map, routeInfo, navigate]);

    // SOS 관련
    const startSOS = () => {
        setIsSOSPressed(true);
        sosTimerRef.current = setTimeout(() => {
            triggerSOSAction();
            setIsSOSPressed(false);
        }, 2000);
    };

    const endSOS = () => {
        if (sosTimerRef.current) {
            clearTimeout(sosTimerRef.current);
            setIsSOSPressed(false);
        }
    };

    const triggerSOSAction = () => {
        if (contacts.length === 0) {
            toast.error("연락처 없음. 112 연결.");
            window.location.href = 'tel:112';
            return;
        }
        const phoneNumbers = contacts.map(c => c.phone).join(',');
        const message = `[SafeWay SOS] 위치: https://map.kakao.com/link/map/${currentPos?.lat},${currentPos?.lng}`;
        const separator = navigator.userAgent.match(/iPhone|iPad/i) ? '&' : '?';
        window.location.href = `sms:${phoneNumbers}${separator}body=${encodeURIComponent(message)}`;
        toast.success(`보호자 ${contacts.length}명에게 연결`);
    };

    if (!path) return <div className="flex justify-center items-center h-screen">로딩중...</div>;

    return (
        <div className="fixed inset-0 bg-gray-100 font-sans overflow-hidden">
            
            {/* 1. 지도 (전체 화면) */}
            <div className="absolute inset-0 z-0">
                <Map center={currentPos || path[0]} style={{ width: "100%", height: "100%" }} level={3} appkey={KAKAO_APP_KEY} onCreate={setMap}>
                    <MapMarker position={path[0]} image={MARKER_IMGS.start} />
                    <MapMarker position={path[path.length-1]} image={MARKER_IMGS.end} />
                    {currentPos && (
                        <CustomOverlayMap position={currentPos} zIndex={99}>
                            <div className="relative flex items-center justify-center">
                                <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg z-20"></div>
                                <div className="absolute w-16 h-16 bg-blue-500 rounded-full opacity-30 animate-ping z-10"></div>
                            </div>
                        </CustomOverlayMap>
                    )}
                    <Polyline path={[passedPath]} strokeWeight={9} strokeColor={"#cbd5e1"} strokeOpacity={0.8} />
                    <Polyline path={[remainPath]} strokeWeight={9} strokeColor={"#2563eb"} strokeOpacity={1} />
                </Map>
            </div>

            {/* 상단 뒤로가기 */}
            <div className="absolute top-4 left-4 z-20">
                <button onClick={() => navigate(-1)} className="bg-white p-3 rounded-full shadow-md text-gray-700 active:scale-95">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>

            {/* 2. 시간 정보 카드 */}
            <div 
                className="absolute left-4 right-4 z-20 transition-all duration-300 ease-in-out"
                style={{ 
                    // 열리면 400px 위, 닫리면 90px 위 (정확한 위치 고정)
                    bottom: isSheetOpen ? `${SHEET_TOTAL_HEIGHT + 20}px` : `${HANDLE_HEIGHT + 20}px` 
                }}
            >
                <div className="bg-white rounded-3xl shadow-xl p-5 flex items-center justify-between border border-gray-100">
                    <div>
                        <p className="text-xs font-bold text-gray-400 mb-1">남은 시간</p>
                        <p className="text-4xl font-black text-blue-600 tracking-tighter">
                            {remainingTimeStr.replace(/[^0-9]/g, '')}
                            <span className="text-xl ml-1 text-blue-500 font-bold">분</span>
                        </p>
                    </div>
                    <div className="h-10 w-[1px] bg-gray-100"></div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 mb-1">도착 예정</p>
                        <p className="text-2xl font-bold text-gray-800 tracking-tight">
                            {arrivalTimeStr}
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. 슬라이딩 바텀 시트 (고정 높이 & 컴팩트 UI) */}
            <div 
                className="fixed left-0 right-0 z-30 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out"
                style={{ 
                    bottom: 0,
                    height: `${SHEET_TOTAL_HEIGHT}px`, // 높이 380px 고정!
                    // 열리면 0, 닫히면 310px 만큼 내려감 (70px 남음) -> 수학적으로 완벽함
                    transform: isSheetOpen ? 'translateY(0)' : `translateY(${TRANSLATE_Y}px)`
                }}
            >
                {/* 핸들 */}
                <div 
                    onClick={() => setIsSheetOpen(!isSheetOpen)}
                    className="w-full h-[50px] flex items-center justify-center cursor-pointer active:bg-gray-50 rounded-t-[2.5rem]"
                >
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                </div>

                {/* 내용물 (간격 최소화 - 컴팩트 모드) */}
                <div className="px-5 pb-6 flex flex-col justify-between h-[330px]">
                    
                    {/* 보호자 모니터링 (높이 줄임) */}
                    <div className="bg-blue-50/80 p-3 rounded-xl flex items-center justify-between border border-blue-100">
                        <div className="flex items-center text-xs font-bold text-gray-700">
                            <Eye className="w-3 h-3 mr-2 text-green-500 animate-pulse" /> 
                            안심 귀가 모니터링 중
                        </div>
                        <div className="flex -space-x-2">
                            {contacts.length > 0 ? (
                                contacts.slice(0, 3).map((c, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700 shadow-sm">
                                        {c.name[0]}
                                    </div>
                                ))
                            ) : (
                                <span className="text-[10px] text-gray-400">보호자 없음</span>
                            )}
                        </div>
                    </div>

                    {/* SOS 버튼 (크기와 간격 최적화) */}
                    <div className="flex flex-col items-center justify-center relative -mt-2">
                        <button
                            onMouseDown={startSOS} 
                            onMouseUp={endSOS} 
                            onMouseLeave={endSOS}
                            onTouchStart={startSOS} 
                            onTouchEnd={endSOS}
                            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-lg transition-all duration-200 
                                ${isSOSPressed 
                                    ? 'bg-red-700 scale-95 ring-8 ring-red-200' 
                                    : 'bg-red-500 hover:bg-red-600 ring-4 ring-red-100 animate-pulse'}`}
                        >
                            <AlertTriangle className="w-8 h-8 mb-1" />
                            <span className="text-lg font-black tracking-widest">SOS</span>
                        </button>
                        
                        {isSOSPressed && (
                            <div className="absolute top-0 right-10 bg-gray-800 text-white text-xs px-2 py-1 rounded animate-bounce">
                                전송 중...
                            </div>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2">위급 시 2초간 꾹 눌러주세요</p>
                    </div>

                    {/* 하단 버튼 2개 (높이 줄이고 글자 키움) */}
                    <div className="grid grid-cols-2 gap-3">
                        <a href="tel:112" className="flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold shadow-sm active:scale-95 transition-transform">
                            <Phone className="w-5 h-5 mr-2 text-gray-500" /> 112 신고
                        </a>
                        <button 
                            onClick={() => { 
                                if(watchId.current) navigator.geolocation.clearWatch(watchId.current);
                                toast.success("안전하게 도착했습니다!"); 
                                navigate('/'); 
                            }}
                            className="flex items-center justify-center bg-green-500 text-white py-3 rounded-xl font-bold shadow-md shadow-green-200 active:scale-95 transition-transform"
                        >
                            <Check className="w-5 h-5 mr-2" /> 도착 완료
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}