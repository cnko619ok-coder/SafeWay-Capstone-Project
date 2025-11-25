import React, { useEffect, useRef, useState } from 'react';

const MapComponent = () => {
    // 지도가 삽입될 DOM 요소에 접근하기 위한 ref
    const mapRef = useRef(null); 
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    useEffect(() => {
        // ref가 DOM 요소를 가리킬 때만 실행 (요소가 화면에 렌더링 되었을 때)
        if (mapRef.current) {
            
            const checkKakaoMaps = () => {
                // 🚨 SDK가 로드되었는지 확인하는 가장 확실한 로직
                if (window.kakao && window.kakao.maps) {
                    
                    setIsMapLoaded(true); 

                    const options = {
                        // 초기 중심 좌표: 서울 시청 근처
                        center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
                        level: 3, 
                    };
                    
                    // 지도 생성
                    new window.kakao.maps.Map(mapRef.current, options);
                    console.log('✅ Kakao Map initialized successfully!');
                    
                } else {
                    // 로드될 때까지 50ms 후 다시 확인
                    setTimeout(checkKakaoMaps, 50); 
                }
            };

            checkKakaoMaps(); // 대기 시작
        }

    }, [mapRef.current]);

    return (
        <div 
            id="map" // id는 이제 필요 없지만, 이전에 사용하던 것 유지
            ref={mapRef} 
            style={{ width: "100%", height: "500px", border: "1px solid #ccc" }}
        >
            {!isMapLoaded && "지도 로딩 중..."}
        </div>
    );
};

export default MapComponent;