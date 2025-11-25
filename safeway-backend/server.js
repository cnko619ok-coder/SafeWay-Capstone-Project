require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); 
const axios = require('axios');
const app = express();

// .env 파일에서 포트 번호 로드 (기본값: 3005)
const port = process.env.PORT || 3005;

// 1. Firebase Admin SDK 초기화 (JSON 파일명 확인)
const serviceAccount = require('./firebase-admin-key.json'); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 2. Firebase 서비스 인스턴스 참조
const db = admin.firestore();       
const auth = admin.auth();         

// 3. CCTV API 정보 설정
const SEOUL_CCTV_KEY = process.env.SEOUL_CCTV_KEY;
// 서비스 이름: safeOpenCCTV (API 명세 확인 완료)
const CCTV_API_SERVICE = 'safeOpenCCTV'; 
const SEOUL_CCTV_BASE_URL = 'http://openapi.seoul.go.kr:8088/';


// 미들웨어 설정
app.use(cors());
app.use(express.json());

// =======================================================
//           A. 인증 (로그인 / 회원가입) API
// =======================================================

// 사용자 회원가입 API
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: '이메일과 비밀번호는 필수입니다.' });

  try {
    const userRecord = await auth.createUser({ email, password, displayName: name });
    await db.collection('users').doc(userRecord.uid).set({
      name: name,
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ message: '회원가입 성공', uid: userRecord.uid });
  } catch (error) {
    console.error('회원가입 에러:', error.message);
    res.status(500).json({ error: '회원가입에 실패했습니다.', details: error.message });
  }
});

// 사용자 로그인 API
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: '이메일과 비밀번호는 필수입니다.' });

  try {
    const user = await auth.getUserByEmail(email);
    // 실제 클라이언트에서 로그인 처리 후 Custom Token 발급 (세션 유지)
    const customToken = await auth.createCustomToken(user.uid); 
    res.status(200).json({ message: '로그인 성공', uid: user.uid, token: customToken });
  } catch (error) {
    console.error('로그인 에러:', error.message);
    res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.', details: error.message });
  }
});


// =======================================================
//           B. 안전 경로 및 데이터 API (핵심)
// =======================================================

/**
 * 서울시 CCTV 데이터를 API를 통해 호출하는 함수
 */
async function getCCTVData() {
    const url = `${SEOUL_CCTV_BASE_URL}${SEOUL_CCTV_KEY}/json/${CCTV_API_SERVICE}/1/100/`; 
    
    try {
        const response = await axios.get(url);
        // 응답 구조에 맞게 수정: response.data.safeOpenCCTV.row
        return response.data.safeOpenCCTV.row || []; 
    } catch (error) {
        console.error("CCTV API 호출 실패:", error.message);
        return [];
    }
}


// 경로 안전 점수 계산 API
app.post('/api/route/safety', async (req, res) => {
    // 프론트엔드에서 Kakao Maps API를 통해 받은 경로 좌표 리스트
    const { pathPoints } = req.body; 

    if (!pathPoints || pathPoints.length < 2) {
        return res.status(400).json({ error: '유효한 경로 좌표가 필요합니다.' });
    }

    const radius = 50; // 검색 반경 50m
    let totalSafetyScore = 0;
    
    try {
        // 1. 가로등 데이터 불러오기 (Firestore) - 9170개 데이터 활용
        const lightsSnapshot = await db.collection('streetlights').get();
        const streetlights = lightsSnapshot.docs.map(doc => doc.data());

        // 2. CCTV 데이터 호출
        const cctvData = await getCCTVData(); 

        // 3. 경로상의 각 지점을 순회하며 안전 점수 계산
        pathPoints.forEach(point => {
            
            // a) 가로등 밀도 계산
            const nearbyLights = streetlights.filter(light => {
                const distance = calculateDistance(point.lat, point.lng, light.lat, light.lng);
                return distance <= radius;
            }).length;
            
            // b) CCTV 밀도 계산
            const nearbyCCTVs = cctvData.filter(cctv => {
                // 위도/경도 필드명 WGSXPT, WGSYPT 사용 (API 명세 확인 완료)
                const distance = calculateDistance(point.lat, point.lng, cctv.WGSXPT, cctv.WGSYPT); 
                return distance <= radius;
            }).length;

            // c) 점수 산정 (가중치 부여)
            totalSafetyScore += (nearbyCCTVs * 5) + (nearbyLights * 2);
        });

        // 4. 최종 점수 정규화
        const maxScorePossible = pathPoints.length * (5 + 2); 
        const finalScore = Math.min(100, Math.round((totalSafetyScore / maxScorePossible) * 100));

        res.status(200).json({ 
            safetyScore: finalScore, 
            message: '안전 점수 계산 완료' 
        });

    } catch (error) {
        console.error('안전 경로 계산 오류:', error);
        res.status(500).json({ error: '경로 분석 중 오류가 발생했습니다.' });
    }
});


// **경위도 간 거리를 계산하는 헬퍼 함수 (Haversine 공식)**
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 거리 (미터 단위)
}


// =======================================================
//                  C. 서버 실행
// =======================================================

// 기본 라우트
app.get('/', (req, res) => {
    res.send('SafeWay Backend Server is Running! (Auth & Safety Ready)');
});

// 서버 실행
app.listen(port, () => {
  console.log(`Backend Server listening at http://localhost:${port}`);
});