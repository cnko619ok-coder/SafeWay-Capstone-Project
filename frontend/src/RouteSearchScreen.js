// frontend/src/RouteSearchScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, ArrowLeft, Navigation, Map as MapIcon, Crosshair, Star, X, MinusCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// 🚨 ngrok 주소 확인
const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

// 로컬 백업용 가상 경로
const DUMMY_PATH = [
  { lat: 37.5668, lng: 126.9790 }, 
  { lat: 37.5670, lng: 126.9792 },
  { lat: 37.5672, lng: 126.9794 }, 
];

const DUMMY_ROUTE_DATA = {
    safety: { score: 0, distance: '...', time: '...', cctv: 0, lights: 0 },
    shortest: { score: 0, distance: '...', time: '...', cctv: 0, lights: 0 },
    balanced: { score: 0, distance: '...', time: '...', cctv: 0, lights: 0 },
};

// 🚨 userUid를 받아야 DB에 저장할 수 있습니다.
export default function RouteSearchScreen({ userUid }) {
    const [startLocation, setStartLocation] = useState('');
    const [endLocation, setEndLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); 
    
    // 🚨 즐겨찾기 데이터 (DB 연동)
    const [favorites, setFavorites] = useState([]);
    
    // 최근 목적지는 편의상 로컬 스토리지 유지 (원하면 DB로 변경 가능)
    const [recentDestinations, setRecentDestinations] = useState(() => {
        const saved = localStorage.getItem('safeway_recent_destinations');
        return saved ? JSON.parse(saved) : [];
    });
    const [isEditing, setIsEditing] = useState(false);

    // 1. 즐겨찾기 목록 불러오기 (GET)
    const fetchFavorites = async () => {
        if (!userUid) return;
        try {
            const response = await axios.get(`${API_BASE_URL}/api/favorites/${userUid}`);
            setFavorites(response.data);
        } catch (err) {
            console.error("즐겨찾기 로드 실패", err);
        }
    };

    // 화면 켜질 때 즐겨찾기 로드
    useEffect(() => {
        fetchFavorites();
    }, [userUid]);

    // 최근 목적지 로컬 저장
    useEffect(() => {
        localStorage.setItem('safeway_recent_destinations', JSON.stringify(recentDestinations));
    }, [recentDestinations]);


    // 2. 즐겨찾기 추가 (POST)
    const handleAddFavorite = async () => {
        if (!userUid) return alert("로그인이 필요합니다.");
        if (!endLocation) return alert("도착지를 먼저 입력해주세요.");
        
        const name = prompt("이 장소의 별명을 입력해주세요 (예: 헬스장, 학교)");
        if (name) {
            try {
                await axios.post(`${API_BASE_URL}/api/favorites`, {
                    uid: userUid,
                    name: name,
                    address: endLocation
                });
                alert(`'${name}'(으)로 즐겨찾기에 추가되었습니다.`);
                fetchFavorites(); // 목록 새로고침
            } catch (err) {
                alert("즐겨찾기 추가 실패");
            }
        }
    };

    // 3. 즐겨찾기 삭제 (POST / delete)
    const handleDeleteFavorite = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("이 즐겨찾기를 삭제하시겠습니까?")) {
            try {
                await axios.post(`${API_BASE_URL}/api/favorites/delete`, {
                    uid: userUid,
                    favoriteId: id
                });
                fetchFavorites(); // 목록 새로고침
            } catch (err) {
                alert("삭제 실패");
            }
        }
    };
    
    // (이하 최근 목적지 삭제 함수는 로컬 스토리지용 유지)
    const handleDeleteRecent = (indexToDelete) => {
        setRecentDestinations(prev => prev.filter((_, index) => index !== indexToDelete));
    };
    const addRecentDestination = (name) => {
        setRecentDestinations(prev => {
            const filtered = prev.filter(dest => dest.name !== name);
            return [{ name, address: '최근 검색' }, ...filtered].slice(0, 5);
        });
    };

    // 주소 -> 좌표 변환 (기존 코드 유지)
    const searchAddressToCoordinate = (address) => {
        return new Promise((resolve, reject) => {
            if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
                reject(new Error("Kakao Maps SDK가 로드되지 않았습니다."));
                return;
            }
            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.addressSearch(address, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    resolve({
                        lat: parseFloat(result[0].y),
                        lng: parseFloat(result[0].x),
                    });
                } else {
                    reject(new Error(`주소 검색 실패: ${address}`));
                }
            });
        });
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return alert("위치 정보를 사용할 수 없습니다.");
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
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

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (endLocation.trim()) {
            addRecentDestination(endLocation);
        }

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
                console.warn("로컬 환경: 가상 데이터 사용");
                pathPoints = DUMMY_PATH;
                if (!startLocation) setStartLocation('서울 시청');
                if (!endLocation) setEndLocation('강남역');
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
                    <h2 className="text-xl font-bold text-gray-800">안전한 경로를 <br/>찾아드립니다</h2>
                    <p className="text-sm text-gray-500 mt-1">{!window.kakao ? "⚠️ 로컬 환경: 가상 경로 모드" : "목적지를 입력해주세요"}</p>
                </div>

                <form onSubmit={handleSearch} className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                        <input type="text" placeholder="출발지 입력" value={startLocation} onChange={(e) => setStartLocation(e.target.value)} className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all" />
                        <button type="button" onClick={handleCurrentLocation} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors" title="현위치"><Crosshair className="w-5 h-5" /></button>
                    </div>

                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                        <input type="text" placeholder="도착지 입력" value={endLocation} onChange={(e) => setEndLocation(e.target.value)} className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-800 outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all" />
                        
                        {/* 🚨 즐겨찾기 추가 버튼 (DB 연동) */}
                        <button type="button" onClick={handleAddFavorite} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors" title="즐겨찾기 추가">
                            <Star className="w-5 h-5 fill-current" />
                        </button>
                    </div>

                    <button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center">
                        {loading ? '분석 중...' : <><Search className="w-5 h-5 mr-2" /><span>경로 검색</span></>}
                    </button>
                    {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
                </form>

                {/* 🚨 즐겨찾기 목록 (DB 연동) */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center"><Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" /> 즐겨찾기</h3>
                        <button type="button" onClick={() => setIsEditing(!isEditing)} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">{isEditing ? '완료' : '편집'}</button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {favorites.length === 0 ? <p className="col-span-2 text-center text-gray-400 text-xs py-4">자주 가는 곳을 별표로 등록해보세요!</p> :
                        favorites.map((fav) => (
                            <div key={fav.id} className="relative group">
                                <button type="button" onClick={() => !isEditing && setEndLocation(fav.address)} className={`w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left ${isEditing ? 'opacity-70' : ''}`}>
                                    <div className="font-bold text-gray-800 mb-1">{fav.name}</div>
                                    <div className="text-xs text-gray-400 truncate">{fav.address}</div>
                                </button>
                                {isEditing && (
                                    <button onClick={(e) => handleDeleteFavorite(fav.id, e)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 bg-white rounded-full shadow-sm">
                                        <MinusCircle className="w-5 h-5 fill-red-50" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
                
                {/* 최근 목적지 (로컬 스토리지 유지) */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-bold text-gray-700">최근 목적지</h3>
                        {recentDestinations.length > 0 && <button type="button" onClick={() => setRecentDestinations([])} className="text-xs text-gray-400 hover:text-red-500">전체 삭제</button>}
                    </div>
                    <div className="space-y-3">
                        {recentDestinations.map((dest, idx) => (
                            <button key={idx} type="button" onClick={() => setEndLocation(dest.name)} className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md flex items-center group transition-all">
                                <div className="bg-gray-50 p-3 rounded-xl text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors"><MapIcon className="w-5 h-5" /></div>
                                <div className="ml-4 text-left"><p className="font-bold text-gray-800">{dest.name}</p><p className="text-xs text-gray-400 mt-0.5">{dest.address}</p></div>
                            </button>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}