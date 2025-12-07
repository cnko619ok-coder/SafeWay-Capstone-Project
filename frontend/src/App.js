import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useKakaoLoader } from 'react-kakao-maps-sdk'; // 🚨 Loader 임포트
import { AuthScreen } from './AuthScreen';
import MainScreen from './MainScreen'; // MainScreen.js 파일이 필요합니다.
import EmergencyContactScreen from './EmergencyContactScreen'; // EmergencyContactScreen.js 파일이 필요합니다.
import RouteSearchScreen from './RouteSearchScreen'; 
import RouteResultScreen from './RouteResultScreen';
import axios from 'axios'; // 🚨 axios import 확인

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
                  element={isLoggedIn ? <RouteResultScreen /> : <Navigate to="/login" />} 
                />
                
                {/* 위험 지역 게시판 임시 라우트 추가 */}
                <Route 
                    path="/report-board" 
                    element={isLoggedIn ? <div>위험 지역 신고 게시판 UI (구현 예정)</div> : <Navigate to="/login" />} 
                />
                
                {/* 기본 접속 시 /login으로 이동 */}
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;