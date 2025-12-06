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
app.post('/api/route/safety', async (req, res) => {
    const { pathPoints } = req.body; 
    if (!pathPoints || pathPoints.length < 2) return res.status(400).json({ error: '좌표 필요' });
    try {
        const lightsSnapshot = await db.collection('streetlights').get();
        const streetlights = lightsSnapshot.docs.map(doc => doc.data());
        const cctvData = await getCCTVData(); 
        let totalSafetyScore = 0; const radius = 50;
        pathPoints.forEach(point => {
            const nearbyLights = streetlights.filter(light => calculateDistance(point.lat, point.lng, light.lat, light.lng) <= radius).length;
            const nearbyCCTVs = cctvData.filter(cctv => calculateDistance(point.lat, point.lng, cctv.WGSXPT, cctv.WGSYPT) <= radius).length;
            totalSafetyScore += (nearbyCCTVs * 5) + (nearbyLights * 2);
        });
        const finalScore = Math.min(100, Math.round((totalSafetyScore / (pathPoints.length * 7)) * 100));
        res.status(200).json({ safetyScore: finalScore, message: '계산 완료' });
    } catch (error) { res.status(500).json({ error: '분석 오류' }); }
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