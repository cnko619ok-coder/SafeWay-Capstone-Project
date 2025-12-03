import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowUpRight, Users, AlertTriangle, Map } from 'lucide-react';
// Map 아이콘을 MapIcon으로 별칭을 주어 이름 충돌 방지
const MapIcon = Map; 


// NOTE: userUid prop을 받도록 설정되어 있지만, 현재 화면은 UI만 구현합니다.
export default function MainScreen({ userUid }) { 
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            
            {/* Header: App Title and Shield Icon */}
            <header className="bg-white p-4 border-b flex items-center justify-between shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Shield className="w-6 h-6 text-blue-500 mr-2" />
                    SafeWay
                </h1>
                <p className="text-gray-500 text-sm">안전한 귀가를 함께합니다</p>
            </header>

            <main className="flex-grow p-4 space-y-6">
                
                {/* 1. 안전 귀가 기록 요약 */}
                <section className="flex space-x-4">
                    <div className="flex-1 bg-blue-600 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                        <div className="text-4xl font-extrabold">24회</div>
                        <p className="text-sm opacity-90 mt-2">안전 귀가</p>
                    </div>
                    <div className="flex-1 bg-cyan-500 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                        <div className="text-4xl font-extrabold">12회</div>
                        <p className="text-sm opacity-90 mt-2">이번 달</p>
                    </div>
                </section>
                
                {/* 2. 빠른 실행 버튼 */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">빠른 실행</h2>
                    <div className="grid grid-cols-3 gap-4">
                        
                        {/* 🚨 경로 검색 링크 */}
                        <Link to="/route/search" className="bg-white p-5 rounded-xl shadow-md border hover:bg-gray-100 transition-colors flex flex-col items-center justify-center">
                            {/* MapIcon 사용 */}
                            <MapIcon className="w-8 h-8 text-green-500 mb-2" /> 
                            <p className="font-semibold text-gray-800">경로 검색</p>
                            <p className="text-xs text-gray-500">안전 경로 찾기</p>
                        </Link>
                        
                        {/* 긴급 연락처 관리 */}
                        <Link to="/contacts" className="bg-white p-5 rounded-xl shadow-md border hover:bg-gray-100 transition-colors flex flex-col items-center justify-center">
                            <Users className="w-8 h-8 text-blue-500 mb-2" />
                            <p className="font-semibold text-gray-800">긴급 연락처</p>
                            <p className="text-xs text-gray-500">보호자 관리</p>
                        </Link>
                        
                        {/* 위험 지역 알림 */}
                        <Link to="/report-board" className="bg-white p-5 rounded-xl shadow-md border hover:bg-gray-100 transition-colors flex flex-col items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-orange-500 mb-2" />
                            <p className="font-semibold text-gray-800">위험 지역</p>
                            <p className="text-xs text-gray-500">실시간 알림</p>
                        </Link>
                    </div>
                </section>
                
                {/* 3. 안전 수칙 */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">안전 수칙</h2>
                    <ul className="bg-white p-4 rounded-xl shadow-md space-y-2 text-sm text-gray-700">
                        <li>• 밝은 곳으로 이동하고 어두운 골목은 피하세요.</li>
                        <li>• 이어폰 사용을 자제하고 주변을 살피세요.</li>
                        <li>• 위험을 느끼면 즉시 SOS 버튼을 눌러주세요.</li>
                    </ul>
                </section>
                
            </main>

            {/* 임시 하단 탭 바 (MainScreen에서는 제외) */}
            
        </div>
    );
}