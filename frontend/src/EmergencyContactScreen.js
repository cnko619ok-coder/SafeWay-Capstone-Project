// frontend/src/EmergencyContactScreen.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Phone, User, Calendar, ArrowDownAZ,X } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev';

export default function EmergencyContactScreen({ userUid }) {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // 🚨 정렬 상태 ('latest': 최신순, 'name': 이름순)
    const [sortType, setSortType] = useState('latest');

    const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });

    // 연락처 불러오기
    useEffect(() => {
        if (userUid) fetchContacts();
    }, [userUid]);

    const fetchContacts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/contacts/${userUid}`);
            setContacts(response.data);
        } catch (error) {
            console.error(error);
            toast.error("연락처를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 추가
    const handleAdd = async () => {
        if (!newContact.name || !newContact.phone) return toast.error("이름과 번호를 입력해주세요.");
        try {
            await axios.post(`${API_BASE_URL}/api/contacts`, { 
                uid: userUid, 
                ...newContact,
                createdAt: new Date().toISOString() // 정렬을 위해 생성 시간 추가
            });
            toast.success("연락처가 추가되었습니다.");
            setShowAddModal(false);
            setNewContact({ name: '', phone: '', relation: '' });
            fetchContacts();
        } catch (error) {
            toast.error("추가 실패");
        }
    };

    // 삭제
    const handleDelete = async (id) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await axios.post(`${API_BASE_URL}/api/contacts/delete`, { uid: userUid, contactId: id });
            toast.success("삭제되었습니다.");
            fetchContacts();
        } catch (error) {
            toast.error("삭제 실패");
        }
    };

    // 🚨🚨🚨 [핵심] 정렬 로직 함수 🚨🚨🚨
    const getSortedContacts = () => {
        const sorted = [...contacts]; // 원본 보호를 위해 복사
        
        if (sortType === 'latest') {
            // 최신순 (등록일 내림차순)
            sorted.sort((a, b) => {
                // Firestore Timestamp 객체거나 문자열일 수 있으므로 처리
                const dateA = a.createdAt ? new Date(a.createdAt.seconds ? a.createdAt.seconds * 1000 : a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt.seconds ? b.createdAt.seconds * 1000 : b.createdAt) : new Date(0);
                return dateB - dateA;
            });
        } else {
            // 이름순 (가나다순)
            sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        }
        return sorted;
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* 헤더 */}
            <header className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800">긴급 연락처</h1>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)} 
                    className="flex items-center text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition"
                >
                    <Plus className="w-4 h-4 mr-1" /> 추가
                </button>
            </header>

            <main className="p-5 pb-24">
                
                {/* 🚨 정렬 필터 버튼 */}
                <div className="flex justify-end mb-4">
                    <div className="bg-white p-1 rounded-xl border border-gray-200 inline-flex shadow-sm">
                        <button 
                            onClick={() => setSortType('latest')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sortType === 'latest' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            최신순
                        </button>
                        <button 
                            onClick={() => setSortType('name')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center ${sortType === 'name' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <ArrowDownAZ className="w-3 h-3 mr-1" /> 이름순
                        </button>
                    </div>
                </div>

                {/* 연락처 리스트 */}
                {loading ? (
                    <p className="text-center text-gray-400 mt-10">로딩 중...</p>
                ) : contacts.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
                        <User className="w-12 h-12 mb-2 opacity-20" />
                        <p>등록된 연락처가 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* 🚨 정렬된 리스트(getSortedContacts)를 맵핑 */}
                        {getSortedContacts().map((contact) => (
                            <div key={contact.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group active:scale-[0.99] transition-transform">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg mr-4 shadow-inner">
                                        {contact.name[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-800">{contact.name}</h3>
                                            {contact.relation && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">{contact.relation}</span>}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5 flex items-center"><Phone className="w-3 h-3 mr-1"/> {contact.phone}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(contact.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 🚨🚨🚨 [수정됨] 모달 위치 및 스타일 개선 🚨🚨🚨 */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up relative">
                        {/* 닫기 버튼 */}
                        <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"><X className="w-6 h-6" /></button>
                        
                        <h2 className="text-xl font-bold mb-5 text-gray-800">새 연락처 추가</h2>
                        <div className="space-y-4">
                            <div><label className="block text-xs text-gray-500 font-bold mb-1 ml-1">이름</label><input className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 transition-colors" placeholder="예: 홍길동" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} /></div>
                            <div><label className="block text-xs text-gray-500 font-bold mb-1 ml-1">전화번호</label><input className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 transition-colors" placeholder="010-0000-0000" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} /></div>
                            <div><label className="block text-xs text-gray-500 font-bold mb-1 ml-1">관계 (선택)</label><input className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 transition-colors" placeholder="예: 가족" value={newContact.relation} onChange={e => setNewContact({...newContact, relation: e.target.value})} /></div>
                        </div>
                        <button onClick={handleAdd} className="w-full mt-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition active:scale-95">저장하기</button>
                    </div>
                </div>
            )}
        </div>
    );
}