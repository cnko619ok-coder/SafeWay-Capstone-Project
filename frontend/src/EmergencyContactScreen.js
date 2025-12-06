// frontend/src/EmergencyContactScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, Trash2, Plus, Users, AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router-dom'; 

const API_BASE_URL = 'https://ester-idealess-ceremonially.ngrok-free.dev'; 

const ContactItem = ({ contact, onDelete }) => (
  <div className="flex items-center justify-between p-4 bg-white border-b hover:bg-gray-50 transition-colors">
    <div className="flex items-center">
      <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3">
        {contact.name[0]}
      </div>
      <div>
        <div className="font-semibold text-gray-800">{contact.name}</div>
        <div className="text-sm text-gray-500">{contact.number} ({contact.relation || '지인'})</div> 
      </div>
    </div>
    <button onClick={() => onDelete(contact.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full transition" title="삭제">
      <Trash2 className="w-5 h-5" />
    </button>
  </div>
);

const AddContactModal = ({ isOpen, onClose, onSuccess, userUid }) => {
  const [formData, setFormData] = useState({ name: '', number: '', relation: '가족' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!userUid) return alert('❌ 사용자 인증 정보가 없습니다.');

    try {
      // ⚡️ 수정된 부분: { uid: userUid, ...formData }
      // 백엔드로 보낼 때 내 UID를 같이 보내야 401 에러가 안 납니다.
      await axios.post(`${API_BASE_URL}/api/contacts`, { 
        uid: userUid, // 👈 여기가 핵심입니다!
        ...formData 
      });
      
      alert('✅ 연락처가 성공적으로 추가되었습니다.');
      onSuccess();
      onClose();
    } catch (err) {
      // 에러 처리 코드...
      const statusCode = err.response ? err.response.status : '네트워크';
      alert(`❌ 연락처 추가 실패 (${statusCode} 에러)`);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4">새 연락처 추가</h2>
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <input type="text" name="name" placeholder="이름" required className="w-full p-2 border rounded" onChange={handleChange} />
          <input type="tel" name="number" placeholder="전화번호" required className="w-full p-2 border rounded" onChange={handleChange} />
          <input type="text" name="relation" placeholder="관계" value={formData.relation} className="w-full p-2 border rounded" onChange={handleChange} />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">취소</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">추가</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function EmergencyContactScreen({ userUid }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); 

  const fetchContacts = async () => {
    setError(null);
    if (!userUid) { setLoading(false); return; } 
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/contacts/${userUid}`);
      setContacts(response.data);
    } catch (err) { setError('목록 로드 실패'); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm("정말로 삭제하시겠습니까?")) return;

    try {
      // 🚨🚨🚨 쿼리 파라미터 방식 사용 (백엔드와 일치) 🚨🚨🚨
      await axios.delete(`${API_BASE_URL}/api/contacts`, {
        data: { 
          uid: userUid, 
          contactId: contactId 
        }
      }); 
      alert('✅ 연락처 삭제 성공!');
      fetchContacts(); 
    } catch (err) {
      alert(`❌ 삭제 실패: ${err.response?.data?.error || '서버 오류'}`);
      console.error(err);
    }
  };

  useEffect(() => {
    if (userUid) fetchContacts();
    else setLoading(false);
  }, [userUid]); 

  if (loading) return <div className="text-center p-8">로딩 중...</div>;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 border-b flex justify-between items-center shadow-sm">
        <Link to="/"><ChevronLeft className="w-6 h-6 text-gray-600" /></Link>
        <h1 className="text-xl font-bold">긴급 연락처</h1>
        <button onClick={() => setIsModalOpen(true)}><Plus className="w-6 h-6 text-blue-600" /></button>
      </header>
      {error && <div className="p-4 text-red-600 bg-red-100 m-4 rounded">{error}</div>}
      <div className="p-4 space-y-2">
        {contacts.map(contact => (
          <ContactItem key={contact.id} contact={contact} onDelete={handleDelete} />
        ))}
      </div>
      <AddContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchContacts} userUid={userUid} />
    </div>
  );
}