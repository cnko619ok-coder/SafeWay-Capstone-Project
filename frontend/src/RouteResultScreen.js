// frontend/src/RouteResultScreen.js

import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Shield, Clock, MapPin, Navigation, Camera, Lightbulb } from 'lucide-react';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';

const KAKAO_APP_KEY = '15b6d60e4095cdc453d99c4883ad6e6d'; 

export default function RouteResultScreen() {
    const location = useLocation();
    // 🚨🚨🚨 pathPoints를 여기서 받아옵니다!
    const { routeData, searchData, pathPoints } = location.state || {};
    
    if (!routeData) return <div className="p-10 text-center">데이터 없음</div>;

    const { safety, shortest } = routeData;
    
    // 🚨 지도에 그릴 경로: 전달받은 pathPoints가 있으면 쓰고, 없으면 기본값 사용
    const mapPath = pathPoints && pathPoints.length > 0 ? pathPoints : [
        { lat: 37.5668, lng: 126.9790 }, 
        { lat: 37.5670, lng: 126.9792 }, 
        { lat: 37.5672, lng: 126.9794 }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative font-sans">
            
            {/* 지도 영역 */}
            <div className="w-full h-[45vh] relative z-0">
                <Map
                    center={mapPath[0]} // 🚨 출발지 좌표를 중심으로 지도 시작
                    style={{ width: "100%", height: "100%" }}
                    level={4} // 조금 더 넓게 보기
                    appkey={KAKAO_APP_KEY}
                >
                    {/* 출발/도착 마커 */}
                    <MapMarker position={mapPath[0]} />
                    <MapMarker position={mapPath[mapPath.length - 1]} />

                    {/* 경로 선 */}
                    <Polyline
                        path={[mapPath]}
                        strokeWeight={5}
                        strokeColor={"#3b82f6"}
                        strokeOpacity={0.8}
                        strokeStyle={"solid"}
                    />
                </Map>

                <Link to="/route/search" className="absolute top-4 left-4 z-10 bg-white p-2 rounded-full shadow-lg text-gray-700 hover:bg-gray-50">
                    <Navigation className="w-6 h-6 transform rotate-180" />
                </Link>
            </div>

            {/* 결과 정보 영역 */}
            <div className="flex-grow bg-white rounded-t-3xl -mt-6 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-6 flex flex-col">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">경로 분석 완료</h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                        <span className="font-medium">{searchData.start}</span> 
                        <span className="mx-2 text-gray-300">➔</span> 
                        <span className="font-medium">{searchData.end}</span>
                    </p>
                </div>

                {/* 안전 경로 카드 */}
                <div className="bg-green-50 border border-green-100 p-5 rounded-2xl mb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded-bl-xl font-bold">RECOMMENDED</div>
                    <div className="flex items-center mb-3 text-green-700 font-bold">
                        <Shield className="w-5 h-5 mr-2" /> 안전 경로
                    </div>
                    <div className="flex items-end mb-4">
                        <span className="text-5xl font-extrabold text-green-600">{safety.score}</span>
                        <span className="text-gray-500 ml-1 mb-1 font-medium">점</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                            <Camera className="w-4 h-4 text-blue-500" />
                            <span>CCTV <strong className="text-blue-600">{safety.cctv}개</strong></span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            <span>가로등 <strong className="text-yellow-600">{safety.lights}개</strong></span>
                        </div>
                    </div>
                </div>

                {/* 최단 경로 정보 */}
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 font-medium">최단 경로 (비교)</p>
                        <p className="text-gray-800 font-bold mt-1">12분 / 1.8km</p>
                    </div>
                    <div className="text-xl font-bold text-yellow-500">72점</div>
                </div>

                <div className="mt-auto pt-6">
                    <Link to="/" className="block w-full bg-gray-900 text-white text-center py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}