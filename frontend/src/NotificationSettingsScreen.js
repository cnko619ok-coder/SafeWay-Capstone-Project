// frontend/src/NotificationSettingsScreen.js

import React, { useState } from 'react';
import { ArrowLeft, Bell, Volume2, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotificationSettingsScreen() {
    // 알림 상태 관리 (기본값)
    const [settings, setSettings] = useState({
        push: true,
        sms: true,
        sound: false,
        marketing: false
    });

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 border-b shadow-sm flex items-center sticky top-0 z-10">
                <Link to="/profile" className="mr-4 text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">알림 설정</h1>
            </header>

            <main className="p-4 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50">
                        <h2 className="font-bold text-gray-800">필수 알림</h2>
                        <p className="text-xs text-gray-500 mt-1">안전을 위해 켜두시는 것을 권장합니다.</p>
                    </div>
                    
                    <ToggleItem 
                        icon={<Bell className="w-5 h-5 text-blue-500" />}
                        label="위험 지역 진입 알림"
                        isOn={settings.push}
                        onToggle={() => toggleSetting('push')}
                    />
                    <div className="border-t border-gray-50"></div>
                    <ToggleItem 
                        icon={<MessageCircle className="w-5 h-5 text-green-500" />}
                        label="SOS 문자 자동 발송"
                        isOn={settings.sms}
                        onToggle={() => toggleSetting('sms')}
                    />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50">
                        <h2 className="font-bold text-gray-800">일반 알림</h2>
                    </div>
                    
                    <ToggleItem 
                        icon={<Volume2 className="w-5 h-5 text-purple-500" />}
                        label="알림 소리 켜기"
                        isOn={settings.sound}
                        onToggle={() => toggleSetting('sound')}
                    />
                    <div className="border-t border-gray-50"></div>
                    <ToggleItem 
                        icon={<Bell className="w-5 h-5 text-gray-400" />}
                        label="마케팅 정보 수신"
                        isOn={settings.marketing}
                        onToggle={() => toggleSetting('marketing')}
                    />
                </div>
            </main>
        </div>
    );
}

// 토글 스위치 컴포넌트
function ToggleItem({ icon, label, isOn, onToggle }) {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
                <span className="text-gray-700 font-medium">{label}</span>
            </div>
            {/* 토글 스위치 디자인 */}
            <button 
                onClick={onToggle}
                className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${isOn ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isOn ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
        </div>
    );
}