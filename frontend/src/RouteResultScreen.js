import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function RouteResultScreen() {
    const location = useLocation();
    const { routeData, searchData } = location.state || {};
    
    if (!routeData) {
        return (
            <div className="p-8 text-center">
                <p>경로 데이터가 없습니다. <Link to="/" className="text-blue-500">홈으로 돌아가기</Link></p>
            </div>
        );
    }

    // 백엔드에서 받은 안전 점수
    const finalScore = routeData.safety.score;

    return (
        <div className="min-h-screen p-4 bg-white">
            <h1 className="text-2xl font-bold mb-4">경로 결과 확인</h1>
            <p className="text-gray-600 mb-6">출발: {searchData.start} / 도착: {searchData.end}</p>
            
            <div className="bg-green-100 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-green-700">안전 경로 추천 점수: {finalScore}점</h2>
                <p className="mt-2 text-green-600">이 점수를 기반으로 상세 경로를 선택할 수 있습니다.</p>
            </div>

            {/* 다음 단계에서 상세 비교 UI를 구현할 영역입니다. */}
            <div className="mt-8">
                <h3 className="font-semibold text-lg mb-3">경로 옵션</h3>
                <p>안전 경로: {routeData.safety.distance} / {routeData.safety.time} (CCTV: {routeData.safety.cctv}개)</p>
                <p>최단 경로: {routeData.shortest.distance} / {routeData.shortest.time} (CCTV: {routeData.shortest.cctv}개)</p>
            </div>
            
            <Link to="/" className="mt-8 block text-center text-blue-500">홈으로 돌아가기</Link>
        </div>
    );
}