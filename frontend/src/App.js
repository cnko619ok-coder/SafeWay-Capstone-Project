import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useKakaoLoader } from 'react-kakao-maps-sdk'; // 🚨 Loader 임포트

import { AuthScreen } from './AuthScreen';
import MainScreen from './MainScreen'; 
import EmergencyContactScreen from './EmergencyContactScreen'; 
import RouteSearchScreen from './RouteSearchScreen'; 
import RouteResultScreen from './RouteResultScreen';
import axios from 'axios'; 
import ReportBoardScreen from './ReportBoardScreen';
import ProfileScreen from './ProfileScreen'; 
import BottomNavigation from './BottomNavigation';
import SOSScreen from './SOSScreen'; 
import MyReportsScreen from './MyReportsScreen';
import ReturnHistoryScreen from './ReturnHistoryScreen';
import ReportDetailScreen from './ReportDetailScreen';
import ProfileEditScreen from './ProfileEditScreen';
import NotificationSettingsScreen from './NotificationSettingsScreen';
import AccountSettingsScreen from './AccountSettingsScreen';
import NavigationScreen from './NavigationScreen';

axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'any';

function App() {
    // 로그인 상태와 사용자 UID를 저장할 상태
    const [isLoggedIn, setIsLoggedIn] = useState(false); 
    const [userUid, setUserUid] = useState(null); 

    // 🚨🚨🚨 [핵심 수정] 지도 SDK와 'services' 라이브러리를 여기서 미리 로드합니다.
    useKakaoLoader({
      appkey: "15b6d60e4095cdc453d99c4883ad6e6d",
      libraries: ["services", "clusterer", "drawing"], // 주소 검색에 필수!
    });

    // AuthScreen에서 로그인 성공 시 호출될 함수
    const handleLoginSuccess = (uid) => {
        setUserUid(uid); // UID 저장
        setIsLoggedIn(true); // 로그인 상태를 true로 변경
    };

    if (!isLoggedIn && window.location.pathname !== '/login') {
      // (선택 사항) 로딩 중 처리 등을 할 수 있습니다.
    }

    return (
        <Router>
            <div className="flex flex-col min-h-screen bg-gray-50">

          {/* 콘텐츠 영역 (메뉴바 높이만큼 하단 여백 추가: pb-20) */}
          <div className={`flex-grow ${isLoggedIn ? 'pb-20' : ''}`}>
            <Routes>
                {/* 로그인 화면: 로그인 상태가 아니면 AuthScreen 표시 */}
                <Route 
                    path="/login" 
                    element={isLoggedIn ? <Navigate to="/" /> : <AuthScreen onLoginSuccess={handleLoginSuccess} />} 
                />
                
                {/* 메인 화면: 로그인 상태가 아니면 /login으로 리다이렉트 */}
                <Route 
                    path="/" 
                    element={isLoggedIn ? <MainScreen userUid={userUid} /> : <Navigate to="/login" />} 
                />
                
                {/* 긴급 연락처 화면: 로그인 상태일 때만 접근 가능 */}
                <Route 
                    path="/contacts" 
                    element={isLoggedIn ? <EmergencyContactScreen userUid={userUid} /> : <Navigate to="/login" />} 
                />
                {/* 🚨🚨🚨 경로 검색 라우트 추가 */}
                <Route 
                  path="/route/search" 
                  element={isLoggedIn ? <RouteSearchScreen userUid={userUid} /> : <Navigate to="/login" />}
                />
        
                {/* 🚨🚨🚨 경로 결과 라우트 추가 */}
                <Route 
                   path="/route/result" 
                    element={isLoggedIn ? <RouteResultScreen userUid={userUid} /> : <Navigate to="/login" />} 
                />
                
                {/* 🚨🚨🚨 위험 지역 게시판 라우트 연결 (수정됨) */}
                <Route 
                    path="/report-board" 
                    element={isLoggedIn ? <ReportBoardScreen userUid={userUid} /> : <Navigate to="/login" />} 
                />

                {/* 🚨 프로필 화면 라우트 추가 */}
                <Route 
                    path="/profile" 
                    element={isLoggedIn ? <ProfileScreen userUid={userUid} /> : <Navigate to="/login" />} 
                />

                {/* 🚨 상세 화면 라우트 추가 */}
                <Route 
                    path="/profile/reports" 
                    element={isLoggedIn ? <MyReportsScreen /> : <Navigate to="/login" />} />
                <Route 
                    path="/profile/history" 
                    element={isLoggedIn ? <ReturnHistoryScreen userUid={userUid} /> : <Navigate to="/login" />} 
                /> 
                <Route 
                    path="/report-board/:id" 
                    element={isLoggedIn ? <ReportDetailScreen userUid={userUid} /> : <Navigate to="/login" />} />

                {/* 🚨 SOS 화면 라우트 추가 */}
                <Route 
                    path="/sos" 
                    element={isLoggedIn ? <SOSScreen /> : <Navigate to="/login" />} 
                />
                
                {/* 기본 접속 시 /login으로 이동 */}
                <Route path="*" element={<Navigate to="/login" />} />

                {/* 🚨 프로필 수정 화면 추가 */}
                <Route 
                    path="/profile/edit" 
                    element={isLoggedIn ? <ProfileEditScreen userUid={userUid} /> : <Navigate to="/login" />} 
                />

                {/* 🚨 주행 안내 화면 라우트 추가 */}
                <Route 
                    path="/navigation" 
                    element={isLoggedIn ? <NavigationScreen /> : <Navigate to="/login" />} 
                />

                {/* 🚨 설정 화면 라우트 추가 */}
                <Route 
                    path="/profile/notifications" 
                    element={isLoggedIn ? <NotificationSettingsScreen /> : <Navigate to="/login" />} />
                <Route 
                    path="/profile/account" 
                    element={isLoggedIn ? <AccountSettingsScreen /> : <Navigate to="/login" />} />

            </Routes>
            </div>
            {/* 🚨 로그인 상태일 때만 하단 메뉴바 표시 (모든 화면 공통) */}
            {isLoggedIn && <BottomNavigation />}

          </div>
        </Router>
    );
}

export default App;