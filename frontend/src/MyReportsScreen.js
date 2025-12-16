import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Edit2, MapPin, Clock, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from './config';

export default function MyReportsScreen({ userUid }) {
    const navigate = useNavigate();
    const [myReports, setMyReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // 수정 모달 관련 상태
    const [isEditing, setIsEditing] = useState(false);
    const [editTarget, setEditTarget] = useState(null); // 수정할 글 객체
    const [editForm, setEditForm] = useState({ title: '', content: '', type: 'danger' });

    const fetchMyReports = async () => {
        if (!userUid) return;
        try {
            const response = await axios.get(`${API_BASE_URL}/api/reports/user/${userUid}`);
            setMyReports(response.data);
        } catch (error) {
            console.error("내역 로드 실패:", error);
            toast.error("내역을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyReports();
    }, [userUid]);

    // 삭제 함수
    const handleDelete = async (reportId) => {
        if (!window.confirm("정말 이 신고를 삭제하시겠습니까?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/reports/${reportId}`, { data: { uid: userUid } });
            toast.success("삭제되었습니다.");
            fetchMyReports();
        } catch (error) { toast.error("삭제 실패"); }
    };

    // 수정 버튼 클릭 시 모달 열기
    const openEditModal = (report) => {
        setEditTarget(report);
        setEditForm({ title: report.title, content: report.content, type: report.type });
        setIsEditing(true);
    };

    // 수정 저장 함수
    const handleUpdate = async () => {
        if (!editForm.title || !editForm.content) return toast.error("내용을 입력해주세요.");
        try {
            await axios.put(`${API_BASE_URL}/api/reports/${editTarget.id}`, {
                uid: userUid,
                ...editForm
            });
            toast.success("수정되었습니다.");
            setIsEditing(false);
            setEditTarget(null);
            fetchMyReports(); // 목록 새로고침
        } catch (e) {
            toast.error("수정 실패");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-10">
            <header className="bg-white p-4 border-b border-gray-100 shadow-sm sticky top-0 z-10 flex items-center">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">내 신고 내역</h1>
            </header>

            <main className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
                ) : myReports.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>작성한 신고 내역이 없습니다.</p>
                        <Link to="/report-board" className="text-blue-500 font-bold mt-2 inline-block">신고하러 가기</Link>
                    </div>
                ) : (
                    myReports.map((report) => (
                        <div key={report.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group">
                            <div className="pr-16">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                        report.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                        {report.type === 'danger' ? '위험' : '주의'}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center"><Clock className="w-3 h-3 mr-1" /> {report.displayDate}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">{report.title}</h3>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{report.content}</p>
                                <div className="flex items-center text-xs text-gray-500"><MapPin className="w-3.5 h-3.5 mr-1" /> {report.location}</div>
                            </div>

                            {/* 수정 & 삭제 버튼 그룹 */}
                            <div className="absolute top-4 right-4 flex space-x-1">
                                <button onClick={() => openEditModal(report)} className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(report.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* 수정 모달 (팝업창) */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">신고 내용 수정</h3>
                            <button onClick={() => setIsEditing(false)}><X className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <div className="space-y-3">
                            <select 
                                value={editForm.type}
                                onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
                            >
                                <option value="danger">위험 (Danger)</option>
                                <option value="warning">주의 (Warning)</option>
                            </select>
                            <input 
                                type="text" 
                                value={editForm.title}
                                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold"
                                placeholder="제목"
                            />
                            <textarea 
                                value={editForm.content}
                                onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none h-32 resize-none"
                                placeholder="내용"
                            />
                            <button onClick={handleUpdate} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
                                수정 완료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}