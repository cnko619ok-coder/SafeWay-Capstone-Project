// frontend/src/RouteSearchScreen.js

import React, { useState } from 'react';
import axios from 'axios';
import { Search, MapPin, ArrowLeft, Map as MapIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev';

// 🚨 로컬 환경 백업용 가상 경로
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


export default function RouteSearchScreen({ userUid }) {
    const [startLocation, setStartLocation] = useState('');
    const [endLocation, setEndLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); 

    // 🚨 주소를 좌표로 변환하는 함수 (Geocoding)
    const searchAddressToCoordinate = (address) => {
        return new Promise((resolve, reject) => {
            // 카카오 SDK가 로드되었는지 확인
            if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
                reject(new Error("Kakao Maps SDK가 로드되지 않았습니다."));
                return;
            }

            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.addressSearch(address, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    const coords = {
                        lat: parseFloat(result[0].y),
                        lng: parseFloat(result[0].x),
                    };
                    resolve(coords);
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
                
                // 실제 좌표가 구해지면 경로 포인트로 설정 (직선 경로 가정)
                // 실제로는 경로 탐색 API를 써야 하지만, 여기서는 시작-중간-끝 점으로 시뮬레이션
                pathPoints = [
                    startCoords,
                    { lat: (startCoords.lat + endCoords.lat) / 2, lng: (startCoords.lng + endCoords.lng) / 2 }, 
                    endCoords
                ];
                console.log("📍 실제 주소 좌표 변환 성공:", pathPoints);

            } catch (geoError) {
                console.warn("⚠️ 지도 API 사용 불가 (로컬 환경). 가상 데이터 사용:", geoError.message);
                // 로컬 등 API 사용 불가 시 가상 데이터 사용
                pathPoints = DUMMY_PATH;
                if (startLocation === '') setStartLocation('서울 시청 (가상)');
                if (endLocation === '') setEndLocation('우리집 (가상)');
            }
            
            // 2. 백엔드 안전 점수 계산 API 호출
            const response = await axios.post(`${API_BASE_URL}/api/route/safety`, {
                pathPoints: pathPoints,
            });
            
            const finalSafetyScore = response.data.safetyScore; 

            // 3. 결과 화면으로 이동
            navigate('/route/result', { 
                state: { 
                    searchData: { start: startLocation, end: endLocation },
                    routeData: { ...DUMMY_ROUTE_DATA, safety: { ...DUMMY_ROUTE_DATA.safety, score: finalSafetyScore } }
                } 
            });

        } catch (err) {
            console.error('경로 검색 API 호출 실패:', err);
            setError('경로 검색에 실패했습니다. 백엔드 서버 상태를 확인하세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            
            {/* 헤더 */}
            <header className="bg-white p-4 border-b shadow-sm flex items-center">
                <Link to="/" className="text-gray-600 hover:text-gray-800 mr-4">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-semibold text-gray-800">경로 검색</h1>
            </header>

            <main className="p-4 space-y-6 flex-grow">
                
                <p className="text-gray-600 text-sm">
                    {!window.kakao ? "⚠️ 로컬 환경: 가상 경로 검색 모드" : "안전한 귀가 경로를 찾아드립니다"}
                </p>

                {/* 1. 입력 필드 */}
                <form onSubmit={handleSearch} className="space-y-4 bg-white p-4 rounded-xl shadow-md">
                    <div className="relative">
                        <MapPin className="w-5 h-5 text-blue-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="출발지 입력"
                            value={startLocation}
                            onChange={(e) => setStartLocation(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="w-5 h-5 text-red-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="도착지 입력 (우리집)"
                            value={endLocation}
                            onChange={(e) => setEndLocation(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* 경로 검색 버튼 */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        {loading ? '검색 중...' : (<><Search className="w-5 h-5" /><span>경로 검색</span></>)}
                    </button>
                    {error && <p className="text-sm text-red-500 text-center mt-2">{error}</p>}
                </form>

                {/* 2. 최근 목적지 */}
                <section>
                    <h2 className="text-md font-semibold text-gray-700 mb-2">최근 목적지</h2>
                    <div className="space-y-2">
                        {['우리집', '회사', '지하철역'].map(dest => (
                            <button
                                key={dest}
                                onClick={() => setEndLocation(dest)}
                                className="w-full text-left p-3 bg-white border rounded-lg shadow-sm hover:bg-gray-100 transition-colors flex items-center space-x-3"
                            >
                                {/* 🚨 MapIcon 사용 */}
                                <MapIcon className="w-5 h-5 text-gray-400" />
                                <span>{dest}</span>
                            </button>
                        ))}
                    </div>
                </section>
                
            </main>
        </div>
    );
}