// frontend/src/AccountSettingsScreen.js

import React from 'react';
import { ArrowLeft, Lock, Trash2, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccountSettingsScreen() {
    
    const handlePasswordReset = () => {
        alert("가입하신 이메일로 비밀번호 재설정 링크를 보냈습니다.");
    };

    const handleDeleteAccount = () => {
        const input = prompt("계정을 삭제하시겠습니까? '삭제'를 입력하면 진행됩니다.");
        if (input === '삭제') {
            alert("계정이 삭제되었습니다. (기능 구현 예정)");
            window.location.href = '/login';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 border-b shadow-sm flex items-center sticky top-0 z-10">
                <Link to="/profile" className="mr-4 text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">계정 관리</h1>
            </header>

            <main className="p-4 space-y-4">
                {/* 비밀번호 관리 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <button onClick={handlePasswordReset} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Lock className="w-5 h-5" /></div>
                            <span className="text-gray-700 font-medium">비밀번호 변경</span>
                        </div>
                    </button>
                </div>

                {/* 위험 구역 (로그아웃/탈퇴) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50">
                        <h2 className="font-bold text-red-500">위험 구역</h2>
                    </div>
                    
                    <button onClick={() => { if(window.confirm('로그아웃 하시겠습니까?')) window.location.href='/login'; }} className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><LogOut className="w-5 h-5" /></div>
                            <span className="text-gray-700 font-medium">로그아웃</span>
                        </div>
                    </button>
                    
                    <div className="border-t border-gray-50"></div>
                    
                    <button onClick={handleDeleteAccount} className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors group">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Trash2 className="w-5 h-5" /></div>
                            <span className="text-red-600 font-medium">회원 탈퇴</span>
                        </div>
                    </button>
                </div>
            </main>
        </div>
    );
}