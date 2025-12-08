// frontend/src/RouteSearchScreen.js

import React, { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, ArrowLeft, Navigation, Map as MapIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:3005';

// 🚨 로컬 테스트용 가상 경로 (서울 시청 근처)
const DUMMY_PATH = [
  { lat: 37.5668, lng: 126.9790 }, 
  { lat: 37.5670, lng: 126.9792 },
  { lat: 37.5672, lng: 126.9794 }, 
];

// 가상의 경로 결과 데이터 (기본값)
const DUMMY_ROUTE_DATA = {
    safety: { score: 0, distance: '계산중...', time: '...', cctv: 0, lights: 0 },
    shortest: { score: 0, distance: '...', time: '...', cctv: 0, lights: 0 },
};

export default function RouteSearchScreen() {
    const [startLocation, setStartLocation] = useState('');
    const [endLocation, setEndLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); 

    // 주소 -> 좌표 변환 함수 (카카오 SDK 사용)
    const searchAddressToCoordinate = (address) => {
        return new Promise((resolve, reject) => {
            if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
                reject(new Error("Kakao Maps SDK 로드 실패"));
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
            // 1. 주소 변환 시도 (Vercel 환경용)
            try {
                const startCoords = await searchAddressToCoordinate(startLocation);
                const endCoords = await searchAddressToCoordinate(endLocation);
                
                // 시작-중간-끝 점 생성 (직선 경로 가정)
                pathPoints = [
                    startCoords,
                    { lat: (startCoords.lat + endCoords.lat) / 2, lng: (startCoords.lng + endCoords.lng) / 2 }, 
                    endCoords
                ];
                console.log("📍 변환된 좌표:", pathPoints);

            } catch (geoError) {
                console.warn("⚠️ 지도 API 사용 불가 (로컬). 가상 데이터 사용");
                pathPoints = DUMMY_PATH; // 로컬에서는 가상 경로 사용
                if (!startLocation) setStartLocation('서울 시청');
                if (!endLocation) setEndLocation('강남역');
            }
            
            // 2. 백엔드 안전 점수 API 호출
            const response = await axios.post(`${API_BASE_URL}/api/route/safety`, {
                pathPoints: pathPoints,
            });
            
            // 3. 결과 받기
            const { safetyScore, cctvCount, lightCount } = response.data;

            // 4. 결과 화면으로 이동 (데이터 전달)
            navigate('/route/result', { 
                state: { 
                    searchData: { start: startLocation || '서울 시청', end: endLocation || '강남역' },
                    pathPoints: pathPoints,
                    routeData: { 
                        ...DUMMY_ROUTE_DATA, 
                        safety: { 
                            score: safetyScore, 
                            cctv: cctvCount, 
                            lights: lightCount,
                            distance: '약 2.3 km', time: '약 18분' // (거리/시간은 지도 API 필요하므로 임시값)
                        },
                        shortest: { score: 72, cctv: Math.floor(cctvCount * 0.6), lights: Math.floor(lightCount * 0.5), distance: '약 1.8 km', time: '약 12분' }
                    }
                } 
            });

        } catch (err) {
            console.error(err);
            setError('경로 검색 실패. 백엔드 서버를 확인하세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <Link to="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-lg font-bold text-gray-800">경로 검색</h1>
                <div className="w-8"></div>
            </header>

            <main className="flex-grow p-5 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">안전한 경로를 <br/>찾아드립니다</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {!window.kakao ? "⚠️ 로컬 환경: 가상 경로 모드" : "목적지를 입력해주세요"}
                    </p>
                </div>

                <form onSubmit={handleSearch} className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
                    <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-blue-500" />
                        <input type="text" placeholder="출발지 입력" value={startLocation} onChange={(e) => setStartLocation(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="relative">
                        <Navigation className="absolute left-4 top-3.5 w-5 h-5 text-red-500" />
                        <input type="text" placeholder="도착지 입력" value={endLocation} onChange={(e) => setEndLocation(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500" />
                    </div>

                    <button type="submit" disabled={loading} className="w-full mt-2 bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition flex justify-center items-center">
                        {loading ? '분석 중...' : <><Search className="w-5 h-5 mr-2" /> 경로 검색</>}
                    </button>
                    {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
                </form>

                {/* 최근 목적지 (더미) */}
                <section>
                    <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">최근 목적지</h3>
                    <div className="space-y-3">
                        {['우리집', '회사'].map((dest, idx) => (
                            <button key={idx} type="button" onClick={() => setEndLocation(dest)} className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
                                <div className="bg-gray-100 p-2 rounded-lg text-gray-500 mr-3"><MapIcon className="w-5 h-5" /></div>
                                <span className="font-medium text-gray-700">{dest}</span>
                            </button>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}