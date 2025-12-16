import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Clock, MapPin, Navigation, Camera, Lightbulb, ChevronLeft, AlertTriangle, Scale } from 'lucide-react';
import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';
import { API_BASE_URL } from './config';

const KAKAO_APP_KEY = 'e8757f3638207e014bcea23f202b11d8'; 


export default function RouteResultScreen({ userUid }) {
    const location = useLocation();
    const navigate = useNavigate();
    
    // 데이터 가져오기
    const { routeData, searchData, pathPoints } = location.state || {};
    const [map, setMap] = useState(null);
    const [isSheetOpen, setIsSheetOpen] = useState(true);

    // 백엔드에서 받아온 진짜 경로(path)를 그대로 사용합니다.
    const { safety, shortest, balanced } = routeData;

    // 초기 경로 데이터 설정 (백엔드 데이터가 없을 때 대비)
    const safePath = routeData?.safety?.path || [];
    const shortestPath = routeData?.shortest?.path || [];
    const balancedPath = routeData?.balanced?.path || [];

    // 지도 자동 줌 및 위치 보정
    useEffect(() => {
        if (map && (safePath.length > 0 || shortestPath.length > 0 || balancedPath.length > 0)) {
            const bounds = new window.kakao.maps.LatLngBounds();
            
            // 모든 경로의 좌표를 범위에 포함시킵니다.
            const addPathToBounds = (path) => {
                path?.forEach(p => bounds.extend(new window.kakao.maps.LatLng(p.lat, p.lng)));
            };

            addPathToBounds(safePath);
            addPathToBounds(shortestPath);
            addPathToBounds(balancedPath);

           
            map.setBounds(bounds, 80, 50, 200, 50); 
        }
    }, [map, safePath, shortestPath, balancedPath]);

    // 4. 데이터 없음 예외 처리
    if (!routeData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <p className="text-gray-600 mb-4">데이터가 없습니다.</p>
                <Link to="/" className="text-blue-500 font-bold underline">홈으로 돌아가기</Link>
            </div>
        );
    }

   // 선택한 경로의 '좌표'를 넘겨주는 함수
    const handleStartNavigation = async (type) => {
        // 1. 선택한 타입에 맞는 데이터와 경로를 찾음
        let selectedRoute, selectedPath, typeName;

        if (type === 'safety') {
            selectedRoute = safety;
            selectedPath = safePath; // 🟢 안전 경로 좌표
            typeName = '안전 경로';
        } else if (type === 'shortest') {
            selectedRoute = shortest;
            selectedPath = shortestPath; // 🟠 최단 경로 좌표
            typeName = '최단 경로';
        } else {
            selectedRoute = balanced;
            selectedPath = balancedPath; // 🟡 균형 경로 좌표
            typeName = '균형 경로';
        }

        if (window.confirm(`${typeName}로 안내를 시작하시겠습니까?`)) {
            // DB에 기록 저장
            if (userUid) {
                try {
                    await axios.post(`${API_BASE_URL}/api/history`, {
                        uid: userUid, 
                        start: searchData.start, end: searchData.end,
                        score: selectedRoute.score, distance: selectedRoute.distance, time: selectedRoute.time,
                        date: new Date().toLocaleDateString()
                    });
                } catch (e) { console.error(e); }
            }
            
            // 다음 화면으로 '선택된 경로(selectedPath)'를 보냄
            navigate('/navigation', { 
                state: { 
                    path: selectedPath, // 진짜 경로
                    routeInfo: selectedRoute, // 시간, 거리 정보
                    searchData: searchData    // 출발지, 도착지 이름
                } 
            });
        }
    };

    // 그래프 계산용
    const parseNum = (str) => parseFloat(str?.replace(/[^0-9.]/g, '')) || 0;
    const maxDist = Math.max(parseNum(safety.distance), parseNum(shortest.distance), parseNum(balanced.distance));
    const maxTime = Math.max(parseNum(safety.time), parseNum(shortest.time), parseNum(balanced.time));

    return (
        <div className="h-screen w-full relative overflow-hidden bg-gray-100 font-sans">
            
            {/* 1. 배경 지도 (전체 화면) */}
            <div className="absolute inset-0 z-0">
                <Map center={safePath[0]|| {lat: 37.5665, lng: 126.9780}} style={{ width: "100%", height: "100%" }} level={2} appkey={KAKAO_APP_KEY} onCreate={setMap}>
                   <MapMarker position={safePath[0]} image={{src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_b.png", size: {width: 40, height: 45}}}/>
                   <MapMarker position={safePath[safePath.length-1]} image={{src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_b.png", size: {width: 40, height: 45}}}/>
                   
                   {/* 🟢 안전 경로 (초록색 실선 - 가장 위) */}
                   <Polyline path={[safePath]} strokeWeight={8} strokeColor={"#10b981"} strokeOpacity={1} strokeStyle={"solid"} />
                   
                   {/* 🟠 최단 경로 (주황색 점선) */}
                   <Polyline path={[shortestPath]} strokeWeight={5} strokeColor={"#f59e0b"} strokeOpacity={0.7} strokeStyle={"shortdash"} />
                   
                   {/* 🟡 균형 경로 (노란색 점선) */}
                   <Polyline path={[balancedPath]} strokeWeight={5} strokeColor={"#eab308"} strokeOpacity={0.7} strokeStyle={"shortdot"} />
                   </Map>
            </div>

            {/* 경로 범례 */}
            <div className="absolute top-16 right-4 bg-white/95 backdrop-blur p-3 rounded-xl shadow-lg z-10 text-xs font-bold text-gray-700 space-y-2 border border-gray-100">
                <div className="flex items-center"><div className="w-8 h-1.5 bg-[#10b981] rounded mr-2"></div>안전 경로</div>
                <div className="flex items-center"><div className="w-8 h-1.5 bg-[#f59e0b] rounded mr-2 border-b-2 border-white border-dashed"></div>최단 경로</div>
                <div className="flex items-center"><div className="w-8 h-1.5 bg-[#eab308] rounded mr-2 border-b-2 border-white border-dotted"></div>균형 경로</div>
            </div>

            {/* 뒤로가기 버튼 */}
            <Link to="/route/search" className="absolute top-4 left-4 z-10 bg-white/90 p-3 rounded-full shadow-lg text-gray-700 hover:bg-white transition-all active:scale-95">
                <ChevronLeft className="w-6 h-6" />
            </Link>

            {/* 2. 슬라이딩 바텀 시트 (정보 창) */}
            <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-20 transition-all duration-500 ease-in-out flex flex-col ${isSheetOpen ? 'h-[85vh]' : 'h-[18vh]'}`}>
                
                {/* 핸들바 & 요약 정보 */}
                <div onClick={() => setIsSheetOpen(!isSheetOpen)} className="cursor-pointer bg-white rounded-t-[2rem]">
                    <div className="w-full flex justify-center pt-3 pb-1"><div className="w-12 h-1.5 bg-gray-300 rounded-full mb-1"></div></div>
                    <div className="px-6 pb-4 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">경로 비교</h2>
                            <p className="text-sm text-gray-500 mt-1 flex items-center"><span className="truncate max-w-[100px]">{searchData.start}</span><span className="mx-2 text-gray-300">➔</span><span className="truncate max-w-[100px]">{searchData.end}</span></p>
                        </div>
                        <button className="text-sm text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg">{isSheetOpen ? '지도 보기' : '목록 보기'}</button>
                    </div>
                </div>

                {/* 상세 내용 (스크롤) */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 font-sans">
                    
                    {/* 그래프 비교 */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center"><MapPin className="w-4 h-4 mr-2 text-blue-500"/> 거리 비교</h3>
                        <BarChart label="안전" value={safety.distance} max={maxDist} color="bg-green-500" />
                        <BarChart label="최단" value={shortest.distance} max={maxDist} color="bg-orange-400" />
                        <BarChart label="균형" value={balanced.distance} max={maxDist} color="bg-yellow-400" />

                        <div className="border-t border-gray-100 my-5"></div>

                        <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Clock className="w-4 h-4 mr-2 text-purple-500"/> 소요 시간 비교</h3>
                        <BarChart label="안전" value={safety.time} max={maxTime} color="bg-green-500" />
                        <BarChart label="최단" value={shortest.time} max={maxTime} color="bg-orange-400" />
                        <BarChart label="균형" value={balanced.time} max={maxTime} color="bg-yellow-400" />
                    </div>

                    {/* 점수 비교 카드 */}
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-30 transform rotate-12 scale-150"></div>
                        
                        <div className="flex items-center mb-5 relative z-10 opacity-90">
                            <Shield className="w-5 h-5 mr-2 text-white"/>
                            <span className="text-xl font-bold text-white tracking-wide">
                                안전 점수 비교
                            </span>
                        </div>

                        <div className="flex justify-around items-center relative z-10 mt-2">
                            <div className="text-center">
                                <span className="block text-5xl font-extrabold mb-1 drop-shadow-md">{safety.score}</span>
                                <div className="text-sm font-medium opacity-90 bg-white/20 px-3 py-1 rounded-full inline-block">안전 경로</div>
                            </div>
                            <div className="h-12 w-[1px] bg-white/30 rounded-full"></div>
                            <div className="text-center opacity-90">
                                <span className="block text-4xl font-bold mb-1">{shortest.score}</span>
                                <div className="text-sm font-medium opacity-80 text-blue-100">최단 경로</div>
                            </div>
                        </div>
                    </div>

                    {/* 상세 비교표 */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6 space-y-2">
                        <h3 className="font-bold text-gray-800 flex items-center mb-4"><Shield className="w-4 h-4 mr-2"/> 상세 비교</h3>
                        
                        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-gray-500 bg-gray-50 p-2 rounded-xl mb-2">
                            <div>항목</div><div className="text-green-600">안전</div><div className="text-orange-500">최단</div><div className="text-yellow-500">균형</div>
                        </div>
                        
                        {/* 아이콘 옆에 텍스트가 항상 나오도록 */}
                        <ComparisonRow label="CCTV" icon={Camera} color="text-blue-500" v1={safety.cctv} v2={shortest.cctv} v3={balanced.cctv} />
                        <div className="border-t border-gray-50 my-2"></div>
                        <ComparisonRow label="가로등" icon={Lightbulb} color="text-yellow-500" v1={safety.lights} v2={shortest.lights} v3={balanced.lights} />
                        <div className="border-t border-gray-50 my-2"></div>
                        <ComparisonRow label="위험신고" icon={AlertTriangle} color="text-red-500" v1={`${safety.reports || 0}건`} v2={`${shortest.reports || 0}건`} v3={`${balanced.reports || 0}건`} isDanger={true} /></div>

                    {/* 안내 시작 버튼들 */}
                    <div className="space-y-3 mb-10">
                        <button onClick={() => handleStartNavigation('safety')} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-md hover:bg-green-700 transition flex items-center justify-center active:scale-95">
                            <Navigation className="w-5 h-5 mr-2" /> 안전 경로 안내 시작
                        </button>
                        <div className="flex gap-3">
                            <button onClick={() => handleStartNavigation('shortest')} className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-3.5 rounded-2xl font-bold hover:bg-gray-50 transition active:scale-95">최단 경로</button>
                            <button onClick={() => handleStartNavigation('balanced')} className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-3.5 rounded-2xl font-bold hover:bg-gray-50 transition active:scale-95">균형 경로</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 막대 그래프 
function BarChart({ label, value, max, color }) {
    const num = parseFloat(value?.replace(/[^0-9.]/g, '')) || 0;
    const width = max > 0 ? `${Math.max(15, (num / max) * 100)}%` : '15%';
    return (
        <div className="flex items-center mb-3 text-sm group">
            <span className="w-12 text-gray-500 font-medium text-xs">{label}</span>
            <div className="flex-1 mx-3 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width }}></div>
            </div>
            <span className="w-16 text-right font-bold text-gray-700 text-xs">{value}</span>
        </div>
    );
}

// 상세 비교 행 컴포넌트 
function ComparisonRow({ label, icon: Icon, color, v1, v2, v3, isDanger }) {
    return (
        <div className="grid grid-cols-4 gap-2 text-center items-center py-2">
            <div className={`flex items-center justify-center text-xs ${color} font-bold`}>
                <Icon className="w-3.5 h-3.5 mr-1" /> {label}
            </div>
            <div className={`text-sm font-bold ${isDanger && v1 !== '0건' ? 'text-red-600' : 'text-gray-800'}`}>{v1}</div>
            <div className="text-sm text-gray-600">{v2}</div>
            <div className="text-sm text-gray-600">{v3}</div>
        </div>
    );
}