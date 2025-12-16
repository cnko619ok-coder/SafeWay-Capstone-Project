// frontend/src/NavigationScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Map, MapMarker, Polyline, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { Phone, Check, AlertTriangle, Eye, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
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

// 🚨 props로 받은 userUid와 저장소에 있는 userUid를 모두 확인
export default function NavigationScreen({ userUid: propUserUid }) {
    const location = useLocation();
    const navigate = useNavigate();
    
    // 🚨 [핵심 수정] props가 없으면 localStorage에서 비상 복구!
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

    // 🚨 진단용 메시지 (성공하면 초록색, 실패하면 빨간색)
    const [debugMsg, setDebugMsg] = useState("");

    // 🚨🚨🚨 바텀 시트 열림/닫힘 상태 관리 🚨🚨🚨
    const [isSheetOpen, setIsSheetOpen] = useState(true);

    // 1. 긴급 연락처 불러오기
    useEffect(() => {
        const fetchContacts = async () => {
            if (!userUid) {
                setDebugMsg("❌ 오류: 로그인이 필요합니다 (UID 없음)");
                return;
            }
            try {
                // 🚨 서버 주소 디버깅
                setDebugMsg(`연결 시도: ${API_BASE_URL} (UID: ${userUid.slice(0,4)}...)`);
                
                const res = await axios.get(`${API_BASE_URL}/api/contacts/${userUid}`);
                setContacts(res.data);
                
                // 성공 시 메시지 삭제 또는 성공 표시
                setDebugMsg(""); 
                console.log("✅ 연락처 로드 성공:", res.data);
            } catch (e) { 
                setDebugMsg(`❌ 서버 연결 실패: ${e.message}`);
                console.error(e);
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

    // 3. 위치 추적 로직
    useEffect(() => {
        if (!path || path.length < 2 || !navigator.geolocation) return;

        // 초기 도착 시간 계산
        calculateArrivalTime(routeInfo?.time);

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

                // 남은 시간 재계산
                const totalMinutes = parseInt(routeInfo?.time?.replace(/[^0-9]/g, '')) || 15;
                const remainingRatio = Math.max(0, (path.length - minIdx) / path.length);
                const leftMin = Math.ceil(totalMinutes * remainingRatio);
                const newRemainingTimeStr = leftMin > 0 ? `${leftMin}분` : "곧 도착";
                
                setRemainingTimeStr(newRemainingTimeStr);
                calculateArrivalTime(newRemainingTimeStr); // 도착 예정 시간도 업데이트

                const endPos = path[path.length - 1];
                if (getDistance(newLat, newLng, endPos.lat, endPos.lng) < 30) {
                    toast.success("목적지에 도착했습니다! 🎉");
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

    // 도착 예정 시간 계산 헬퍼 함수
    const calculateArrivalTime = (timeStr) => {
        const minutes = parseInt(timeStr?.replace(/[^0-9]/g, '')) || 0;
        const now = new Date();
        now.setMinutes(now.getMinutes() + minutes);
        setArrivalTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };


    // 🚨 SOS 버튼 로직
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
            toast.error("연락처를 불러오지 못했습니다. 112로 연결합니다.");
            window.location.href = 'tel:112';
            return;
        }

        const phoneNumbers = contacts.map(c => c.phone).join(',');
        const message = `[SafeWay 긴급] SOS! 도와주세요! 현재 위치: https://map.kakao.com/link/map/${currentPos?.lat},${currentPos?.lng}`;
        const separator = navigator.userAgent.match(/iPhone|iPad/i) ? '&' : '?';
        const smsLink = `sms:${phoneNumbers}${separator}body=${encodeURIComponent(message)}`;
        
        window.location.href = smsLink;
        toast.success(`보호자 ${contacts.length}명에게 연결합니다.`);
    };

    if (!path) return <div className="flex justify-center items-center h-screen">경로 데이터를 불러오는 중...</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans relative overflow-hidden">
            
            {/* 🚨 디버그 메시지 패널 */}
            {debugMsg && (
                <div className="absolute top-0 left-0 right-0 bg-black/80 text-yellow-300 p-2 text-[10px] z-50 break-all text-center">
                    DEBUG: {debugMsg}
                </div>
            )}

            {/* 🚨🚨🚨 1. 지도 전체 화면 배경 (가장 뒤) 🚨🚨🚨 */}
            <div className="absolute inset-0 z-0">
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
            </div>

            {/* 상단 뒤로가기 버튼 */}
            <div className="absolute top-8 left-4 z-20 pointer-events-auto">
                <button onClick={() => navigate(-1)} className="bg-white p-3 rounded-full shadow-md text-gray-700 hover:bg-gray-50 transition active:scale-95">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>

             {/* 🚨🚨🚨 2. 새로운 시간 정보 카드 UI (요청하신 디자인 적용) 🚨🚨🚨 */}
             {/* 시트 상태에 따라 위치가 부드럽게 변합니다 (transition-all) */}
            <div 
                className={`absolute left-4 right-4 z-20 transition-all duration-300 ease-in-out ${isSheetOpen ? 'bottom-[430px]' : 'bottom-[90px]'}`}
            >
                <div className="bg-white rounded-[2rem] shadow-lg p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1">남은 시간</p>
                        <p className="text-4xl font-black text-blue-600 tracking-tight">
                            {remainingTimeStr.replace('분', '')}
                            <span className="text-2xl ml-1">분</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-gray-500 mb-1">도착 예정</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {arrivalTimeStr}
                        </p>
                    </div>
                </div>
            </div>


            {/* 🚨🚨🚨 3. 슬라이딩 바텀 시트 (하단 패널) 🚨🚨🚨 */}
            <div 
                className={`fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out will-change-transform ${isSheetOpen ? 'translate-y-0' : 'translate-y-[340px]'}`}
            >
                {/* 시트 핸들 (열기/닫기 버튼) */}
                <button 
                    onClick={() => setIsSheetOpen(!isSheetOpen)} 
                    className="w-full h-10 flex items-center justify-center active:bg-gray-100 rounded-t-[2.5rem] focus:outline-none"
                >
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                </button>

                {/* 시트 내용 (기존 하단 패널 내용) */}
                <div className="p-6 pt-2 flex flex-col items-center h-[380px] overflow-y-auto no-scrollbar">
                    
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
                    <div className="flex-1 flex flex-col items-center justify-center w-full mb-4 relative min-h-[160px]">
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
                    <div className="w-full grid grid-cols-2 gap-3 pb-4">
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
        </div>
    );
}