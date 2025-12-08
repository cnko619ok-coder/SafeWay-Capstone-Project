// frontend/src/AuthScreen.js
import React, { useState } from 'react';
import { Shield } from 'lucide-react'; 
import axios from 'axios'; 

const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev';

// 🚨 onLoginSuccess prop을 받도록 수정되었습니다.
export function AuthScreen({ onLoginSuccess }) { 
  const [isLogin, setIsLogin] = useState(true); 
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [authStatus, setAuthStatus] = useState(''); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setAuthStatus('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthStatus('처리 중...');

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setAuthStatus('오류: 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = {
        email: formData.email,
        password: formData.password,
        ...(isLogin ? {} : { name: formData.name }) 
      };

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);
      
      if (isLogin) {
        setAuthStatus(`✅ 로그인 성공! (UID: ${response.data.uid})`);
        
        // 🚨🚨🚨 로그인 성공 시 App.js에 UID를 전달하며 성공을 알림
        if (onLoginSuccess) {
          onLoginSuccess(response.data.uid); 
        }

      } else {
        setAuthStatus('✅ 회원가입 성공! 이제 로그인해 주세요.');
        setIsLogin(true); 
      }

    } catch (error) {
      // 🚨🚨🚨 [수정된 에러 처리 로직] 🚨🚨🚨
      
      // 1. 401 에러 (비밀번호 틀림/계정 없음)일 때 친절한 메시지 표시
      if (error.response && error.response.status === 401) {
        setAuthStatus('❌ 이메일 또는 비밀번호가 올바르지 않습니다.');
      } 
      // 2. 그 외 서버에서 보낸 구체적인 에러 메시지가 있는 경우
      else if (error.response && error.response.data && error.response.data.error) {
        setAuthStatus(`❌ 오류: ${error.response.data.error}`);
      }
      // 3. 그 외 알 수 없는 네트워크 오류 등
      else {
        setAuthStatus('❌ 서버 연결에 실패했습니다. 다시 시도해 주세요.');
      }
      
      console.error('로그인/회원가입 에러:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex flex-col items-center justify-center p-6">
      
      {/* 로고 및 타이틀 */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-xl shadow-blue-500/30">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-gray-900 mb-2 text-[40px] font-bold tracking-tighter">SafeWay</h1>
        <p className="text-gray-600 font-medium">{isLogin ? '로그인' : '회원가입'}</p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 이름 입력 (회원가입일 때만) */}
          {!isLogin && (
            <input
              id="name"
              type="text"
              placeholder="이름"
              value={formData.name}
              onChange={handleChange}
              required={!isLogin}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 h-12 px-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          )}

          {/* 이메일 입력 */}
          <input
            id="email"
            type="email"
            placeholder="이메일"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 h-12 px-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          {/* 비밀번호 입력 */}
          <input
            id="password"
            type="password"
            placeholder="비밀번호"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 h-12 px-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          {/* 비밀번호 확인 (회원가입일 때만) */}
          {!isLogin && (
            <input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호 확인"
              value={formData.confirmPassword}
              onChange={handleChange}
              required={!isLogin}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 h-12 px-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          )}
          
          {/* 상태 메시지 */}
          {authStatus && (
            <p className={`text-sm font-medium ${authStatus.startsWith('오류') ? 'text-red-500' : 'text-green-600'}`}>{authStatus}</p>
          )}

          {/* 로그인/회원가입 버튼 */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-12 text-white font-bold rounded-xl mt-2 shadow-lg shadow-blue-500/30 transition-all"
            disabled={authStatus === '처리 중...'}
          >
            {isLogin ? '계속' : '회원가입'}
          </button>

          {/* 소셜 로그인 구분선 및 버튼 (로그인일 때만) */}
          {isLogin && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">또는</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full bg-white hover:bg-gray-50 text-gray-800 h-12 border border-gray-200 rounded-xl flex items-center justify-center font-medium transition-colors"
                onClick={() => setAuthStatus('Google 로그인 기능은 준비중입니다')}
              >
                {/* 구글 로고 SVG 생략 */}
                Google 계정으로 계속하기
              </button>
            </>
          )}
        </form>

        {/* 하단 전환 텍스트 */}
        <div className="mt-6 text-center">
          <button 
            className="text-gray-600 text-sm hover:text-blue-600 transition-colors font-medium"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </div>

      <p className="text-gray-500 text-sm mt-6 text-center">
        SafeWay를 이용하면 서비스 약관 및<br />개인정보 처리방침에 동의하게 됩니다
      </p>
    </div>
  );
}