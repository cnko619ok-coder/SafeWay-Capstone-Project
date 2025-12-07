// frontend/src/RouteResultScreen.js

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Shield, Clock, MapPin, Navigation, Camera, Lightbulb, ChevronLeft } from 'lucide-react';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';

const KAKAO_APP_KEY = '15b6d60e4095cdc453d99c4883ad6e6d'; 

export default function RouteResultScreen() {
    const location = useLocation();
    
    // 🚨🚨🚨 RouteSearchScreen에서 보낸 pathPoints를 여기서 받습니다.
    const { routeData, searchData, pathPoints } = location.state || {};
    const [map, setMap] = useState(null); // 지도 객체 상태 저장

    if (!routeData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <p className="text-gray-600 mb-4">경로 데이터가 없습니다.</p>
                <Link to="/" className="text-blue-600 font-bold underline">홈으로 돌아가기</Link>
            </div>
        );
    }

    const { safety, shortest } = routeData;
    
    // 🚨🚨🚨 지도에 그릴 경로: 전달받은 pathPoints가 있으면 쓰고, 없으면 기본값 사용
    const mapPath = pathPoints && pathPoints.length > 0 ? pathPoints : [
        { lat: 37.5668, lng: 126.9790 }, 
        { lat: 37.5670, lng: 126.9792 },
        { lat: 37.5672, lng: 126.9794 }
    ];

    // 🚨🚨🚨 [자동 줌] 지도가 로드되면 출발~도착지가 한눈에 보이도록 범위 재설정
    useEffect(() => {
        if (map && mapPath.length > 0) {
            const bounds = new window.kakao.maps.LatLngBounds();
            // 경로의 모든 좌표를 포함하도록 경계 확장
            mapPath.forEach(point => bounds.extend(new window.kakao.maps.LatLng(point.lat, point.lng)));
            // 지도 범위 재설정 (여백 50px)
            map.setBounds(bounds, 50); 
        }
    }, [map, mapPath]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative font-sans">
            
            {/* 1. 지도 영역 */}
            <div className="w-full h-[45vh] relative z-0">
                <Map
                    center={mapPath[0]} // 초기 중심은 출발지
                    style={{ width: "100%", height: "100%" }}
                    level={3}
                    appkey={KAKAO_APP_KEY}
                    onCreate={setMap} // 지도 생성 시 객체 저장 (자동 줌을 위해 필수)
                >
                    {/* 출발지 마커 */}
                    <MapMarker position={mapPath[0]} title="출발" />
                    
                    {/* 도착지 마커 */}
                    <MapMarker position={mapPath[mapPath.length - 1]} title="도착" />

                    {/* 경로 선 그리기 */}
                    <Polyline
                        path={[mapPath]}
                        strokeWeight={6}
                        strokeColor={"#3b82f6"} // 파란색
                        strokeOpacity={0.9}
                        strokeStyle={"solid"}
                    />
                </Map>

                {/* 뒤로가기 버튼 */}
                <Link to="/route/search" className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md text-gray-700 hover:bg-white transition-all">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
            </div>

            {/* 2. 결과 정보 영역 */}
            <div className="flex-grow bg-white rounded-t-3xl -mt-6 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] p-6 flex flex-col overflow-y-auto">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 opacity-50"></div>

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
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1.5 rounded-bl-xl font-bold z-10">
                        추천 경로
                    </div>
                    
                    <div className="flex items-center mb-3 text-green-700 font-bold text-lg">
                        <Shield className="w-6 h-6 mr-2 fill-green-100" /> 
                        안전 경로
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

                {/* 하단 버튼 */}
                <div className="mt-auto pt-4">
                    <Link to="/" className="block w-full bg-gray-900 text-white text-center py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}