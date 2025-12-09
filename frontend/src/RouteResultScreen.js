// frontend/src/RouteResultScreen.js

import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Clock, MapPin, Navigation, Camera, Lightbulb, ChevronLeft, AlertTriangle } from 'lucide-react';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';

const KAKAO_APP_KEY = '15b6d60e4095cdc453d99c4883ad6e6d'; 
const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev';

export default function RouteResultScreen({ userUid }) {
    const location = useLocation();
    const navigate = useNavigate();

    // 🚨 이전 화면에서 넘겨준 pathPoints를 받습니다.
    const { routeData, searchData, pathPoints } = location.state || {};
    const [map, setMap] = useState(null); 

    // 지도가 로드되면 경로가 꽉 차게 보이도록 자동 줌인/줌아웃
    useEffect(() => {
        if (map && safePath.length > 0) {
            const bounds = new window.kakao.maps.LatLngBounds();
            safePath.forEach(p => bounds.extend(new window.kakao.maps.LatLng(p.lat, p.lng)));
            shortestPath.forEach(p => bounds.extend(new window.kakao.maps.LatLng(p.lat, p.lng)));
            map.setBounds(bounds, 80); 
        }
    }, [map, safePath]);


     const { safety, shortest } = routeData;

     // 1. 안전 경로 (실제 계산된 경로)
    const safePath = pathPoints && pathPoints.length > 0 ? pathPoints : [
        { lat: 37.5668, lng: 126.9790 }, { lat: 37.5672, lng: 126.9794 }
    ];

    // 2. 최단 경로 (비교용 가상 경로 - 약간 옆으로 치우치게 생성)
    const shortestPath = safePath.map(p => ({
        lat: p.lat - 0.0005, // 살짝 아래로 이동
        lng: p.lng + 0.0005  // 살짝 오른쪽으로 이동
    }));

    if (!routeData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <p className="text-gray-600 mb-4">경로 데이터가 없습니다.</p>
                <Link to="/" className="text-blue-600 font-bold underline">홈으로 돌아가기</Link>
            </div>
        );
    }

    
    // 🚨🚨🚨 [기능 추가] 안내 시작 시 기록 저장 함수
    const handleStartNavigation = async (type) => {
        if (!userUid) return alert("로그인 정보가 없습니다.");

        const selectedRoute = type === 'safe' ? safety : shortest;
        const typeName = type === 'safe' ? '안전 경로' : '최단 경로';

        if (window.confirm(`${typeName}로 안내를 시작하시겠습니까?\n(귀가 기록에 저장됩니다)`)) {
            if (userUid) {
                try {
                    await axios.post(`${API_BASE_URL}/api/history`, {
                        uid: userUid,
                        start: searchData.start,
                        end: searchData.end,
                        score: selectedRoute.score,
                        distance: selectedRoute.distance,
                        time: selectedRoute.time,
                        date: new Date().toLocaleDateString()
                    });

                    alert("✅ 안전 귀가 기록이 저장되었습니다!\n(실제 주행 모드는 생략하고 홈으로 이동합니다)");
                
               } catch (error) {
                   console.error(error);
                   alert("기록 저장 실패 (서버 오류)");}
            }    
            alert(`${typeName} 안내를 시작합니다.`);
            navigate('/');
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative font-sans">
            
            {/* 1. 지도 영역 (화면 상단 35%) */}
            <div className="w-full h-[35vh] relative z-0">
                <Map
                    center={safePath[0]} 
                    style={{ width: "100%", height: "100%" }}
                    level={3}
                    appkey={KAKAO_APP_KEY}
                    onCreate={setMap} 
                >
                    {/* 출발지 (파란색 마커), 도착지 (빨간색 마커) */}
                    <MapMarker position={safePath[0]} title="출발" image={{src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_b.png", size: {width: 40, height: 40}}}/>
                    <MapMarker position={safePath[safePath.length-1]} title="도착" image={{src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_b.png", size: {width: 40, height: 40}}}/>

                    {/* 안전 경로 (초록색 점선) */}
                    <Polyline path={[safePath]} strokeWeight={6} strokeColor={"#10b981"} strokeOpacity={0.9} strokeStyle={"solid"} />
                    
                    {/* 최단 경로 (주황색 점선) */}
                    <Polyline path={[shortestPath]} strokeWeight={5} strokeColor={"#f59e0b"} strokeOpacity={0.7} strokeStyle={"shortdash"} />
                </Map>

                {/* 범례 (Legend) */}
                <div className="absolute bottom-4 right-4 z-10 flex space-x-2">
                    <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-green-600 shadow-sm border border-green-200 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div> 안전
                    </div>
                    <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-yellow-600 shadow-sm border border-yellow-200 flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1.5"></div> 최단
                    </div>
                </div>

                <Link to="/route/search" className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md text-gray-700 hover:bg-white transition-all">
                    <ChevronLeft className="w-6 h-6" />
                </Link>

                
            </div>

            {/* 2. 경로 비교 정보 영역 (하단) */}
            <div className="flex-grow bg-white rounded-t-3xl -mt-6 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] p-6 flex flex-col overflow-y-auto">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 opacity-50"></div>
                
                <h1 className="text-xl font-bold text-gray-800 mb-4">경로 비교</h1>

                {/* 🚨 점수 비교 카드 (파란색 그라데이션) */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-5 text-white shadow-lg mb-6 flex justify-around items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-30 transform rotate-12 scale-150"></div>
                    
                    <div className="text-center z-10">
                        <span className="text-4xl font-extrabold">{safety.score}</span>
                        <div className="text-xs font-medium opacity-90 mt-1 bg-white/20 px-2 py-0.5 rounded-full">안전 경로</div>
                    </div>
                    <div className="h-10 w-[1px] bg-white/30 z-10"></div>
                    <div className="text-center z-10 opacity-90">
                        <span className="text-3xl font-bold">{shortest.score}</span>
                        <div className="text-xs font-medium opacity-80 mt-1">최단 경로</div>
                    </div>
                </div>

                {/* 🚨 상세 비교 (CCTV, 가로등) */}
                <div className="space-y-4 mb-6">
                    <h3 className="font-bold text-gray-700 flex items-center"><Shield className="w-4 h-4 mr-1"/> 상세 비교</h3>
                    
                    {/* CCTV 비교 행 */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center text-gray-600 w-24">
                            <Camera className="w-4 h-4 mr-2 text-blue-500" /> CCTV
                        </div>
                        <div className="flex-1 flex justify-around items-center">
                            <span className="font-bold text-green-600">{safety.cctv}개</span>
                            <span className="text-gray-300">vs</span>
                            <span className="text-gray-500">{shortest.cctv}개</span>
                        </div>
                    </div>

                    {/* 가로등 비교 행 */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center text-gray-600 w-24">
                            <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" /> 가로등
                        </div>
                        <div className="flex-1 flex justify-around items-center">
                            <span className="font-bold text-green-600">{safety.lights}개</span>
                            <span className="text-gray-300">vs</span>
                            <span className="text-gray-500">{shortest.lights}개</span>
                        </div>
                    </div>
                </div>


                    {/* 안내 시작 버튼들 */}
                <div className="mt-auto space-y-3">
                    <button 
                        onClick={() => handleStartNavigation('safe')}
                        className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-green-700 transition flex items-center justify-center"
                    >
                        <Navigation className="w-5 h-5 mr-2" /> 안전 경로로 안내 시작 ({safety.time})
                    </button>
                    <button 
                        onClick={() => handleStartNavigation('shortest')}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center"
                    >
                        최단 경로로 안내 시작 ({shortest.time})
                    </button>
                </div>

                
                {/* 하단 홈으로 돌아가기 */}
                <div className="mt-auto pt-4">
                    <Link to="/" className="block w-full bg-gray-900 text-white text-center py-4 rounded-xl font-bold shadow-lg">
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}