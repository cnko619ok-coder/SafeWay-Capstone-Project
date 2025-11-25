import React from 'react';
// 패키지 사용: 이 패키지가 SDK 로드를 자동으로 관리합니다.
import { Map, MapMarker } from 'react-kakao-maps-sdk'; 

// 이전에 확인된 JavaScript 키를 직접 사용합니다.
const KAKAO_APP_KEY = '15b6d60e4095cdc453d99c4883ad6e6d'; 

const MapComponent = () => {
    
    return (
        <Map
            // 초기 중심 좌표: 서울 시청 근처
            center={{ lat: 37.566826, lng: 126.9786567 }} 
            // 지도가 보일 수 있도록 크기 지정
            style={{ width: "100%", height: "500px" }}
            level={3}
            // 발급받은 JavaScript 키 전달
            appkey={KAKAO_APP_KEY} 
            // 로컬 환경 문제 해결을 위해 모든 SDK 로드 옵션을 패키지에 맡깁니다.
        >
            {/* 마커 추가 (테스트) */}
            <MapMarker 
                position={{ lat: 37.566826, lng: 126.9786567 }} 
                title="서울 시청"
            />
        </Map>
    );
};

export default MapComponent;