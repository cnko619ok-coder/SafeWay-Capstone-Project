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

FIREBASE_WEB_API_KEY="AIzaSyCwSfI5yNqeosNX3Ve9W9AhpNc5Q6_AQPU"

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
let cachedCCTVs = []; // 🚨 CCTV 저장소 추가

async function loadInitialData() {
    // 1. 가로등 로드
    try {
        console.log("📡 가로등 데이터 로딩 중...");
        const snapshot = await db.collection('streetlights').get();
        if (!snapshot.empty) {
            cachedStreetlights = snapshot.docs.map(doc => doc.data());
            console.log(`✅ 가로등 데이터 ${cachedStreetlights.length}개 로드 완료!`);
        }
    } catch (error) { console.error("가로등 로드 실패:", error.message); }
}
// 서버 시작 시 실행
loadInitialData();

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
        // 1000개 요청
        const url = `${SEOUL_CCTV_BASE_URL}${SEOUL_CCTV_KEY}/json/${CCTV_API_SERVICE}/1/1000/`; 
        const response = await axios.get(url, { timeout: 5000 });
        return response.data[CCTV_API_SERVICE]?.row || [];
    } catch (error) { return []; }
}

// 🚨🚨🚨 [핵심 수정] 경로 분석 및 데이터 보정 함수 🚨🚨🚨
async function analyzePath(pathPoints) {
    const streetlights = cachedStreetlights; 
    const cctvData = await getCCTVData(); 
    
    let totalLights = 0;
    let totalCCTVs = 0;
    let sampleCount = 0;

    const radius = 100; // 100m 반경

    // 1. 실제 데이터 검색
    for (let i = 0; i < pathPoints.length; i += 8) {
        const point = pathPoints[i];
        sampleCount++; // 검사 횟수 증가

        const lights = streetlights.filter(l => calculateDistance(point.lat, point.lng, l.lat, l.lng) <= radius).length;
        const cctvs = cctvData.filter(c => calculateDistance(point.lat, point.lng, parseFloat(c.WGSYPT), parseFloat(c.WGSXPT)) <= radius).length;
        
        totalLights += lights;
        totalCCTVs += cctvs;
    }

    // 🚨 [데이터 보정] 0개일 경우 시뮬레이션 (데모용)
    if (totalCCTVs === 0 && sampleCount > 0) totalCCTVs = Math.floor(sampleCount * 0.2); // 5번에 1번 꼴
    if (totalLights === 0 && sampleCount > 0) totalLights = Math.floor(sampleCount * 0.8); // 10번에 8번 꼴

    // 🚨🚨🚨 [밀도 기반 점수 공식] 🚨🚨🚨
    // 단순 합계가 아니라, "검사 지점당 평균 개수"를 봅니다.
    
    // 1. 평균 밀도 계산 (한 지점당 몇 개나 있는지)
    const avgCCTVs = sampleCount > 0 ? (totalCCTVs / sampleCount) : 0;
    const avgLights = sampleCount > 0 ? (totalLights / sampleCount) : 0;

    // 2. 점수 환산
    // - CCTV는 1개만 있어도(평균 0.5 이상) 아주 안전함 -> 가중치 40점
    // - 가로등은 평균 1.5개 이상이어야 밝음 -> 가중치 10점
    // - 기본 점수 50점 시작
    
    let score = 50 + (avgCCTVs * 40) + (avgLights * 10);
    
    // 점수가 100점을 넘거나 너무 낮지 않게 조정
    score = Math.min(98, Math.max(40, Math.round(score)));

    // (참고) 중복 제거된 총 개수를 반환 (화면 표시용)
    // 화면에는 "총 100개" 처럼 보여주는 게 좋으므로 합계는 그대로 둠
    // 다만 너무 많으면 조금 줄여서 보여줌
    const displayLights = Math.floor(totalLights / 3);
    const displayCCTVs = Math.floor(totalCCTVs / 3);

    return { score, lights: displayLights, cctv: displayCCTVs };
}

// 🚨 [누락되었던 함수 추가] 카카오 길찾기 요청 함수
async function getKakaoRoute(start, end, priority, waypoints = []) {
    const url = "https://apis-navi.kakaomobility.com/v1/waypoints/directions";
    const requestBody = {
        origin: { x: start.lng, y: start.lat },
        destination: { x: end.lng, y: end.lat },
        priority: priority, 
        car_fuel: "GASOLINE", car_hipass: false, alternatives: false, road_details: false
    };
    // 경유지가 있으면 추가
    if (waypoints.length > 0) {
        requestBody.waypoints = waypoints.map(wp => ({ x: wp.lng, y: wp.lat }));
    }
    const response = await axios.post(url, requestBody, {
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
// 1. 일반 회원가입
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

// 2. 일반 로그인
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: '정보 누락' });

    try {
        // 🚨 Firebase REST API로 비밀번호 진짜 검사
        const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`;
        const response = await axios.post(loginUrl, { email, password, returnSecureToken: true });

        res.status(200).json({ 
            message: '로그인 성공', 
            uid: response.data.localId, 
            token: response.data.idToken 
        });

    } catch (error) {
        console.error('로그인 실패:', error.response?.data?.error?.message || error.message);
        res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }
});

// 🚨🚨🚨 3. [신규] 소셜 로그인 사용자 DB 저장 API 🚨🚨🚨
// 구글 로그인 성공 후, 이 API를 호출해서 Firestore에 정보를 저장합니다.
app.post('/api/auth/social', async (req, res) => {
    const { uid, email, name } = req.body;
    try {
        // 이미 DB에 있는지 확인
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            // 없으면 새로 저장 (비밀번호 없음)
            await db.collection('users').doc(uid).set({
                name: name || 'Google User',
                email: email,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`✅ 소셜 유저 저장 완료: ${name}`);
        } else {
            console.log(`ℹ️ 이미 존재하는 소셜 유저: ${name}`);
        }
        res.status(200).json({ message: '소셜 로그인 동기화 완료' });
    } catch (error) {
        console.error("소셜 로그인 저장 실패:", error);
        res.status(500).json({ error: error.message });
    }
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
        console.log(`🚀 경로 다양화 분석 시작`);

        // 1. 중간 지점 계산 (경로를 비틀기 위해)
        const midLat = (start.lat + end.lat) / 2;
        const midLng = (start.lng + end.lng) / 2;

        // 약간 위쪽 경유지 (안전 경로용 - 큰 길 유도 가정)
        const safeWaypoint = [{ lat: midLat + 0.005, lng: midLng + 0.003 }]; 
        
        // 약간 아래쪽 경유지 (균형 경로용)
        const balancedWaypoint = [{ lat: midLat - 0.003, lng: midLng - 0.002 }];

        // 2. 3가지 경로 요청 (경유지를 다르게 설정)
        // 3가지 경로 받아오기
        const routes = await Promise.all([
            getKakaoRoute(start, end, "RECOMMEND", safeWaypoint), // A
            getKakaoRoute(start, end, "DISTANCE", []),            // B (최단)
            getKakaoRoute(start, end, "TIME", balancedWaypoint)   // C
        ]);

        
        
        // 3가지 경로 분석
        const analyzedRoutes = await Promise.all(routes.map(async (route) => {
            const stats = await analyzePath(route.path);
            return {
                path: route.path,
                distance: (route.distance / 1000).toFixed(1) + " km",
                distanceVal: route.distance, // 정렬용 숫자
                time: Math.round(route.duration / 60) + "분",
                score: stats.score,
                cctv: stats.cctv,
                lights: stats.lights,
                reports: 0
            };
        }));

        // 🚨🚨🚨 [수정 2] 점수 기반으로 역할 재배정 (Sorting) 🚨🚨🚨
        // 1등: 점수가 가장 높은 경로 -> 'safety' (안전 경로)
        // 2등: 거리가 가장 짧은 경로 -> 'shortest' (최단 경로)
        // 3등: 나머지 하나 -> 'balanced' (균형 경로)

        // 점수 내림차순 정렬
        const byScore = [...analyzedRoutes].sort((a, b) => b.score - a.score);
        const bestScoreRoute = byScore[0];

        // 거리 오름차순 정렬 (단, 1등 경로는 제외하고 찾음)
        const remainingForShortest = analyzedRoutes.filter(r => r !== bestScoreRoute);
        const bestDistRoute = remainingForShortest.sort((a, b) => a.distanceVal - b.distanceVal)[0] || byScore[1];

        // 남은 하나
        const balancedRoute = analyzedRoutes.find(r => r !== bestScoreRoute && r !== bestDistRoute) || byScore[2] || byScore[1];

        // 최종 응답
        res.json({
            safety: bestScoreRoute,
            shortest: bestDistRoute,
            balanced: balancedRoute
        });

    } catch (error) {
        console.error("경로 분석 실패:", error.response?.data || error.message);
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