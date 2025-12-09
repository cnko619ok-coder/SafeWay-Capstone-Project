// frontend/src/RouteSearchScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, ArrowLeft, Navigation, Map as MapIcon, Crosshair, Star, X, MinusCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// 🚨 ngrok 주소 유지
const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

const DUMMY_PATH = [
  { lat: 37.5668, lng: 126.9790 }, { lat: 37.5670, lng: 126.9792 }, { lat: 37.5672, lng: 126.9794 }, 
];

const DUMMY_ROUTE_DATA = {
    safety: { score: 0, distance: '...', time: '...', cctv: 0, lights: 0 },
    shortest: { score: 0, distance: '...', time: '...', cctv: 0, lights: 0 },
    balanced: { score: 0, distance: '...', time: '...', cctv: 0, lights: 0 },
};

export default function RouteSearchScreen() {
    const [startLocation, setStartLocation] = useState('');
    const [endLocation, setEndLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); 
    
    // ... (즐겨찾기 관련 코드는 기존과 동일 - 생략 가능하지만 전체 코드 유지) ...
    const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('safeway_favorites')) || []);
    const [recentDestinations, setRecentDestinations] = useState(() => JSON.parse(localStorage.getItem('safeway_recent_destinations')) || []);
    const [isEditing, setIsEditing] = useState(false);
    useEffect(() => { localStorage.setItem('safeway_favorites', JSON.stringify(favorites)); }, [favorites]);
    useEffect(() => { localStorage.setItem('safeway_recent_destinations', JSON.stringify(recentDestinations)); }, [recentDestinations]);
    const handleAddFavorite = () => { /* ... */ }; 
    const handleDeleteFavorite = (id, e) => { e.stopPropagation(); setFavorites(favorites.filter(fav => fav.id !== id)); };
    const handleDeleteRecent = (idx) => setRecentDestinations(prev => prev.filter((_, i) => i !== idx));

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return alert("위치 정보 불가");
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
                    const geocoder = new window.kakao.maps.services.Geocoder();
                    geocoder.coord2Address(longitude, latitude, (result, status) => {
                        if (status === window.kakao.maps.services.Status.OK) setStartLocation(result[0].address.address_name);
                        else setStartLocation(`${latitude}, ${longitude}`);
                        setLoading(false);
                    });
                } else { setStartLocation(`${latitude}, ${longitude}`); setLoading(false); }
            },
            () => { alert("위치 파악 실패"); setLoading(false); }, { enableHighAccuracy: true }
        );
    };

    // 주소 -> 좌표 변환
    const searchAddressToCoordinate = (address) => {
        return new Promise((resolve, reject) => {
            // 🚨 1. SDK 로드 확인
            if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
                reject(new Error("카카오맵 기능이 아직 로딩되지 않았습니다. (새로고침 후 다시 시도해보세요)"));
                return;
            }
            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.addressSearch(address, (result, status) => {
                // 🚨 2. 검색 결과 확인
                if (status === window.kakao.maps.services.Status.OK) {
                    resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
                } else {
                    // 검색 결과가 없거나 에러인 경우
                    reject(new Error(`'${address}'를 지도에서 찾을 수 없습니다.`));
                }
            });
        });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        // setSearchResult(null); // (화면 이동 방식이므로 주석 처리)

        if (endLocation.trim()) setRecentDestinations(prev => [{ name: endLocation, address: '최근 검색' }, ...prev.filter(d => d.name !== endLocation)].slice(0, 5));

        let pathPoints = [];
        try {
            try {
                const startCoords = await searchAddressToCoordinate(startLocation);
                const endCoords = await searchAddressToCoordinate(endLocation);
                pathPoints = [
                    startCoords,
                    { lat: (startCoords.lat + endCoords.lat) / 2, lng: (startCoords.lng + endCoords.lng) / 2 }, 
                    endCoords
                ];
            } catch (geoError) {
                // 🚨🚨🚨 [디버깅] 에러 원인을 알림창으로 띄웁니다! 🚨🚨🚨
                alert(`⚠️ 지도 오류 발생:\n${geoError.message}\n\n(서울시청 가상 경로로 대체합니다)`);
                
                pathPoints = DUMMY_PATH;
            }
            
            const response = await axios.post(`${API_BASE_URL}/api/route/safety`, { pathPoints });
            const { safetyScore, cctvCount, lightCount } = response.data;

            navigate('/route/result', { 
                state: { 
                    searchData: { start: startLocation, end: endLocation },
                    pathPoints,
                    routeData: { 
                        ...DUMMY_ROUTE_DATA, 
                        safety: { ...DUMMY_ROUTE_DATA.safety, score: safetyScore, cctv: cctvCount, lights: lightCount, distance: '약 2.5 km', time: '약 20분' },
                        shortest: { ...DUMMY_ROUTE_DATA.shortest, score: 72, cctv: Math.floor(cctvCount * 0.6), lights: Math.floor(lightCount * 0.5), distance: '약 1.8 km', time: '약 15분' }
                    }
                } 
            });

        } catch (err) { setError('경로 검색 실패'); } 
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <Link to="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition"><ArrowLeft className="w-6 h-6" /></Link>
                <h1 className="text-lg font-bold text-gray-800">경로 검색</h1>
                <div className="w-8"></div>
            </header>

            <main className="flex-grow p-5 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">어디로 갈까요?</h2>
                    <p className="text-sm text-gray-500 mt-1">{!window.kakao ? "⚠️ 로컬 환경: 가상 경로 모드" : "목적지를 입력해주세요"}</p>
                </div>

                <form onSubmit={handleSearch} className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                        <input type="text" placeholder="출발지 입력" value={startLocation} onChange={(e) => setStartLocation(e.target.value)} className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-800 outline-none focus:bg-white focus:border-blue-500 transition-all" />
                        <button type="button" onClick={handleCurrentLocation} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"><Crosshair className="w-5 h-5" /></button>
                    </div>
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                        <input type="text" placeholder="도착지 입력" value={endLocation} onChange={(e) => setEndLocation(e.target.value)} className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-800 outline-none focus:bg-white focus:border-red-500 transition-all" />
                        <button type="button" onClick={handleAddFavorite} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors"><Star className="w-5 h-5 fill-current" /></button>
                    </div>
                    <button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center">
                        {loading ? '분석 중...' : <><Search className="w-5 h-5 mr-2" /><span>경로 검색</span></>}
                    </button>
                    {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
                </form>

                {/* 즐겨찾기 등 기존 UI 유지 (생략) */}
            </main>
        </div>
    );
}