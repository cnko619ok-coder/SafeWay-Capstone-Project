// frontend/src/RouteResultScreen.js

import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Shield, Clock, MapPin, Navigation, Camera, Lightbulb } from 'lucide-react';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk'; // 🚨 지도 라이브러리 추가

// 🚨 JavaScript 키 (MapComponent와 동일)
const KAKAO_APP_KEY = '15b6d60e4095cdc453d99c4883ad6e6d'; 

export default function RouteResultScreen() {
    const location = useLocation();
    const { routeData, searchData } = location.state || {};
    
    // 1. 데이터가 없을 때 예외 처리
    if (!routeData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <p className="text-gray-600 mb-4">경로 데이터가 없습니다.</p>
                <Link to="/" className="text-blue-600 font-bold underline">홈으로 돌아가기</Link>
            </div>
        );
    }

    const { safety, shortest } = routeData;
    
    // 2. 지도에 그릴 경로 좌표 (현재는 가상 경로 사용)
    // 실제로는 백엔드에서 받은 경로 데이터를 사용해야 하지만, 시각화를 위해 고정된 좌표를 사용합니다.
    const pathCoordinates = [
        { lat: 37.5668, lng: 126.9790 }, // 출발
        { lat: 37.5670, lng: 126.9792 }, // 중간
        { lat: 37.5672, lng: 126.9794 }, // 도착
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            
            {/* 🚨 3. 지도 영역 (화면 상단 45% 차지) */}
            <div className="w-full h-[45vh] relative z-0">
                <Map
                    center={pathCoordinates[0]} // 출발지를 중심으로
                    style={{ width: "100%", height: "100%" }}
                    level={3}
                    appkey={KAKAO_APP_KEY}
                >
                    {/* 출발지 마커 */}
                    <MapMarker position={pathCoordinates[0]} />
                    
                    {/* 도착지 마커 */}
                    <MapMarker position={pathCoordinates[pathCoordinates.length - 1]} />

                    {/* 경로 선 그리기 (파란색) */}
                    <Polyline
                        path={[pathCoordinates]}
                        strokeWeight={5}
                        strokeColor={"#3b82f6"}
                        strokeOpacity={0.8}
                        strokeStyle={"solid"}
                    />
                </Map>

                {/* 뒤로가기 버튼 (지도 위에 띄움) */}
                <Link to="/route/search" className="absolute top-4 left-4 z-10 bg-white p-2 rounded-full shadow-lg text-gray-700">
                    <Navigation className="w-6 h-6 transform rotate-180" />
                </Link>
            </div>

            {/* 4. 결과 정보 영역 (화면 하단, 둥근 모서리 디자인) */}
            <div className="flex-grow bg-white rounded-t-3xl -mt-6 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-6 flex flex-col">
                
                {/* 핸들바 장식 */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">경로 분석 완료</h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                        {searchData.start} <span className="mx-2">➔</span> {searchData.end}
                    </p>
                </div>

                {/* 안전 경로 카드 (메인) */}
                <div className="bg-green-50 border border-green-100 p-5 rounded-2xl mb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded-bl-xl font-bold">
                        추천
                    </div>
                    <div className="flex items-center mb-3 text-green-700 font-bold">
                        <Shield className="w-5 h-5 mr-2" /> 안전 경로
                    </div>
                    <div className="flex items-end mb-4">
                        <span className="text-5xl font-extrabold text-green-600">{safety.score}</span>
                        <span className="text-gray-500 ml-1 mb-1 font-medium">점</span>
                    </div>
                    
                    {/* 데이터 표시 */}
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
                            <Camera className="w-4 h-4 text-blue-500" />
                            <span>CCTV <strong className="text-blue-600">{safety.cctv}개</strong></span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            <span>가로등 <strong className="text-yellow-600">{safety.lights}개</strong></span>
                        </div>
                    </div>
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