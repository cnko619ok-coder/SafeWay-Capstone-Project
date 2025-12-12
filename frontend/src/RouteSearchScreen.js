// frontend/src/RouteSearchScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, ArrowLeft, Clock, Map as MapIcon, Crosshair, Star, MinusCircle, Shield, Camera, Lightbulb, Scale } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// 🚨 ngrok 주소 확인
const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

// 로컬 환경 백업용 가상 경로 (기존 유지)
const DUMMY_PATH = [
  { lat: 37.5668, lng: 126.9790 }, { lat: 37.5670, lng: 126.9792 }, { lat: 37.5672, lng: 126.9794 }, 
];

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

// 🚨 userUid props 추가 (이게 있어야 개인화가 됩니다!)
export default function RouteSearchScreen({ userUid }) {
    const [startLocation, setStartLocation] = useState('');
    const [endLocation, setEndLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); 
    const [searchResult, setSearchResult] = useState(null);
    const [calculatedPath, setCalculatedPath] = useState([]);

    // 🚨 [수정됨] 로컬 스토리지 제거 -> 빈 배열로 초기화
    const [favorites, setFavorites] = useState([]);
    const [recentDestinations, setRecentDestinations] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    
    // 🚨 [신규] 내 위치 저장용
    const [myPos, setMyPos] = useState(null);

    // 🚨🚨🚨 [신규] 데이터 불러오기 (서버 API 사용) 🚨🚨🚨
    useEffect(() => {
        if (userUid) {
            fetchFavorites();
            fetchHistory();
        }
    }, [userUid]);

    const fetchFavorites = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/favorites/${userUid}`);
            setFavorites(res.data);
        } catch (e) { console.error("즐겨찾기 로드 실패", e); }
    };

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/history/${userUid}`);
            setRecentDestinations(res.data);
        } catch (e) { console.error("히스토리 로드 실패", e); }
    };

    // 🚨 [수정됨] 즐겨찾기 추가 (서버로 전송)
    const handleAddFavorite = async () => {
        if (!endLocation) return alert("도착지를 먼저 입력해주세요.");
        if (!userUid) return alert("로그인이 필요합니다.");

        const name = prompt("이 장소의 별명을 입력해주세요 (예: 헬스장, 학교)");
        if (name) {
            try {
                await axios.post(`${API_BASE_URL}/api/favorites`, { 
                    uid: userUid, 
                    name: name, 
                    address: endLocation 
                });
                alert("즐겨찾기에 추가되었습니다.");
                fetchFavorites(); // 목록 갱신
            } catch (e) {
                alert("추가 실패");
            }
        }
    };

    // 🚨 [수정됨] 즐겨찾기 삭제 (서버로 전송)
    const handleDeleteFavorite = async (id, e) => { 
        e.stopPropagation(); 
        if(window.confirm("삭제하시겠습니까?")) {
            try {
                await axios.post(`${API_BASE_URL}/api/favorites/delete`, { 
                    uid: userUid, 
                    favoriteId: id 
                });
                fetchFavorites();
            } catch (e) { alert("삭제 실패"); }
        }
    };

    // 🚨 [수정됨] 최근 목적지 삭제 (화면에서만 임시 삭제)
    // (서버 개별 삭제 API가 없다면 화면에서만 지우고, 전체 삭제 기능 등을 활용)
    const handleDeleteRecent = (idx) => {
        // 임시로 화면에서 제거 (완벽하게 하려면 API 필요)
        setRecentDestinations(prev => prev.filter((_, i) => i !== idx));
    };

    // 현위치 버튼 핸들러 (기존 로직 유지)
    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return alert("위치 정보 불가");
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setMyPos({ lat: latitude, lng: longitude }); 
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
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // 장소 검색 함수 (기존 로직 유지)
    const searchAddressToCoordinate = (keyword) => {
        return new Promise((resolve, reject) => {
            if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
                reject(new Error("카카오맵이 아직 로딩되지 않았습니다."));
                return;
            }
            const ps = new window.kakao.maps.services.Places();
            const options = myPos ? {
                location: new window.kakao.maps.LatLng(myPos.lat, myPos.lng),
                radius: 2000, 
                sort: window.kakao.maps.services.SortBy.DISTANCE
            } : {};
            
            ps.keywordSearch(keyword, (data, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    resolve({ lat: parseFloat(data[0].y), lng: parseFloat(data[0].x) });
                } else {
                    const geocoder = new window.kakao.maps.services.Geocoder();
                    geocoder.addressSearch(keyword, (res, stat) => {
                        if (stat === 'OK') resolve({ lat: parseFloat(res[0].y), lng: parseFloat(res[0].x) });
                        else reject(new Error("검색 결과 없음"));
                    });
                }
            }, options);
        });
    };

    // 검색 핸들러 (기존 로직 유지 + 히스토리 저장 추가)
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSearchResult(null);

        // 🚨 [추가됨] 검색 시 서버에 최근 목적지 저장
        if (endLocation.trim() && userUid) {
            try {
                await axios.post(`${API_BASE_URL}/api/history`, { 
                    uid: userUid, 
                    name: endLocation, 
                    address: '최근 검색' 
                });
                fetchHistory(); // 목록 갱신
            } catch (e) { console.error("히스토리 저장 실패"); }
        }

        try {
            let pathPoints = [];
            try {
                const startCoords = await searchAddressToCoordinate(startLocation);
                const endCoords = await searchAddressToCoordinate(endLocation);
                pathPoints = [startCoords, endCoords];
            } catch (geoError) {
                console.warn("지도 API 실패:", geoError);
                alert(`⚠️ ${geoError.message}\n(가상 경로로 대체합니다)`);
                pathPoints = DUMMY_PATH;
                if (!startLocation) setStartLocation('서울 시청');
                if (!endLocation) setEndLocation('강남역');
            }
            
            setCalculatedPath(pathPoints);

            const response = await axios.post(`${API_BASE_URL}/api/route/analyze`, {
                start: pathPoints[0],
                end: pathPoints[pathPoints.length - 1]
            });
            
            const { safety, shortest, balanced } = response.data;
            setSearchResult({ safety, shortest, balanced });

        } catch (err) { 
            console.error(err);
            alert('경로 분석 실패: ' + err.message); 
        } finally {
            setLoading(false);
        }
    };

    const goToMapScreen = () => navigate('/route/result', { 
        state: { 
            searchData: { start: startLocation, end: endLocation }, 
            pathPoints: calculatedPath.length > 0 ? calculatedPath : DUMMY_PATH, 
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
                        <input type="text" placeholder="출발지 (예: 서울역)" value={startLocation} onChange={(e) => setStartLocation(e.target.value)} className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-800 outline-none focus:bg-white focus:border-blue-500 transition-all" />
                        <button type="button" onClick={handleCurrentLocation} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"><Crosshair className="w-5 h-5" /></button>
                    </div>
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                        <input type="text" placeholder="도착지 (예: 강남역)" value={endLocation} onChange={(e) => setEndLocation(e.target.value)} className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-800 outline-none focus:bg-white focus:border-red-500 transition-all" />
                        <button type="button" onClick={handleAddFavorite} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors"><Star className="w-5 h-5 fill-current" /></button>
                    </div>
                    <button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center">
                        {loading ? '분석 중...' : <><Search className="w-5 h-5 mr-2" /><span>경로 검색</span></>}
                    </button>
                </form>

                {!searchResult ? (
                    <>
                        {/* 즐겨찾기 목록 */}
                        <section>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center"><Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" /> 즐겨찾기</h3>
                                <button type="button" onClick={() => setIsEditing(!isEditing)} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">{isEditing ? '완료' : '편집'}</button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {favorites.length === 0 ? <p className="col-span-2 text-center text-gray-400 text-xs py-4">즐겨찾기가 없습니다.</p> :
                                favorites.map((fav) => (
                                    <div key={fav.id} className="relative group">
                                        <button type="button" onClick={() => !isEditing && setEndLocation(fav.address)} className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md text-left"><div className="font-bold text-gray-800 mb-1">{fav.name}</div><div className="text-xs text-gray-400 truncate">{fav.address}</div></button>
                                        {isEditing && <button onClick={(e) => handleDeleteFavorite(fav.id, e)} className="absolute top-2 right-2 text-red-500 p-1 bg-white rounded-full shadow-sm"><MinusCircle className="w-5 h-5" /></button>}
                                    </div>
                                ))}
                            </div>
                        </section>
                        {/* 최근 목적지 */}
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