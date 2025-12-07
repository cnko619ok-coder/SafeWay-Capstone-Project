// frontend/src/RouteSearchScreen.js

import React, { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, ArrowLeft, Navigation, Clock, Map as MapIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// 🚨 ngrok 주소 유지 (바뀌었다면 수정 필요)
const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

// 로컬 환경 백업용 가상 경로
const DUMMY_PATH = [
  { lat: 37.5668, lng: 126.9790 }, 
  { lat: 37.5670, lng: 126.9792 },
  { lat: 37.5672, lng: 126.9794 }, 
];

// 가상의 경로 결과 데이터
const DUMMY_ROUTE_DATA = {
    safety: { score: 0, distance: '계산중...', time: '...', cctv: 0, lights: 0 },
    shortest: { score: 0, distance: '...', time: '...', cctv: 0, lights: 0 },
    balanced: { score: 0, distance: '...', time: '...', cctv: 0, lights: 0 },
};

export default function RouteSearchScreen() {
    const [startLocation, setStartLocation] = useState('');
    const [endLocation, setEndLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); 

    // 주소를 좌표로 변환하는 함수 (Geocoding)
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

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        let pathPoints = [];

        try {
            // 1. 실제 주소 좌표 변환 시도 (Vercel 환경용)
            try {
                const startCoords = await searchAddressToCoordinate(startLocation);
                const endCoords = await searchAddressToCoordinate(endLocation);
                
                pathPoints = [
                    startCoords,
                    { lat: (startCoords.lat + endCoords.lat) / 2, lng: (startCoords.lng + endCoords.lng) / 2 }, 
                    endCoords
                ];
                console.log("📍 실제 주소 좌표 변환 성공:", pathPoints);

            } catch (geoError) {
                console.warn("⚠️ 지도 API 사용 불가 (로컬 환경). 가상 데이터 사용");
                pathPoints = DUMMY_PATH;
                // 로컬 테스트를 위해 빈 값이면 기본값 채움
                if (startLocation === '') setStartLocation('서울 시청');
                if (endLocation === '') setEndLocation('강남역');
            }
            
            // 2. 백엔드 안전 점수 계산 API 호출
            const response = await axios.post(`${API_BASE_URL}/api/route/safety`, {
                pathPoints: pathPoints,
            });
            
            const { safetyScore, cctvCount, lightCount } = response.data;

            // 3. 결과 화면으로 이동
            navigate('/route/result', { 
                state: { 
                    searchData: { start: startLocation || '서울 시청', end: endLocation || '강남역' },
                    routeData: { 
                        ...DUMMY_ROUTE_DATA, 
                        safety: { 
                            ...DUMMY_ROUTE_DATA.safety, 
                            score: safetyScore, 
                            cctv: cctvCount, 
                            lights: lightCount,
                            distance: '2.3 km', time: '18분' 
                        },
                        shortest: { ...DUMMY_ROUTE_DATA.shortest, score: 72, cctv: Math.floor(cctvCount * 0.6), lights: Math.floor(lightCount * 0.5), distance: '1.8 km', time: '12분' }
                    }
                } 
            });

        } catch (err) {
            console.error(err);
            setError('경로 검색 실패. 서버 상태를 확인하세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            
            {/* 1. 상단 네비게이션 */}
            <header className="bg-white p-4 flex items-center justify-between sticky top-0 z-10">
                <Link to="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-lg font-bold text-gray-800">경로 검색</h1>
                <div className="w-8"></div> {/* 중앙 정렬을 위한 빈 공간 */}
            </header>

            <main className="flex-grow p-5 space-y-6">
                
                {/* 2. 안내 멘트 */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800">안전한 경로를 <br/>찾아드립니다</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {!window.kakao ? "⚠️ 로컬 환경: 가상 경로 모드" : "목적지를 입력해주세요"}
                    </p>
                </div>

                {/* 3. 검색 입력 폼 (카드 형태) */}
                <form onSubmit={handleSearch} className="bg-white p-5 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] space-y-4">
                    
                    {/* 출발지 입력 */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full ring-4 ring-blue-100"></div>
                        <input
                            type="text"
                            placeholder="출발지 입력"
                            value={startLocation}
                            onChange={(e) => setStartLocation(e.target.value)}
                            className="w-full pl-10 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                        />
                        {/* 현위치 아이콘 */}
                        <button type="button" className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 p-1 bg-white rounded-lg shadow-sm border border-gray-100">
                            <Navigation className="w-4 h-4" />
                        </button>
                    </div>

                    {/* 도착지 입력 */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full ring-4 ring-red-100"></div>
                        <input
                            type="text"
                            placeholder="도착지 입력"
                            value={endLocation}
                            onChange={(e) => setEndLocation(e.target.value)}
                            className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-800 placeholder-gray-400 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all outline-none"
                        />
                    </div>

                    {/* 검색 버튼 */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:from-blue-700 hover:to-blue-600 transition-all transform active:scale-95 flex items-center justify-center"
                    >
                        {loading ? (
                            <span className="flex items-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>분석 중...</span>
                        ) : (
                            <>
                                <Search className="w-5 h-5 mr-2" />
                                <span>경로 검색</span>
                            </>
                        )}
                    </button>
                    {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
                </form>

                {/* 4. 최근 목적지 */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-bold text-gray-700">최근 목적지</h3>
                        <button type="button" className="text-xs text-gray-400 hover:text-gray-600">편집</button>
                    </div>
                    
                    <div className="space-y-3">
                        {[
                            { name: '우리집', icon: 'home', address: '서울시 강남구 역삼동' },
                            { name: '회사', icon: 'briefcase', address: '서울시 중구 태평로' },
                            { name: '지하철역', icon: 'train', address: '강남역 2호선' }
                        ].map((dest, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setEndLocation(dest.name)}
                                className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex items-center group"
                            >
                                <div className="bg-gray-50 p-3 rounded-xl text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                    {dest.icon === 'home' ? <MapIcon className="w-5 h-5" /> : 
                                     dest.icon === 'briefcase' ? <MapIcon className="w-5 h-5" /> : 
                                     <Navigation className="w-5 h-5" />}
                                </div>
                                <div className="ml-4 text-left">
                                    <p className="font-bold text-gray-800">{dest.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{dest.address}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}