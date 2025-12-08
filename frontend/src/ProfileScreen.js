// frontend/src/ProfileScreen.js

import React from 'react';
import { User, Settings, Bell, FileText, Clock, ChevronRight, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfileScreen({ userUid }) {
    const navigate = useNavigate();

    // 🚨 할당량 초과 시에도 화면을 보기 위한 임시 사용자 데이터
    const userInfo = {
        name: '추서연', // (로그인한 사용자 이름)
        email: 'cnko619ok@gmail.com',
        safeReturns: 24,
        reports: 3,
        usageTime: '8시간',
    };

    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            // 실제 로그아웃 로직 (App.js의 상태 변경은 여기서 처리 못하므로 새로고침으로 대체)
            window.location.href = '/login'; 
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* 상단 헤더 */}
            <header className="bg-white p-4 flex items-center justify-center relative shadow-sm">
                <h1 className="text-lg font-bold text-gray-800">프로필</h1>
                <button 
                    onClick={handleLogout}
                    className="absolute right-4 text-gray-500 hover:text-red-500 transition-colors"
                    title="로그아웃"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <main className="flex-grow p-5 space-y-6">
                {/* 1. 사용자 정보 카드 (그라데이션 배경) */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm border-2 border-white/30">
                            {userInfo.name[0]}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{userInfo.name}</h2>
                            <p className="text-sm text-blue-100 opacity-90">{userInfo.email}</p>
                        </div>
                    </div>
                    <button className="mt-6 w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium backdrop-blur-sm transition-colors">
                        프로필 수정
                    </button>
                </div>

                {/* 2. 활동 대시보드 */}
                <div className="grid grid-cols-3 gap-3">
                    <DashboardCard icon={<Shield className="w-5 h-5 text-blue-500" />} label="안전 귀가" value={`${userInfo.safeReturns}회`} />
                    <DashboardCard icon={<MapPinIcon />} label="신고 내역" value={`${userInfo.reports}건`} />
                    <DashboardCard icon={<Clock className="w-5 h-5 text-purple-500" />} label="총 이용시간" value={userInfo.usageTime} />
                </div>

                {/* 3. 메뉴 목록 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">내 활동</h3>
                    </div>
                    {/* 🚨 to 속성으로 이동할 경로 지정 */}
                    <MenuItem icon={<FileText className="w-5 h-5 text-gray-500" />} label="내 신고 내역 확인" to="/profile/reports" />
                    <div className="border-t border-gray-50"></div>
                    <MenuItem icon={<Clock className="w-5 h-5 text-gray-500" />} label="최근 귀가 기록" to="/profile/history" />
                </div>
            </main>
        </div>
    );
}

// 작은 컴포넌트들
function DashboardCard({ icon, label, value }) {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="mb-2 p-2 bg-gray-50 rounded-full">{icon}</div>
            <div className="text-lg font-bold text-gray-800">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
        </div>
    );
}

function MenuItem({ icon, label, to }) {
    const navigate = useNavigate();
    return (
        <button 
            onClick={() => to && navigate(to)} // 🚨 클릭 시 이동
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
        >
            <div className="flex items-center space-x-3">
                <div className="text-gray-400 group-hover:text-blue-500 transition-colors">{icon}</div>
                <span className="text-gray-700 font-medium text-sm">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </button>
    );
}

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);