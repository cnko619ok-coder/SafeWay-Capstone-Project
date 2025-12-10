// safeway-backend/server.js

require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); 
const axios = require('axios');
const app = express();

const port = process.env.PORT || 3005;

// =======================================================
// [0] 기본 설정 및 초기화
// =======================================================

// 1. Firebase Admin SDK 초기화
const serviceAccount = require('./firebase-admin-key.json'); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();       
const auth = admin.auth();         

// 2. API 키 설정 (환경 변수 또는 직접 입력)
const SEOUL_CCTV_KEY = process.env.SEOUL_CCTV_KEY;
const CCTV_API_SERVICE = 'safeOpenCCTV'; 
const SEOUL_CCTV_BASE_URL = 'http://openapi.seoul.go.kr:8088/';

// 🚨 [필수] 카카오 REST API 키
const KAKAO_REST_API_KEY = "8b061f49c292c06e12c6e11814895014"; 

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));
app.use(express.json());

// =======================================================
// [유틸리티] 데이터 캐싱 및 함수들
// =======================================================

// 가로등 데이터 캐싱 (일일 할당량 절약)
let cachedStreetlights = []; 
async function loadStreetlightsData() {
    if (cachedStreetlights.length > 0) return;
    try {
        console.log("📡 가로등 데이터 로딩 중...");
        const snapshot = await db.collection('streetlights').get();
        if (snapshot.empty) return;
        cachedStreetlights = snapshot.docs.map(doc => doc.data());
        console.log(`✅ 가로등 데이터 ${cachedStreetlights.length}개 로드 완료!`);
    } catch (error) { console.error("가로등 로드 실패:", error.message); }
}
loadStreetlightsData();

// 거리 계산 함수 (Haversine Formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI/180; const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180; const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) + Math.cos(φ1)*Math.cos(φ2) * Math.sin(Δλ/2)*Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// CCTV 데이터 가져오기
async function getCCTVData() {
    try {
        const url = `${SEOUL_CCTV_BASE_URL}${SEOUL_CCTV_KEY}/json/${CCTV_API_SERVICE}/1/100/`; 
        const response = await axios.get(url, { timeout: 3000 });
        return response.data[CCTV_API_SERVICE]?.row || [];
    } catch (error) { return []; }
}

// [핵심] 경로 분석 함수 (안전 점수 계산)
async function analyzePath(pathPoints) {
    const streetlights = cachedStreetlights; 
    const cctvData = await getCCTVData(); 
    
    let totalLights = 0;
    let totalCCTVs = 0;
    const radius = 50; 

    // 성능 최적화: 10개 단위 샘플링
    for (let i = 0; i < pathPoints.length; i += 10) {
        const point = pathPoints[i];
        const lights = streetlights.filter(l => calculateDistance(point.lat, point.lng, l.lat, l.lng) <= radius).length;
        const cctvs = cctvData.filter(c => calculateDistance(point.lat, point.lng, c.WGSXPT, c.WGSYPT) <= radius).length;
        totalLights += lights;
        totalCCTVs += cctvs;
    }

    let score = 60 + (totalCCTVs * 5) + (totalLights * 1);
    score = Math.min(100, Math.max(0, score));

    return { score, lights: totalLights, cctv: totalCCTVs };
}

// 🚨 [누락되었던 함수 추가] 카카오 길찾기 요청 함수
async function getKakaoRoute(start, end, priority) {
    const url = "https://apis-navi.kakaomobility.com/v1/waypoints/directions";
    const response = await axios.post(url, {
        origin: { x: start.lng, y: start.lat },
        destination: { x: end.lng, y: end.lat },
        priority: priority, 
        car_fuel: "GASOLINE", car_hipass: false, alternatives: false, road_details: false
    }, {
        headers: { "Content-Type": "application/json", "Authorization": `KakaoAK ${KAKAO_REST_API_KEY}` }
    });

    const summary = response.data.routes[0].summary;
    const sections = response.data.routes[0].sections;
    
    let path = [];
    sections.forEach(section => {
        section.roads.forEach(r => {
            for (let i=0; i<r.vertexes.length; i+=2) {
                path.push({ lng: r.vertexes[i], lat: r.vertexes[i+1] });
            }
        });
    });

    return { path, distance: summary.distance, duration: summary.duration };
}

// 인증 미들웨어
const requireAuth = (req, res, next) => {
    const uid = req.body.uid || req.query.uid || req.params.uid; 
    if (!uid) return res.status(401).json({ error: '인증 정보(UID)가 필요합니다.' });
    req.uid = uid; 
    next();
};


// =======================================================
//           A. 인증 API
// =======================================================
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const userRecord = await auth.createUser({ email, password, displayName: name });
        await db.collection('users').doc(userRecord.uid).set({
            name, email, createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(201).json({ message: '회원가입 성공', uid: userRecord.uid });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await auth.getUserByEmail(email);
        const token = await auth.createCustomToken(user.uid); 
        res.status(200).json({ message: '로그인 성공', uid: user.uid, token });
    } catch (error) { res.status(401).json({ error: error.message }); }
});

// =======================================================
//           B. 안전 경로 API (기본)
// =======================================================
app.post('/api/route/safety', async (req, res) => {
    const { pathPoints } = req.body;
    const radius = 1000; 
    let totalSafetyScore = 0;
    try {
        const streetlights = cachedStreetlights; 
        const cctvData = await getCCTVData(); 
        let totalLightsFound = 0, totalCCTVsFound = 0;

        pathPoints.forEach(point => {
            const nearbyLights = streetlights.filter(l => calculateDistance(point.lat, point.lng, l.lat, l.lng) <= radius).length;
            const nearbyCCTVs = cctvData.filter(c => calculateDistance(point.lat, point.lng, c.WGSXPT, c.WGSYPT) <= radius).length;
            totalLightsFound += nearbyLights; totalCCTVsFound += nearbyCCTVs;
            totalSafetyScore += (nearbyCCTVs * 5) + (nearbyLights * 2);
        });
        const finalScore = Math.min(100, totalSafetyScore > 0 ? 80 + (totalSafetyScore % 20) : 0);
        res.status(200).json({ safetyScore: finalScore, cctvCount: totalCCTVsFound, lightCount: totalLightsFound, message: '완료' });
    } catch (error) { res.status(500).json({ error: '분석 오류' }); }
});

// =======================================================
//           C. 긴급 연락처 API
// =======================================================
app.post('/api/contacts', requireAuth, async (req, res) => {
    try {
        await db.collection('users').doc(req.uid).collection('emergency_contacts').add(req.body);
        res.status(201).json({ message: '등록 성공' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/contacts/:uid', async (req, res) => {
    try {
        const snap = await db.collection('users').doc(req.params.uid).collection('emergency_contacts').get();
        res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/contacts/delete', requireAuth, async (req, res) => {
    try {
        await db.collection('users').doc(req.body.uid).collection('emergency_contacts').doc(req.body.contactId).delete();
        res.json({ message: '삭제 성공' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// =======================================================
//           D. 위험 지역 신고 API
// =======================================================
app.post('/api/reports', requireAuth, async (req, res) => {
    const { uid, title, type, content, location } = req.body;
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        const userName = userDoc.exists ? userDoc.data().name : '익명';
        const newReport = {
            uid, writer: userName, title, type, content, location, likes: 0, comments: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            displayDate: new Date().toISOString().split('T')[0]
        };
        await db.collection('reports').add(newReport);
        res.status(201).json({ message: '성공' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports', async (req, res) => {
    try {
        const snapshot = await db.collection('reports').orderBy('createdAt', 'desc').get();
        const reports = snapshot.docs.map(doc => ({
            id: doc.id, ...doc.data(),
            createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
        }));
        res.status(200).json(reports);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/user/:uid', async (req, res) => {
    try {
        const snapshot = await db.collection('reports').where('uid', '==', req.params.uid).orderBy('createdAt', 'desc').get();
        const reports = snapshot.docs.map(doc => ({
            id: doc.id, ...doc.data(),
            createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
        }));
        res.status(200).json(reports);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// =======================================================
//           E. 사용자 프로필 API
// =======================================================
app.get('/api/users/:uid', async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.params.uid).get();
        if (!userDoc.exists) return res.status(404).json({ error: '사용자 없음' });
        
        const reportsSnapshot = await db.collection('reports').where('uid', '==', req.params.uid).get();
        const historySnapshot = await db.collection('users').doc(req.params.uid).collection('history').get();
        
        res.json({ 
            ...userDoc.data(),
            stats: {
                reportCount: reportsSnapshot.size,
                safeReturnCount: historySnapshot.size,
                usageTime: '12시간'
            }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:uid', requireAuth, async (req, res) => {
    const { name, phone, address, profileImage } = req.body;
    try {
        await db.collection('users').doc(req.params.uid).update({
            name, phone: phone || '', address: address || '', ...(profileImage && { profileImage }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ message: '수정 완료' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// =======================================================
//           F. 귀가 기록 & 즐겨찾기 API
// =======================================================
app.post('/api/history', requireAuth, async (req, res) => {
    try {
        await db.collection('users').doc(req.body.uid).collection('history').add({
            ...req.body, createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(201).json({ message: '기록 저장 성공' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/history/:uid', async (req, res) => {
    try {
        const snap = await db.collection('users').doc(req.params.uid).collection('history').orderBy('createdAt', 'desc').get();
        res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/favorites', requireAuth, async (req, res) => {
    try {
        await db.collection('users').doc(req.body.uid).collection('favorites').add({
            ...req.body, createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(201).json({ message: '즐겨찾기 저장 성공' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/favorites/:uid', async (req, res) => {
    try {
        const snap = await db.collection('users').doc(req.params.uid).collection('favorites').orderBy('createdAt', 'desc').get();
        res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/favorites/delete', requireAuth, async (req, res) => {
    try {
        await db.collection('users').doc(req.body.uid).collection('favorites').doc(req.body.favoriteId).delete();
        res.json({ message: '즐겨찾기 삭제 성공' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// =======================================================
//           G. 카카오 모빌리티 길찾기 API (3가지 경로 분석)
// =======================================================
app.post('/api/route/analyze', async (req, res) => {
    const { start, end } = req.body; 
    if (!start || !end) return res.status(400).json({ error: '좌표 누락' });

    try {
        console.log(`🚀 경로 분석 시작: (${start.lat},${start.lng}) -> (${end.lat},${end.lng})`);

        // 1. 3가지 경로 병렬 요청 (추천, 최단, 시간우선)
        const [safeRoute, shortestRoute, balancedRoute] = await Promise.all([
            getKakaoRoute(start, end, "RECOMMEND"), // 안전(추천)
            getKakaoRoute(start, end, "DISTANCE"),  // 최단(거리)
            getKakaoRoute(start, end, "TIME")       // 균형(시간)
        ]);

        // 2. 각 경로별 안전 점수 분석
        const safeStats = await analyzePath(safeRoute.path);
        const shortestStats = await analyzePath(shortestRoute.path);
        const balancedStats = await analyzePath(balancedRoute.path);

        // 3. 응답 데이터 구성
        const formatData = (route, stats) => ({
            path: route.path,
            distance: (route.distance / 1000).toFixed(1) + " km",
            time: Math.round(route.duration / 60) + "분",
            score: stats.score,
            cctv: stats.cctv,
            lights: stats.lights,
            reports: 0
        });

        res.json({
            safety: formatData(safeRoute, safeStats),
            shortest: formatData(shortestRoute, shortestStats),
            balanced: formatData(balancedRoute, balancedStats)
        });

    } catch (error) {
        console.error("경로 분석 실패:", error.message);
        res.status(500).json({ error: "경로를 찾을 수 없습니다." });
    }
});

// =======================================================
//           H. 단순 길찾기 API (지도에 선 그리기용)
// =======================================================
app.post('/api/route/directions', async (req, res) => {
    const { start, end } = req.body; 
    if (!start || !end) return res.status(400).json({ error: '좌표 누락' });

    try {
        const routeData = await getKakaoRoute(start, end, "RECOMMEND");
        res.json(routeData);
    } catch (error) {
        res.status(500).json({ error: "길찾기 실패" });
    }
});

// 실행
app.listen(port, () => console.log(`Server running on ${port}`));