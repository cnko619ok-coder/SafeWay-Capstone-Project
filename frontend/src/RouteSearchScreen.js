// frontend/src/RouteSearchScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, ArrowLeft, Navigation, Map as MapIcon, Crosshair, Star, X, MinusCircle, Shield, Clock, Camera, Lightbulb, Scale } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

const DUMMY_PATH = [
  { lat: 37.5668, lng: 126.9790 }, { lat: 37.5670, lng: 126.9792 }, { lat: 37.5672, lng: 126.9794 }, 
];

const DUMMY_ROUTE_DATA = {
    safety: { score: 0, distance: '...', time: '...', cctv: 0, lights: 0 },
    shortest: { score: 0, distance: '...', time: '...', cctv: 0, lights: 0 },
    balanced: { score: 0, distance: '...', time: '...', cctv: 0, lights: 0 },
};

function RouteResultCard({ title, data, color, onClick, icon: Icon, isBest }) {
    const colorMap = {
        green: { border: 'border-green-500', text: 'text-green-700', score: 'text-green-600', bg: 'bg-green-50', fill: 'fill-green-100' },
        orange: { border: 'border-orange-400', text: 'text-orange-700', score: 'text-orange-500', bg: 'bg-orange-50', fill: 'fill-orange-100' },
        yellow: { border: 'border-yellow-400', text: 'text-yellow-700', score: 'text-yellow-500', bg: 'bg-yellow-50', fill: 'fill-yellow-100' },
    };
    const theme = colorMap[color] || colorMap.green;

    return (
        <div onClick={onClick} className={`bg-white border-2 ${theme.border} p-5 rounded-3xl shadow-lg cursor-pointer relative overflow-hidden active:scale-95 transition-transform`}>
            {isBest && <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1.5 rounded-bl-xl font-bold">추천</div>}
            <div className="flex justify-between items-center mb-2">
                <div className={`flex items-center ${theme.text} font-bold text-lg`}><Icon className={`w-5 h-5 mr-2 ${theme.fill}`} /> {title}</div>
                <div className="text-right"><span className={`text-3xl font-extrabold ${theme.score}`}>{data.score}</span><span className="text-xs text-gray-500">점</span></div>
            </div>
            <div className="flex space-x-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {data.time}</div>
                <div className="flex items-center"><MapPin className="w-4 h-4 mr-1"/> {data.distance}</div>
            </div>
            <div className={`grid grid-cols-2 gap-2 text-xs text-gray-600 ${theme.bg} p-2.5 rounded-2xl`}>
                <div className="flex items-center"><Camera className="w-3.5 h-3.5 mr-1.5 text-blue-500"/> CCTV <strong className="ml-1 text-gray-800">{data.cctv}개</strong></div>
                <div className="flex items-center"><Lightbulb className="w-3.5 h-3.5 mr-1.5 text-yellow-500"/> 가로등 <strong className="ml-1 text-gray-800">{data.lights}개</strong></div>
            </div>
        </div>
    );
}

export default function RouteSearchScreen() {
    const [startLocation, setStartLocation] = useState('');
    const [endLocation, setEndLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); 
    
    const [searchResult, setSearchResult] = useState(null);
    const [calculatedPath, setCalculatedPath] = useState([]);

    const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('safeway_favorites')) || []);
    const [recentDestinations, setRecentDestinations] = useState(() => JSON.parse(localStorage.getItem('safeway_recent_destinations')) || []);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => { localStorage.setItem('safeway_favorites', JSON.stringify(favorites)); }, [favorites]);
    useEffect(() => { localStorage.setItem('safeway_recent_destinations', JSON.stringify(recentDestinations)); }, [recentDestinations]);

    const handleAddFavorite = () => {
        if (!endLocation) return alert("도착지를 먼저 입력해주세요.");
        const name = prompt("별명 입력");
        if (name) setFavorites([{ id: Date.now(), name, address: endLocation }, ...favorites]);
    };
    const handleDeleteFavorite = (id, e) => { e.stopPropagation(); if(window.confirm("삭제하시겠습니까?")) setFavorites(favorites.filter(fav => fav.id !== id)); };
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
                        if (status === window.kakao.maps.services.Status.OK) {
                            setStartLocation(result[0].address.address_name);
                        } else { setStartLocation(`${latitude}, ${longitude}`); }
                        setLoading(false);
                    });
                } else {
                    setStartLocation(`${latitude}, ${longitude}`);
                    setLoading(false);
                }
            },
            () => { alert("위치 파악 실패"); setLoading(false); },
            { enableHighAccuracy: true }
        );
    };

    const searchAddressToCoordinate = (address) => {
        return new Promise((resolve, reject) => {
            if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
                // 🚨 에러 1: SDK 로드 실패
                reject(new Error("카카오맵이 아직 로딩되지 않았습니다. 잠시 후 다시 시도해주세요."));
                return;
            }
            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.addressSearch(address, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
                } else {
                    // 🚨 에러 2: 검색 결과 없음 (ZERO_RESULT) 또는 에러 (ERROR)
                    // status 값을 알림창에 띄워서 확인합니다.
                    reject(new Error(`검색 실패 (상태코드: ${status}) - 정확한 주소를 입력했는지 확인해주세요.`));
                }
            });
        });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearchResult(null);

        if (endLocation.trim()) setRecentDestinations(prev => [{ name: endLocation, address: '최근 검색' }, ...prev.filter(d => d.name !== endLocation)].slice(0, 5));

        try {
            let pathPoints = [];
            try {
                // 🚨 좌표 변환 시도
                const startCoords = await searchAddressToCoordinate(startLocation);
                const endCoords = await searchAddressToCoordinate(endLocation);
                
                pathPoints = [
                    startCoords,
                    { lat: (startCoords.lat + endCoords.lat) / 2, lng: (startCoords.lng + endCoords.lng) / 2 }, 
                    endCoords
                ];
                // 🚨 성공 알림 (테스트용)
                // alert(`✅ 좌표 변환 성공!\n출발: ${startCoords.lat}, ${startCoords.lng}\n도착: ${endCoords.lat}, ${endCoords.lng}`);

            } catch (geoError) {
                // 🚨 실패 알림 (원인 파악용)
                alert(`⚠️ 지도 오류 발생: ${geoError.message}\n(가상 데이터로 대체합니다)`);
                pathPoints = DUMMY_PATH;
                if (!startLocation) setStartLocation('서울 시청');
                if (!endLocation) setEndLocation('강남역');
            }
            
            setCalculatedPath(pathPoints);

            const response = await axios.post(`${API_BASE_URL}/api/route/safety`, { pathPoints });
            const { safetyScore, cctvCount, lightCount } = response.data;

            setTimeout(() => {
                 setSearchResult({
                    safety: { 
                        ...DUMMY_ROUTE_DATA.safety, 
                        score: safetyScore, cctv: cctvCount, lights: lightCount,
                        distance: '2.3 km', time: '18분' 
                    },
                    shortest: { 
                        ...DUMMY_ROUTE_DATA.shortest, 
                        score: 72, cctv: Math.floor(cctvCount * 0.6), lights: Math.floor(lightCount * 0.5), 
                        distance: '1.8 km', time: '12분' 
                    },
                    balanced: {
                        ...DUMMY_ROUTE_DATA.balanced,
                        score: 85, cctv: Math.floor(cctvCount * 0.8), lights: Math.floor(lightCount * 0.8),
                        distance: '2.0 km', time: '15분'
                    }
                });
                 setLoading(false);
            }, 500);

        } catch (err) { 
            alert('검색 실패: ' + err.message); 
            setLoading(false);
        } 
    };

    const goToMapScreen = () => navigate('/route/result', { 
        state: { 
            searchData: { start: startLocation, end: endLocation }, 
            pathPoints: calculatedPath, 
            routeData: searchResult 
        } 
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <Link to="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition"><ArrowLeft className="w-6 h-6" /></Link>
                <h1 className="text-lg font-bold text-gray-800">경로 검색</h1>
                <div className="w-8"></div>
            </header>

            <main className="flex-grow p-5 space-y-6">
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
                </form>

                {!searchResult ? (
                    <>
                        <section>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center"><Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" /> 즐겨찾기</h3>
                                <button type="button" onClick={() => setIsEditing(!isEditing)} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">{isEditing ? '완료' : '편집'}</button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {favorites.map((fav) => (
                                    <div key={fav.id} className="relative group">
                                        <button type="button" onClick={() => !isEditing && setEndLocation(fav.address)} className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md text-left"><div className="font-bold text-gray-800 mb-1">{fav.name}</div><div className="text-xs text-gray-400 truncate">{fav.address}</div></button>
                                        {isEditing && <button onClick={(e) => handleDeleteFavorite(fav.id, e)} className="absolute top-2 right-2 text-red-500 p-1 bg-white rounded-full shadow-sm"><MinusCircle className="w-5 h-5" /></button>}
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-sm font-bold text-gray-700">최근 목적지</h3>
                                {recentDestinations.length > 0 && <button type="button" onClick={() => setRecentDestinations([])} className="text-xs text-gray-400 hover:text-red-500">전체 삭제</button>}
                            </div>
                            <div className="space-y-3">
                                {recentDestinations.map((dest, idx) => (
                                    <button key={idx} type="button" onClick={() => setEndLocation(dest.name)} className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md flex items-center">
                                        <div className="bg-gray-50 p-3 rounded-xl text-gray-400"><MapIcon className="w-5 h-5" /></div>
                                        <div className="ml-4 text-left"><p className="font-bold text-gray-800">{dest.name}</p><p className="text-xs text-gray-400 mt-0.5">{dest.address}</p></div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </>
                ) : (
                    <section className="animate-fade-in-up space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-lg font-bold text-gray-800">추천 경로</h3>
                            <button onClick={() => setSearchResult(null)} className="text-sm text-blue-600 font-medium">다시 검색</button>
                        </div>
                        
                        <RouteResultCard title="안전 경로" data={searchResult.safety} color="green" icon={Shield} isBest={true} onClick={goToMapScreen} />
                        <RouteResultCard title="최단 경로" data={searchResult.shortest} color="orange" icon={Clock} onClick={goToMapScreen} />
                        <RouteResultCard title="균형 경로" data={searchResult.balanced} color="yellow" icon={Scale} onClick={goToMapScreen} />
                    </section>
                )}
            </main>
        </div>
    );
}