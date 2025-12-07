// safeway-backend/server.js

require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); 
const axios = require('axios');
const app = express();

const port = process.env.PORT || 3005;

// 1. Firebase Admin SDK 초기화
const serviceAccount = require('./firebase-admin-key.json'); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 2. Firebase 서비스 인스턴스 참조
const db = admin.firestore();       
const auth = admin.auth();         

// 3. CCTV API 정보 설정
const SEOUL_CCTV_KEY = process.env.SEOUL_CCTV_KEY;
const CCTV_API_SERVICE = 'safeOpenCCTV'; 
const SEOUL_CCTV_BASE_URL = 'http://openapi.seoul.go.kr:8088/';

app.use(express.json());

// 🚨🚨🚨 CORS 설정 강화 (수정된 부분) 🚨🚨🚨
// 프론트엔드(Vercel)에서 오는 요청과 ngrok 헤더를 허용합니다.
app.use(cors({
    origin: true, // 모든 도메인에서의 요청 허용 (Vercel 포함)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'] // 🚨 ngrok 헤더 허용 필수
}));

//가로등 데이터를 메모리에 저장할 변수
let cachedStreetlights = [];

// 🚨🚨🚨 [추가] 서버 시작 시 가로등 데이터를 한 번만 불러오는 함수
async function loadStreetlightsData() {
    try {
        console.log("📡 가로등 데이터 로딩 시작...");
        const snapshot = await db.collection('streetlights').get();
        if (snapshot.empty) {
            console.log("⚠️ 가로등 데이터가 비어있습니다.");
            return;
        }
        // 데이터를 메모리 변수에 저장
        cachedStreetlights = snapshot.docs.map(doc => doc.data());
        console.log(`✅ 가로등 데이터 ${cachedStreetlights.length}개 로드 완료! (메모리 캐시)`);
    } catch (error) {
        console.error("❌ 가로등 데이터 로드 실패:", error.message);
    }
}

// 서버 시작 시 바로 실행
loadStreetlightsData();

// =======================================================
//           미들웨어: 인증 확인
// =======================================================
const requireAuth = (req, res, next) => {
    // 🚨 req.body.uid가 반드시 포함되어 있어야 추가 기능이 작동합니다.
    const uid = req.body.uid || req.params.uid || req.query.uid; 
    
    if (!uid) {
        return res.status(401).json({ error: '인증 정보(UID)가 필요합니다.' });
    }
    
    req.uid = uid; 
    next();
};

// =======================================================
//           A. 인증 API
// =======================================================
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: '필수 정보 누락' });
    try {
        const userRecord = await auth.createUser({ email, password, displayName: name });
        await db.collection('users').doc(userRecord.uid).set({
            name: name, email: email, createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(201).json({ message: '회원가입 성공', uid: userRecord.uid });
    } catch (error) {
        res.status(500).json({ error: '회원가입 실패', details: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: '필수 정보 누락' });
    try {
        const user = await auth.getUserByEmail(email);
        const customToken = await auth.createCustomToken(user.uid); 
        res.status(200).json({ message: '로그인 성공', uid: user.uid, token: customToken });
    } catch (error) {
        res.status(401).json({ error: '로그인 실패', details: error.message });
    }
});

// =======================================================
//           B. 안전 경로 API
// =======================================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; const φ1 = lat1 * Math.PI / 180; const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180; const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
async function getCCTVData() {
    const url = `${SEOUL_CCTV_BASE_URL}${SEOUL_CCTV_KEY}/json/${CCTV_API_SERVICE}/1/100/`; 
    try {
        const response = await axios.get(url);
        if (response.status !== 200) return [];
        return response.data[CCTV_API_SERVICE]?.row || [];
    } catch (error) { return []; }
}
// safeway-backend/server.js (안전 점수 계산 API 부분 수정)

app.post('/api/route/safety', async (req, res) => {
    const { pathPoints } = req.body; 
    if (!pathPoints || pathPoints.length < 2) {
        return res.status(400).json({ error: '유효한 경로 좌표가 필요합니다.' });
    }

    // 🚨 수정 1: 검색 반경을 50m -> 1000m (1km)로 늘려서 데이터를 확실히 잡도록 함
    const radius = 1000; 
    let totalSafetyScore = 0;
    
    try {
        // 1. 전체 데이터 로드
        const streetlights = cachedStreetlights;

        if (streetlights.length === 0) {
            console.warn("⚠️ 가로등 데이터가 없습니다. (아직 로딩 중이거나 DB 비어있음)");
        }

        const cctvData = await getCCTVData(); 

        // 🚨 수정 2: 로드된 전체 데이터 개수 확인 로그
        console.log(`[데이터 로드] 가로등: ${streetlights.length}개, CCTV: ${cctvData.length}개`);

        let totalLightsFound = 0;
        let totalCCTVsFound = 0;

        pathPoints.forEach(point => {
            
            // a) 가로등 밀도 계산
            const nearbyLights = streetlights.filter(light => {
                const distance = calculateDistance(point.lat, point.lng, light.lat, light.lng);
                return distance <= radius;
            }).length;
            
            // b) CCTV 밀도 계산
            const nearbyCCTVs = cctvData.filter(cctv => {
                // 필드명 WGSXPT, WGSYPT 사용
                const distance = calculateDistance(point.lat, point.lng, cctv.WGSXPT, cctv.WGSYPT); 
                return distance <= radius;
            }).length;

            totalLightsFound += nearbyLights;
            totalCCTVsFound += nearbyCCTVs;

            // 가중치 점수 합산
            totalSafetyScore += (nearbyCCTVs * 5) + (nearbyLights * 2);
        });

        // 🚨 수정 3: 실제로 찾은 개수 로그 출력
        console.log(`[분석 결과] 반경 ${radius}m 내 발견 - 가로등: ${totalLightsFound}개, CCTV: ${totalCCTVsFound}개`);

        // 4. 최종 점수 정규화 (간단하게 100점 만점 환산)
        // 점수가 너무 크면 100점으로 고정
        let finalScore = 60 + (totalCCTVsFound * 3) + (totalLightsFound * 1);
        finalScore = Math.min(100, finalScore); // 100점을 넘지 않도록 제한

        res.status(200).json({ 
            safetyScore: finalScore, 
            cctvCount: totalCCTVsFound,   // 👈 추가됨
            lightCount: totalLightsFound,
            message: '안전 점수 계산 완료' 
        });

    } catch (error) {
        console.error('안전 경로 계산 오류:', error);
        res.status(500).json({ error: '경로 분석 중 오류가 발생했습니다.' });
    }
});
// =======================================================
//           C. 긴급 연락처 관리 API
// =======================================================

// 1. 등록
app.post('/api/contacts', requireAuth, async (req, res) => {
    const { uid, name, number, relation } = req.body;
    if (!name || !number) return res.status(400).json({ error: '이름/연락처 필수' });
    try {
        await db.collection('users').doc(uid).collection('emergency_contacts').add({
            name, number, relation: relation || '가족/지인', createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(201).json({ message: '등록 성공' });
    } catch (error) {
        res.status(500).json({ error: '등록 실패' });
    }
});

// 2. 조회
app.get('/api/contacts/:uid', async (req, res) => {
    const uid = req.params.uid;
    try {
        const snapshot = await db.collection('users').doc(uid).collection('emergency_contacts').get();
        const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(contacts);
    } catch (error) {
        res.status(500).json({ error: '조회 실패' });
    }
});

app.delete('/api/contacts', requireAuth, async (req, res) => {
    // req.body에서 uid와 contactId를 받습니다.
    const { uid, contactId } = req.body; 

    // 디버깅 로그: 데이터 수신 확인
    console.log(`[DELETE REQUEST BODY]`, req.body);

    if (!uid || !contactId) {
        return res.status(400).json({ error: 'UID 또는 ContactID 누락 (Body 확인 필요)' });
    }

    try {
        await db.collection('users').doc(uid).collection('emergency_contacts').doc(contactId).delete();
        console.log(`✅ 삭제 성공: ${contactId}`);
        res.status(200).json({ message: '삭제 성공' });
    } catch (error) {
        console.error(`❌ 삭제 실패:`, error);
        res.status(500).json({ error: '삭제 실패', details: error.message });
    }
});

// D. 실행
app.listen(port, () => {
  console.log(`Backend Server listening at http://localhost:${port}`);
});