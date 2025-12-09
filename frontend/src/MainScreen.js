// frontend/src/MainScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios'; // 🚨 통신 모듈 추가
import { Link } from 'react-router-dom';
import { Shield, Users, AlertTriangle, Map as MapIcon, Home, User, FileText } from 'lucide-react';

const MapIconComponent = MapIcon; 

// 🚨 ngrok 주소 확인 (바뀌었다면 수정 필수!)
const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

export default function MainScreen({ userUid }) { 
    // 1. 사용자 정보를 저장할 상태 변수 (초기값은 0)
    const [stats, setStats] = useState({
        safeReturnCount: 0,
        reportCount: 0
    });

    // 2. 서버에서 내 정보 불러오기
    useEffect(() => {
        const fetchUserData = async () => {
            if (!userUid) return;
            try {
                // 프로필 화면과 똑같은 API를 사용하여 데이터를 가져옵니다.
                const response = await axios.get(`${API_BASE_URL}/api/users/${userUid}`);
                const data = response.data;
                
                // 가져온 데이터로 상태 업데이트
                setStats({
                    safeReturnCount: data.stats?.safeReturnCount || 0, // 안전 귀가 횟수
                    reportCount: data.stats?.reportCount || 0          // 신고 횟수
                });
            } catch (error) {
                console.error("데이터 로드 실패:", error);
            }
        };
        fetchUserData();
    }, [userUid]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            
            <header className="bg-white p-4 border-b flex items-center justify-between shadow-sm sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Shield className="w-6 h-6 text-blue-500 mr-2" /> SafeWay
                </h1>
                <p className="text-gray-500 text-sm">안전한 귀가를 함께합니다</p>
            </header>

            <main className="flex-grow p-4 space-y-6 pb-24"> 
                {/* 1. 안전 귀가 기록 요약 (실제 데이터 연동) */}
                <section className="flex space-x-4">
                    <div className="flex-1 bg-blue-600 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                        {/* 🚨 실제 안전 귀가 횟수 표시 */}
                        <div className="text-4xl font-extrabold">{stats.safeReturnCount}회</div>
                        <p className="text-sm opacity-90 mt-2">총 안전 귀가</p>
                    </div>
                    <div className="flex-1 bg-cyan-500 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                        {/* 🚨 실제 신고 횟수 표시 (이번 달 대신 신고 횟수로 변경하여 데이터 활용) */}
                        <div className="text-4xl font-extrabold">{stats.reportCount}건</div>
                        <p className="text-sm opacity-90 mt-2">나의 신고</p>
                    </div>
                </section>
                
                {/* 2. 빠른 실행 버튼 */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">빠른 실행</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/route/search" className="bg-white p-5 rounded-xl shadow-md border hover:bg-gray-100 transition-colors flex flex-col items-center justify-center">
                            <MapIconComponent className="w-8 h-8 text-green-500 mb-2" /> 
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

            {/* 🚨 SOS 플로팅 버튼 */}
            <Link to="/sos" className="fixed bottom-24 right-4 bg-red-500 text-white p-4 rounded-full shadow-lg shadow-red-300 hover:bg-red-600 hover:scale-105 transition-all z-40 flex items-center justify-center border-4 border-white animate-pulse">
                <span className="font-black text-xs">SOS</span>
            </Link>

            {/* 하단 탭 바 (App.js의 BottomNavigation으로 대체되므로 여기선 삭제하거나 비워둠) */}
        </div>
    );
}