import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useKakaoLoader } from 'react-kakao-maps-sdk';
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
import SplashScreen from './SplashScreen';

axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'any';

function App() {
    // 시작할 때 저장된 UID가 있는지 확인 (새로고침 방지)
    const savedUid = localStorage.getItem('userUid');
    
    const [isLoggedIn, setIsLoggedIn] = useState(!!savedUid); 
    const [userUid, setUserUid] = useState(savedUid); 
    const [isLoading, setIsLoading] = useState(true);

    useKakaoLoader({
      appkey: "e8757f3638207e014bcea23f202b11d8",
      libraries: ["services", "clusterer", "drawing"], 
    });

    // 로그인 성공 시 저장소에 UID 저장
    const handleLoginSuccess = (uid) => {
        setUserUid(uid);
        setIsLoggedIn(true);
        localStorage.setItem('userUid', uid); // 영구 저장
    };

    // 로그아웃 기능 (필요시 사용)
    const handleLogout = () => {
        setUserUid(null);
        setIsLoggedIn(false);
        localStorage.removeItem('userUid');
    };

    const handleSplashFinish = () => {
        setIsLoading(false);
    };

    if (isLoading) {
        return <SplashScreen onFinish={handleSplashFinish} />;
    }

    return (
        <Router>
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Toaster position="top-center" /> 

                <div className={`flex-grow ${isLoggedIn ? 'pb-20' : ''}`}>
                  <Routes>
                      <Route 
                        path="/login" 
                        element={isLoggedIn ? <Navigate to="/" /> : <AuthScreen onLoginSuccess={handleLoginSuccess} />} 
                      />
                
                      <Route 
                        path="/" 
                        element={isLoggedIn ? <MainScreen userUid={userUid} /> : <Navigate to="/login" />} 
                      />
                
                      <Route 
                          path="/contacts" 
                          element={isLoggedIn ? <EmergencyContactScreen userUid={userUid} /> : <Navigate to="/login" />} 
                      />
                      <Route 
                         path="/route/search" 
                         element={isLoggedIn ? <RouteSearchScreen userUid={userUid} /> : <Navigate to="/login" />}
                      />
        
                      <Route 
                         path="/route/result" 
                         element={isLoggedIn ? <RouteResultScreen userUid={userUid} /> : <Navigate to="/login" />} 
                      />
                
                      <Route 
                          path="/report-board" 
                          element={isLoggedIn ? <ReportBoardScreen userUid={userUid} /> : <Navigate to="/login" />} 
                      />

                      <Route 
                          path="/profile" 
                          element={isLoggedIn ? <ProfileScreen userUid={userUid} onLogout={handleLogout} /> : <Navigate to="/login" />} 
                       />

                      <Route 
                          path="/profile/reports" 
                          element={isLoggedIn ? <MyReportsScreen userUid={userUid} /> : <Navigate to="/login" />} 
                      />
                      <Route 
                          path="/profile/history" 
                          element={isLoggedIn ? <ReturnHistoryScreen userUid={userUid} /> : <Navigate to="/login" />} 
                      /> 
                      <Route path="/report-board/:id" element={<ReportDetailScreen userUid={userUid} />} />

                      <Route 
                          path="/sos" 
                          element={isLoggedIn ? <SOSScreen /> : <Navigate to="/login" />} 
                      />
                
                      <Route path="*" element={<Navigate to="/login" />} />
  
                      <Route 
                          path="/profile/edit" 
                          element={isLoggedIn ? <ProfileEditScreen userUid={userUid} /> : <Navigate to="/login" />} 
                      />

                      <Route 
                          path="/navigation" 
                          element={isLoggedIn ? <NavigationScreen userUid={userUid} /> : <Navigate to="/login" />} 
                      />

                      <Route 
                          path="/profile/notifications" 
                          element={isLoggedIn ? <NotificationSettingsScreen /> : <Navigate to="/login" />} />
                      <Route 
                          path="/profile/account" 
                          element={isLoggedIn ? <AccountSettingsScreen onLogout={handleLogout} /> : <Navigate to="/login" />} 
                        />
                  </Routes>
                </div>
                {isLoggedIn && <BottomNavigation />}

            </div>
        </Router>
    );
}

export default App;