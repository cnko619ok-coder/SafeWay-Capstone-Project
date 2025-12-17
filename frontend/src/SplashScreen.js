import React, { useEffect } from 'react';
import { Shield, MapPin, Heart } from 'lucide-react';
import { motion } from 'framer-motion'; 

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2800); // 2.8초 후 종료

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden relative">
      {/* 배경 애니메이션 원 */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-80 h-80 bg-white/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col items-center">
        {/* 로고 컨테이너 */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            duration: 0.8,
          }}
          className="mb-8"
        >
          <div className="relative">
            {/* 방패 아이콘과 빛나는 효과 */}
            <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full" />
            <div className="relative bg-white p-8 rounded-3xl shadow-2xl">
              <Shield className="h-24 w-24 text-blue-600" strokeWidth={2.5} />
              <motion.div
                className="absolute -bottom-2 -right-2 bg-gradient-to-br from-cyan-400 to-blue-500 p-2 rounded-full shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
              >
                <MapPin className="h-6 w-6 text-white" fill="white" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* 앱 이름 애니메이션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center"
        >
          <h1
            className="text-5xl text-white mb-2 tracking-tight"
            style={{ fontWeight: 800 }}
          >
            SafeWay
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-xl text-white/90 flex items-center gap-2 justify-center"
            style={{ fontWeight: 500 }}
          >
            안전한 귀가를 함께
            <Heart className="h-5 w-5 text-red-300 fill-red-300 inline-block" />
          </motion.p>
        </motion.div>

        {/* 로딩 점 애니메이션 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex gap-2 mt-12"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>

        {/* 하단 문구 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="text-white/70 text-sm mt-8 text-center px-6"
        >
          당신의 안전한 밤길을 지켜드립니다
        </motion.p>
      </div>

      {/* 하단 장식 아이콘들 */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 px-2 w-full"
      >
        {/* 1. 안전경로 */}
        <div className="flex items-center gap-1 text-white/60 text-xs whitespace-nowrap">
          <Shield className="h-4 w-4" />
          <span>안전경로</span>
        </div>

        {/* 2. 실시간추적 (위험공유) */}
        <div className="flex items-center gap-1 text-white/60 text-xs whitespace-nowrap">
          <MapPin className="h-4 w-4" />
          <span>실시간추적</span>
        </div>

        {/* 3. 긴급연락 (SOS) */}
        <div className="flex items-center gap-1 text-white/60 text-xs whitespace-nowrap">
          <Heart className="h-4 w-4" />
          <span>긴급연락</span>
        </div>
      </motion.div>
    </div>
  );
}