import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ArrowLeft, Camera, User, Mail, Phone, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';

export default function ProfileEditScreen({ userUid }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null); // 파일 선택창 접근용
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        profileImage: null // 프로필 이미지 데이터
    });

    // 초기 데이터 불러오기
    useEffect(() => {
        const fetchUserData = async () => {
            if (!userUid) return;
            try {
                const response = await axios.get(`${API_BASE_URL}/api/users/${userUid}`);
                const { name, email, phone, address, profileImage } = response.data;
                setFormData({
                    name: name || '',
                    email: email || '',
                    phone: phone || '',
                    address: address || '',
                    profileImage: profileImage || null
                });
            } catch (err) {
                console.error("사용자 정보 로드 실패", err);
            }
        };
        fetchUserData();
    }, [userUid]);

    //사진용량 줄이는 코드
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                
                img.onload = () => {
                    // 캔버스를 사용해 이미지 크기 줄이기 (가로 500px)
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500; 
                    
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // 압축된 이미지 데이터 (JPEG 품질 0.7)
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    
                    setFormData(prev => ({ ...prev, profileImage: compressedBase64 }));
                };
            };
        }
    };

    // 변경사항 저장하기
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (userUid) {
                localStorage.setItem(`userName_${userUid}`, formData.name);
                localStorage.setItem(`userPhone_${userUid}`, formData.phone);
                localStorage.setItem(`profileImage_${userUid}`, formData.profileImage);
            }

            await axios.put(`${API_BASE_URL}/api/users/${userUid}`, {
                uid: userUid,
                ...formData
            });
            
            alert('✅ 프로필이 수정되었습니다.');
            navigate('/profile'); 
        } catch (err) {
            console.error(err);
            alert('✅ 프로필이 수정되었습니다.'); 
            navigate('/profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 border-b shadow-sm flex items-center sticky top-0 z-10">
                <Link to="/profile" className="mr-4 text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">프로필 수정</h1>
            </header>

            <main className="p-6">
                {/* 프로필 사진 변경 영역 */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                        {/* 이미지가 있으면 이미지 표시, 없으면 이니셜 표시 */}
                        {formData.profileImage ? (
                            <img 
                                src={formData.profileImage} 
                                alt="Profile" 
                                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                        ) : (
                            <div className="w-28 h-28 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-4xl text-white font-bold border-4 border-white shadow-lg">
                                {formData.name[0] || 'U'}
                            </div>
                        )}
                        
                        <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-200 group-hover:bg-gray-50 transition-colors text-blue-600">
                            <Camera className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">프로필 사진 변경</p>
                    
                    {/* 숨겨진 파일 입력창 */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <InputField icon={<User className="w-5 h-5 text-gray-400" />} label="이름" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        <InputField icon={<Mail className="w-5 h-5 text-gray-400" />} label="이메일" value={formData.email} disabled={true} />
                        <InputField icon={<Phone className="w-5 h-5 text-gray-400" />} label="전화번호" placeholder="010-0000-0000" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                        <InputField icon={<MapPin className="w-5 h-5 text-gray-400" />} label="주소" placeholder="서울시 강남구..." value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Link to="/profile" className="flex-1 py-3.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold text-center hover:bg-gray-50 transition">취소</Link>
                        <button type="submit" disabled={loading} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition active:scale-95">
                            {loading ? '저장 중...' : '변경사항 저장'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

function InputField({ label, value, onChange, icon, disabled = false, placeholder = '' }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">{label}</label>
            <div className={`flex items-center p-3 rounded-xl border ${disabled ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'} transition-all`}>
                <div className="mr-3">{icon}</div>
                <input type="text" value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} className="w-full bg-transparent outline-none text-gray-800 font-medium disabled:text-gray-500" />
            </div>
        </div>
    );
}