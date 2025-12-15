// frontend/src/MainScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // useNavigate 추가
import { Shield, Users, AlertTriangle, Map as MapIcon } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

export default function MainScreen({ userUid }) { 
    const navigate = useNavigate();
    const [stats, setStats] = useState({ safeReturnCount: 0, reportCount: 0 });
    const [contacts, setContacts] = useState([]);
    const [myPos, setMyPos] = useState(null);

    // 1. 내 위치 확보
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => console.error("위치 권한 필요"),
            { enableHighAccuracy: true }
        );
    }, []);

    // 2. 데이터 불러오기 (통계 + 연락처)
    useEffect(() => {
        const fetchData = async () => {
            if (!userUid) return;
            try {
                // 통계
                const userRes = await axios.get(`${API_BASE_URL}/api/users/${userUid}`);
                setStats({
                    safeReturnCount: userRes.data.stats?.safeReturnCount || 0,
                    reportCount: userRes.data.stats?.reportCount || 0
                });

                // 연락처
                const contactRes = await axios.get(`${API_BASE_URL}/api/contacts/${userUid}`);
                setContacts(contactRes.data);
            } catch (error) {
                console.error("데이터 로드 실패:", error);
            }
        };
        fetchData();
    }, [userUid]);

    // 3. SOS 핸들러
    const handleHomeSOS = () => {
        if (!myPos) return toast.error("위치 정보를 가져오는 중입니다...");

        if (contacts.length === 0) {
            if(window.confirm("비상연락처가 없습니다. 112로 연결하시겠습니까?")) {
                window.location.href = 'tel:112';
            }
            return;
        }

        const phoneNumbers = contacts.map(c => c.phone).join(',');
        const message = `[SafeWay 긴급] 도와주세요! 위치: https://map.kakao.com/link/map/${myPos.lat},${myPos.lng}`;
        const smsLink = `sms:${phoneNumbers}${navigator.userAgent.match(/iPhone/i) ? '&' : '?'}body=${encodeURIComponent(message)}`;
        window.location.href = smsLink;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 border-b flex items-center justify-between shadow-sm sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Shield className="w-6 h-6 text-blue-500 mr-2" /> SafeWay
                </h1>
                <p className="text-gray-500 text-sm">안전한 귀가를 함께합니다</p>
            </header>

            <main className="flex-grow p-4 space-y-6 pb-24"> 
                {/* 통계 카드 */}
                <section className="flex space-x-4">
                    <div className="flex-1 bg-blue-600 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                        <div className="text-4xl font-extrabold">{stats.safeReturnCount}회</div>
                        <p className="text-sm opacity-90 mt-2">총 안전 귀가</p>
                    </div>
                    <div className="flex-1 bg-cyan-500 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                        <div className="text-4xl font-extrabold">{stats.reportCount}건</div>
                        <p className="text-sm opacity-90 mt-2">나의 신고</p>
                    </div>
                </section>
                
                {/* 빠른 실행 */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">빠른 실행</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => navigate('/route/search')} className="bg-white p-5 rounded-xl shadow-md border hover:bg-gray-100 transition-colors flex flex-col items-center justify-center">
                            <MapIcon className="w-8 h-8 text-green-500 mb-2" /> 
                            <p className="font-semibold text-gray-800">경로 검색</p>
                        </button>
                        <button onClick={() => navigate('/contacts')} className="bg-white p-5 rounded-xl shadow-md border hover:bg-gray-100 transition-colors flex flex-col items-center justify-center">
                            <Users className="w-8 h-8 text-blue-500 mb-2" />
                            <p className="font-semibold text-gray-800">긴급 연락처</p>
                        </button>
                    </div>
                </section>

                {/* 안전 수칙 */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">안전 수칙</h2>
                    <ul className="bg-white p-4 rounded-xl shadow-md space-y-2 text-sm text-gray-700">
                        <li>• 밝은 곳으로 이동하고 어두운 골목은 피하세요.</li>
                        <li>• 이어폰 사용을 자제하고 주변을 살피세요.</li>
                        <li>• 위험을 느끼면 즉시 SOS 버튼을 눌러주세요.</li>
                    </ul>
                </section>

                {/* 긴급 전화번호 */}
                <section>
                    <h2 className="text-lg font-bold text-gray-800 mb-3">긴급 전화번호</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <a href="tel:112" className="block bg-red-50 border border-red-100 p-5 rounded-2xl active:scale-95 transition-transform hover:bg-red-100">
                            <div className="text-xs font-bold text-gray-600 mb-1">경찰 신고</div>
                            <div className="text-3xl font-extrabold text-red-600">112</div>
                        </a>
                        <a href="tel:182" className="block bg-red-50 border border-red-100 p-5 rounded-2xl active:scale-95 transition-transform hover:bg-red-100">
                            <div className="text-xs font-bold text-gray-600 mb-1">범죄 신고</div>
                            <div className="text-3xl font-extrabold text-red-600">182</div>
                        </a>
                    </div>
                </section>
            </main>

            {/* 🚨 SOS 플로팅 버튼 (기능 연결됨) */}
            <button 
                onClick={handleHomeSOS}
                className="fixed bottom-24 right-4 bg-red-500 text-white p-4 rounded-full shadow-lg shadow-red-300 hover:bg-red-600 hover:scale-105 transition-all z-40 flex items-center justify-center border-4 border-white animate-pulse"
            >
                <span className="font-black text-xs">SOS</span>
            </button>
        </div>
    );
}