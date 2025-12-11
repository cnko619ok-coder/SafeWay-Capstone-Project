import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useKakaoLoader } from 'react-kakao-maps-sdk'; // 🚨 Loader 임포트
import { Toaster } from 'sonner';

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

// 🚨 로딩 화면 컴포넌트
function SplashScreen() {
    return (
        <div className="min-h-screen bg-blue-500 flex flex-col items-center justify-center text-white font-sans animate-pulse">
            {/* 로고 아이콘 (Shield) */}
            <svg className="w-24 h-24 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h1 className="text-4xl font-extrabold tracking-widest">SafeWay</h1>
            <p className="mt-2 text-blue-100 text-sm">당신의 안전한 귀갓길 파트너</p>
        </div>
    );
}

function App() {
    // 로그인 상태와 사용자 UID를 저장할 상태
    const [isLoggedIn, setIsLoggedIn] = useState(false); 
    const [userUid, setUserUid] = useState(null); 
    const [isLoading, setIsLoading] = useState(true); // 🚨 로딩 상태

    // 🚨🚨🚨 [핵심 수정] 지도 SDK와 'services' 라이브러리를 여기서 미리 로드합니다.
    useKakaoLoader({
      appkey: "e8757f3638207e014bcea23f202b11d8",
      libraries: ["services", "clusterer", "drawing"], // 주소 검색에 필수!
    });

    // 🚨 초기 로딩 효과 (2초)
  useEffect(() => {
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

    // AuthScreen에서 로그인 성공 시 호출될 함수
    const handleLoginSuccess = (uid) => {
        setUserUid(uid); // UID 저장
        setIsLoggedIn(true); // 로그인 상태를 true로 변경
    };

    if (!isLoggedIn && window.location.pathname !== '/login') {
      // (선택 사항) 로딩 중 처리 등을 할 수 있습니다.
    }

    // 🚨 로딩 중이면 스플래시 화면 보여주기
  if (isLoading) {
      return <SplashScreen />;
  }

    return (
        <Router>
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Toaster position="top-center" /> {/* 🚨 토스트 알림 위치 설정 */}

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