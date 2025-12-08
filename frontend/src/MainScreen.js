// frontend/src/MainScreen.js

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// 아이콘들 불러오기
import { Shield, Users, AlertTriangle, Map as MapIcon, Home, User, FileText } from 'lucide-react';

export default function MainScreen({ userUid }) { 
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            
            {/* 상단 헤더 */}
            <header className="bg-white p-4 border-b flex items-center justify-between shadow-sm sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Shield className="w-6 h-6 text-blue-500 mr-2" /> SafeWay
                </h1>
                <p className="text-gray-500 text-sm">안전한 귀가를 함께합니다</p>
            </header>

            <main className="flex-grow p-4 space-y-6 pb-24"> 
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
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/route/search" className="bg-white p-5 rounded-xl shadow-md border hover:bg-gray-100 transition-colors flex flex-col items-center justify-center">
                            <MapIcon className="w-8 h-8 text-green-500 mb-2" /> 
                            <p className="font-semibold text-gray-800">경로 검색</p>
                        </Link>
                        <Link to="/contacts" className="bg-white p-5 rounded-xl shadow-md border hover:bg-gray-100 transition-colors flex flex-col items-center justify-center">
                            <Users className="w-8 h-8 text-blue-500 mb-2" />
                            <p className="font-semibold text-gray-800">긴급 연락처</p>
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

            {/* 🚨🚨🚨 플로팅 SOS 버튼 추가 🚨🚨🚨 */}
            <Link to="/sos" className="fixed bottom-20 right-4 bg-red-500 text-white p-4 rounded-full shadow-lg shadow-red-300 hover:bg-red-600 hover:scale-105 transition-all z-40 flex items-center justify-center border-4 border-white animate-pulse">
                <span className="font-black text-xs">SOS</span>
            </Link>

            
        </div>
    );
}