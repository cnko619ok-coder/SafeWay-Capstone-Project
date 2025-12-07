// frontend/src/RouteResultScreen.js

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Shield, Clock, MapPin, Navigation, Camera, Lightbulb, ChevronLeft } from 'lucide-react';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';

export default function RouteResultScreen() {
    const location = useLocation();
    const { routeData, searchData, pathPoints } = location.state || {};
    const [map, setMap] = useState(null); // 지도 객체 상태

    // 데이터가 없을 때 예외 처리
    if (!routeData) {
        return <div className="p-10 text-center">데이터가 없습니다. <Link to="/" className="text-blue-500">홈으로</Link></div>;
    }

    const { safety, shortest } = routeData;
    
    // 지도에 그릴 경로 (전달받은 좌표 사용)
    const mapPath = pathPoints && pathPoints.length > 0 ? pathPoints : [
        { lat: 37.5668, lng: 126.9790 }, { lat: 37.5672, lng: 126.9794 }
    ];

    // 🚨 [핵심 기능] 지도가 로드되면 경로가 다 보이도록 자동 줌인/아웃 (Bounds 설정)
    useEffect(() => {
        if (map && mapPath.length > 0) {
            const bounds = new window.kakao.maps.LatLngBounds();
            mapPath.forEach(point => bounds.extend(new window.kakao.maps.LatLng(point.lat, point.lng)));
            map.setBounds(bounds); // 지도 범위 재설정
        }
    }, [map, mapPath]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative font-sans">
            
            {/* 1. 지도 영역 (화면 상단 45%) */}
            <div className="w-full h-[45vh] relative z-0">
                <Map
                    center={mapPath[0]} 
                    style={{ width: "100%", height: "100%" }}
                    level={3}
                    onCreate={setMap} // 지도 객체 저장
                    // App.js에서 로드하므로 여기선 appkey 생략 가능하지만 안전을 위해 유지해도 됨
                >
                    {/* 출발지 (파란색 마커 이미지 적용 가능) */}
                    <MapMarker position={mapPath[0]} title="출발" />
                    
                    {/* 도착지 (빨간색 마커 이미지 적용 가능) */}
                    <MapMarker position={mapPath[mapPath.length - 1]} title="도착" />

                    {/* 경로 선 (파란색 실선) */}
                    <Polyline
                        path={[mapPath]}
                        strokeWeight={6}
                        strokeColor={"#3b82f6"}
                        strokeOpacity={0.9}
                        strokeStyle={"solid"}
                    />
                </Map>

                {/* 상단 뒤로가기 버튼 */}
                <Link to="/route/search" className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md text-gray-700 hover:bg-white transition-all">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
            </div>

            {/* 2. 결과 카드 영역 (화면 하단, 위로 살짝 겹치게) */}
            <div className="flex-grow bg-gray-50 rounded-t-3xl -mt-6 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] p-6 flex flex-col overflow-y-auto">
                
                {/* 드래그 핸들바 */}
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 opacity-50"></div>

                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">경로 비교</h2>
                        <p className="text-sm text-gray-500 mt-1 flex items-center">
                            {searchData.start} <span className="mx-2 text-gray-300">➔</span> {searchData.end}
                        </p>
                    </div>
                </div>

                {/* [메인] 안전 경로 카드 (초록색 테마) */}
                <div className="bg-white border-2 border-green-500 p-5 rounded-2xl mb-4 shadow-lg relative overflow-hidden transform transition-all hover:scale-[1.01]">
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1.5 rounded-bl-xl font-bold z-10">
                        추천 경로
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-green-700 font-bold text-lg">
                            <Shield className="w-6 h-6 mr-2 fill-green-100" /> 
                            안전 경로
                        </div>
                        <div className="text-right">
                            <span className="block text-3xl font-extrabold text-green-600 leading-none">{safety.score}</span>
                            <span className="text-xs text-green-600 font-medium">안전 점수</span>
                        </div>
                    </div>

                    {/* 상세 정보 그리드 */}
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <div className="bg-green-50 p-3 rounded-xl flex flex-col justify-center">
                            <span className="text-xs text-gray-500 mb-1">소요 시간</span>
                            <div className="flex items-center font-bold text-gray-800">
                                <Clock className="w-4 h-4 mr-1.5 text-green-600" /> {safety.time}
                            </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-xl flex flex-col justify-center">
                            <span className="text-xs text-gray-500 mb-1">총 거리</span>
                            <div className="flex items-center font-bold text-gray-800">
                                <MapPin className="w-4 h-4 mr-1.5 text-green-600" /> {safety.distance}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3 text-sm">
                        <div className="flex items-center text-gray-600">
                            <Camera className="w-4 h-4 mr-1 text-blue-500" /> CCTV <strong className="ml-1 text-gray-800">{safety.cctv}</strong>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <Lightbulb className="w-4 h-4 mr-1 text-yellow-500" /> 가로등 <strong className="ml-1 text-gray-800">{safety.lights}</strong>
                        </div>
                    </div>
                    
                    {/* 안내 시작 버튼 */}
                    <button className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-green-700 transition-colors flex items-center justify-center">
                        <Navigation className="w-5 h-5 mr-2" /> 안전 경로 안내 시작
                    </button>
                </div>

                {/* [비교] 최단 경로 카드 (회색 테마) */}
                <div className="bg-white border border-gray-200 p-5 rounded-2xl opacity-90 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center text-gray-700 font-bold">
                            최단 경로
                        </div>
                        <div className="flex items-baseline">
                             <span className="text-2xl font-bold text-yellow-500">{shortest.score}</span>
                             <span className="text-xs text-gray-400 ml-1">점</span>
                        </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                         <span>{shortest.time} / {shortest.distance}</span>
                         <span>CCTV {shortest.cctv}개</span>
                    </div>
                </div>
            </div>
        </div>
    );
}