// frontend/src/NavigationScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Map, MapMarker, Polyline, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { Phone, Check, AlertTriangle, Eye, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const KAKAO_APP_KEY = 'e8757f3638207e014bcea23f202b11d8'; 

// 🚨🚨🚨 [매우 중요] 이 주소가 MainScreen.js와 똑같은지 꼭 확인하세요! 🚨🚨🚨
const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

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

// 🚨 함수 안에 '{ userUid }'가 꼭 있어야 합니다!
export default function NavigationScreen({ userUid }) {
    const location = useLocation();
    const navigate = useNavigate();
    
    // 데이터 받기
    const { path, routeInfo } = location.state || {};

    const [map, setMap] = useState(null);
    const [currentPos, setCurrentPos] = useState(path ? path[0] : null); 
    
    const [passedPath, setPassedPath] = useState([]);
    const [remainPath, setRemainPath] = useState(path || []);
    
    const [remainingTimeStr, setRemainingTimeStr] = useState(routeInfo?.time || "계산중");
    const [arrivalTimeStr, setArrivalTimeStr] = useState("");
    
    const [isSOSPressed, setIsSOSPressed] = useState(false);
    const sosTimerRef = useRef(null);

    // 긴급 연락처 상태
    const [contacts, setContacts] = useState([]);
    const watchId = useRef(null);

    // 🚨 1. 긴급 연락처 불러오기 (로그 추가됨)
    useEffect(() => {
        // userUid가 잘 들어왔는지 콘솔에 찍어봅니다.
        console.log("📍 [NavigationScreen] 전달받은 userUid:", userUid);

        const fetchContacts = async () => {
            if (!userUid) {
                console.warn("⚠️ userUid가 없어서 연락처를 못 가져옵니다.");
                return;
            }
            try {
                const url = `${API_BASE_URL}/api/contacts/${userUid}`;
                console.log("🌐 연락처 요청 주소:", url); // 주소 확인용

                const res = await axios.get(url);
                setContacts(res.data);
                console.log("✅ 불러온 연락처 개수:", res.data.length);
            } catch (e) { 
                console.error("❌ 연락처 로드 실패 (서버 주소를 확인하세요):", e); 
            }
        };
        fetchContacts();
    }, [userUid]);

    // 2. 거리 계산 함수
    const getDistance = (lat1, lng1, lat2, lng2) => {
        if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // 3. 위치 추적 및 경로 로직
    useEffect(() => {
        if (!path || path.length < 2 || !navigator.geolocation) return;

        const totalMinutes = parseInt(routeInfo?.time?.replace(/[^0-9]/g, '')) || 15;
        const now = new Date();
        now.setMinutes(now.getMinutes() + totalMinutes);
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

                const passed = path.slice(0, minIdx + 1);
                setPassedPath(passed);

                const remain = path.slice(minIdx);
                setRemainPath(remain);

                const remainingRatio = Math.max(0, (path.length - minIdx) / path.length);
                const leftMin = Math.ceil(totalMinutes * remainingRatio);
                setRemainingTimeStr(leftMin > 0 ? `${leftMin}분` : "곧 도착");

                const endPos = path[path.length - 1];
                if (getDistance(newLat, newLng, endPos.lat, endPos.lng) < 30) {
                    toast.success("목적지에 도착했습니다! 🎉");
                    navigator.geolocation.clearWatch(watchId.current);
                }
            },
            (err) => console.warn("GPS 대기중...", err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );

        return () => {
            if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
        };
    }, [path, map, routeInfo, navigate]);


    // 🚨 SOS 버튼 로직 (연락처 체크 강화)
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
        // 로그를 찍어봅니다.
        console.log("🚨 SOS 발동! 현재 연락처 목록:", contacts);

        if (contacts.length === 0) {
            toast.error("연락처를 불러오지 못했습니다. (서버 연결 확인 필요)");
            return;
        }

        const phoneNumbers = contacts.map(c => c.phone).join(',');
        const message = `[SafeWay 긴급] SOS! 도와주세요! 현재 경로 이동 중 위험 상황입니다.\n위치: https://map.kakao.com/link/map/${currentPos?.lat},${currentPos?.lng}`;
        
        const separator = navigator.userAgent.match(/iPhone|iPad/i) ? '&' : '?';
        const smsLink = `sms:${phoneNumbers}${separator}body=${encodeURIComponent(message)}`;
        
        window.location.href = smsLink;
        toast.success(`보호자 ${contacts.length}명에게 메시지 앱을 엽니다.`);
    };

    if (!path) return <div className="flex justify-center items-center h-screen">경로 데이터를 불러오는 중...</div>;

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans relative">
            
            {/* 상단바 */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-12 pointer-events-none">
                <div className="flex items-center justify-between pointer-events-auto">
                    <button onClick={() => navigate(-1)} className="bg-white p-3 rounded-full shadow-lg text-gray-700 hover:bg-gray-50 transition active:scale-95">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-white/20 flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">남은 시간</span>
                        <span className="text-xl font-black text-blue-600 leading-none">
                            {remainingTimeStr}
                        </span>
                    </div>
                </div>
            </div>

            {/* 지도 */}
            <div className="h-[65vh] w-full relative">
                <Map center={currentPos || path[0]} style={{ width: "100%", height: "100%" }} level={3} appkey={KAKAO_APP_KEY} onCreate={setMap}>
                    <MapMarker position={path[0]} image={MARKER_IMGS.start} title="출발" />
                    <MapMarker position={path[path.length-1]} image={MARKER_IMGS.end} title="도착" />
                    
                    {currentPos && (
                        <CustomOverlayMap position={currentPos} zIndex={99}>
                            <div className="relative flex items-center justify-center">
                                <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg z-20"></div>
                                <div className="absolute w-16 h-16 bg-blue-500 rounded-full opacity-30 animate-ping z-10"></div>
                            </div>
                        </CustomOverlayMap>
                    )}

                    <Polyline path={[passedPath]} strokeWeight={9} strokeColor={"#cbd5e1"} strokeOpacity={0.8} strokeStyle={"solid"} />
                    <Polyline path={[remainPath]} strokeWeight={9} strokeColor={"#2563eb"} strokeOpacity={1} strokeStyle={"solid"} />
                </Map>

                {/* 범례 */}
                <div className="absolute bottom-6 left-4 bg-white/90 backdrop-blur p-2.5 rounded-xl shadow-lg z-10 text-xs font-bold text-gray-600 space-y-1.5 border border-gray-100">
                    <div className="flex items-center"><div className="w-8 h-1.5 bg-[#2563eb] rounded mr-2"></div>남은 경로</div>
                    <div className="flex items-center"><div className="w-8 h-1.5 bg-[#cbd5e1] rounded mr-2"></div>지나온 길</div>
                    <div className="flex items-center"><div className="w-2.5 h-2.5 bg-blue-600 rounded-full border border-white mr-2 ml-2.5"></div>내 위치</div>
                </div>
            </div>

            {/* 하단 패널 */}
            <div className="flex-1 bg-gray-50 p-6 flex flex-col items-center rounded-t-[2.5rem] -mt-8 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                
                {/* 보호자 모니터링 표시 */}
                <div className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                    <div className="flex items-center text-sm font-bold text-gray-700">
                        <Eye className="w-4 h-4 mr-2 text-green-500 animate-pulse" /> 안심 귀가 모니터링 중
                    </div>
                    <div className="flex -space-x-2">
                        {contacts.length > 0 ? (
                            contacts.slice(0, 3).map((c, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700 shadow-sm">
                                    {c.name[0]}
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-gray-400">보호자 없음</div>
                        )}
                    </div>
                </div>

                {/* SOS 버튼 */}
                <div className="flex-1 flex flex-col items-center justify-center w-full mb-4 relative">
                    <button
                        onMouseDown={startSOS} 
                        onMouseUp={endSOS} 
                        onMouseLeave={endSOS}
                        onTouchStart={startSOS} 
                        onTouchEnd={endSOS}
                        className={`w-32 h-32 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-200 
                            ${isSOSPressed 
                                ? 'bg-red-700 scale-95 ring-8 ring-red-200 shadow-inner' 
                                : 'bg-red-500 hover:bg-red-600 ring-4 ring-red-100 animate-pulse'}`}
                    >
                        <AlertTriangle className="w-10 h-10 mb-2" />
                        <span className="text-2xl font-black tracking-widest">SOS</span>
                    </button>
                    <p className="text-xs text-gray-400 mt-4 font-medium">위급 시 2초간 꾹 눌러주세요</p>
                    
                    {isSOSPressed && (
                        <div className="absolute top-0 right-10 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                            전송 중...
                        </div>
                    )}
                </div>

                {/* 하단 버튼들 */}
                <div className="w-full grid grid-cols-2 gap-3">
                    <a href="tel:112" className="flex items-center justify-center bg-white border border-gray-200 text-gray-600 py-3.5 rounded-xl font-bold shadow-sm hover:bg-gray-50">
                        <Phone className="w-4 h-4 mr-2" /> 112 신고
                    </a>
                    <button 
                        onClick={() => { 
                            if(watchId.current) navigator.geolocation.clearWatch(watchId.current);
                            toast.success("안전하게 도착했습니다! 🎉"); 
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