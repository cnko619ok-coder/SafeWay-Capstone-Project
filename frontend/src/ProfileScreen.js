// frontend/src/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Settings, Bell, FileText, Clock, ChevronRight, LogOut, Shield, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

// 🚨 onLogout을 props로 받습니다.
export default function ProfileScreen({ userUid, onLogout }) {
    const navigate = useNavigate();
    
    const [userInfo, setUserInfo] = useState({
        name: '사용자', 
        email: '', 
        safeReturns: 0, 
        reports: 0, 
        usageTime: '0시간',
        profileImage: null 
    });

    useEffect(() => {
        const fetchUser = async () => {
            if (!userUid) return;
            try {
                const response = await axios.get(`${API_BASE_URL}/api/users/${userUid}`);
                const data = response.data;
                
                setUserInfo({
                    name: data.name || '사용자',
                    email: data.email || '',
                    safeReturns: data.stats?.safeReturnCount || 0,
                    reports: data.stats?.reportCount || 0,
                    usageTime: data.stats?.usageTime || '0시간',
                    profileImage: data.profileImage || null 
                });
            } catch (error) { console.error("프로필 로드 실패:", error); }
        };
        fetchUser();
    }, [userUid]);

    // 🚨 [수정됨] 로그아웃 핸들러
    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            // 부모 컴포넌트(App.js)에서 전달받은 onLogout 함수 실행
            // (localStorage를 비우고 상태를 초기화하는 역할)
            if (onLogout) {
                onLogout();
            }
            // 로그인 화면으로 이동
            navigate('/login'); 
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 flex items-center justify-center relative shadow-sm sticky top-0 z-10">
                <h1 className="text-lg font-bold text-gray-800">프로필</h1>
                <button onClick={handleLogout} className="absolute right-4 text-gray-500 hover:text-red-500 transition-colors" title="로그아웃">
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <main className="flex-grow p-5 space-y-6 pb-24">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-200 transform transition hover:scale-[1.02]">
                    <div className="flex items-center space-x-4">
                        {/* 이미지가 있으면 보여주고, 없으면 이니셜 보여주기 */}
                        {userInfo.profileImage ? (
                            <img 
                                src={userInfo.profileImage} 
                                alt="Profile" 
                                className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shadow-md bg-white"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm border-2 border-white/30">
                                {userInfo.name[0]}
                            </div>
                        )}
                        
                        <div>
                            <h2 className="text-xl font-bold">{userInfo.name}</h2>
                            <p className="text-sm text-blue-100 opacity-90">{userInfo.email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/profile/edit')}
                        className="mt-6 w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium backdrop-blur-sm transition-colors flex items-center justify-center"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        프로필 정보 수정
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <DashboardCard icon={<Shield className="w-5 h-5 text-blue-500" />} label="안전 귀가" value={`${userInfo.safeReturns}회`} />
                    <DashboardCard icon={<MapPin className="w-5 h-5 text-green-500" />} label="신고 내역" value={`${userInfo.reports}건`} />
                    <DashboardCard icon={<Clock className="w-5 h-5 text-purple-500" />} label="총 이용시간" value={userInfo.usageTime} />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">내 활동</h3>
                    </div>
                    <MenuItem icon={<FileText className="w-5 h-5 text-gray-500" />} label="내 신고 내역 확인" to="/profile/reports" />
                    <div className="border-t border-gray-50"></div>
                    <MenuItem icon={<Clock className="w-5 h-5 text-gray-500" />} label="최근 귀가 기록" to="/profile/history" />
                    
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 mt-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">설정</h3>
                    </div>
                    <MenuItem icon={<Bell className="w-5 h-5 text-gray-500" />} label="알림 설정" to="/profile/notifications" /> 
                    <div className="border-t border-gray-50"></div>
                    <MenuItem icon={<User className="w-5 h-5 text-gray-500" />} label="계정 및 개인정보 관리" to="/profile/account" />
                </div>
            </main>
        </div>
    );
}

function DashboardCard({ icon, label, value }) {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
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
            onClick={() => to && navigate(to)}
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