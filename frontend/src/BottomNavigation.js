// frontend/src/BottomNavigation.js

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map as MapIcon, AlertTriangle, Users, User } from 'lucide-react';

export default function BottomNavigation() {
    const location = useLocation(); // 현재 어떤 화면인지 확인 (선택된 탭 색상 변경용)

    // 탭 아이템 스타일 (선택됨/선택안됨)
    const getTabClass = (path) => {
        const isActive = location.pathname === path;
        return `flex flex-col items-center p-2 transition-colors ${
            isActive ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-blue-500'
        }`;
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2 pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
            <Link to="/" className={getTabClass('/')}>
                <Home className="w-6 h-6" />
                <span className="text-xs mt-1">홈</span>
            </Link>
            <Link to="/route/search" className={getTabClass('/route/search')}>
                <MapIcon className="w-6 h-6" />
                <span className="text-xs mt-1">경로</span>
            </Link>
            <Link to="/report-board" className={getTabClass('/report-board')}>
                <AlertTriangle className="w-6 h-6" />
                <span className="text-xs mt-1">신고</span>
            </Link>
            <Link to="/contacts" className={getTabClass('/contacts')}>
                <Users className="w-6 h-6" />
                <span className="text-xs mt-1">연락처</span>
            </Link>
            <Link to="/profile" className={getTabClass('/profile')}>
                <User className="w-6 h-6" />
                <span className="text-xs mt-1">프로필</span>
            </Link>
        </nav>
    );
}