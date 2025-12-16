import React, { useState } from 'react';
import axios from 'axios'; 
import { API_BASE_URL } from './config';
// 이 코드를 실행하기 전에 반드시 'npm install axios'를 실행했는지 확인하세요.


// 가상의 경로 좌표 데이터 (테스트용)
// 이 데이터가 백엔드의 안전 점수 API로 전송됩니다.
const DUMMY_PATH = [
  { lat: 37.5668, lng: 126.9790 }, // 지점 1
  { lat: 37.5669, lng: 126.9791 }, // 지점 2 (10미터 떨어진 곳)
  { lat: 37.5670, lng: 126.9792 }, // 지점 3 (20미터 떨어진 곳)
];

function ApiTestComponent() {
  const [safetyScore, setSafetyScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSafetyScore = async () => {
    setLoading(true);
    setError(null);
    setSafetyScore(null);

    try {
      // 1. 백엔드 API 호출 (안전 점수 요청)
      const response = await axios.post(`${API_BASE_URL}/api/route/safety`, {
        pathPoints: DUMMY_PATH,
      });

      // 2. 응답 데이터 저장 및 표시
      setSafetyScore(response.data.safetyScore);
      
    } catch (err) {
      console.error('API 호출 실패:', err);
      // CORS 오류 등 네트워크/통신 오류 발생 시
      setError(`API 호출 실패: ${err.message}. 백엔드 서버(3005) 실행 여부 및 CORS 설정을 확인하세요.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 border rounded-lg max-w-md mx-auto text-center">
      <h2 className="text-xl font-bold mb-4 text-gray-700">백엔드 API 통신 테스트</h2>
      
      <button 
        onClick={fetchSafetyScore}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
      >
        {loading ? '계산 중...' : '안전 점수 요청 (3005 포트)'}
      </button>

      {safetyScore !== null && (
        <div className="mt-4 p-4 border-l-4 border-green-500 bg-white shadow-md">
          <p className="text-lg font-semibold text-green-700">✅ 최종 안전 점수: {safetyScore}점</p>
          <p className="text-sm text-gray-500 mt-1">
            (백엔드가 가로등 및 CCTV 데이터를 사용해 계산했습니다.)
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 border-l-4 border-red-500 bg-white shadow-md">
          <p className="text-sm text-red-600 font-medium">오류: {error}</p>
        </div>
      )}
    </div>
  );
}

export default ApiTestComponent;