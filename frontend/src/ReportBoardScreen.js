import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    ArrowLeft, Plus, MapPin, ThumbsUp, MessageSquare, X, 
    Search, ArrowDownUp 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_BASE_URL } from './config';


export default function ReportBoardScreen({ userUid }) {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 검색 및 정렬 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('latest'); // 'latest' | 'relevance'

    // 1. 신고 목록 불러오기 (GET)
    const fetchReports = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/reports`);
            setReports(response.data);
        } catch (error) {
            console.error("목록 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    // 화면이 켜지면 목록 불러오기
    useEffect(() => {
        fetchReports();
    }, []);

    // 검색 및 정렬 로직 함수
    const getProcessedReports = () => {
        // 1. 검색어 필터링
        let filtered = reports.filter(report => {
            if (!searchTerm) return true; // 검색어 없으면 다 보여줌
            const keyword = searchTerm.toLowerCase();
            const title = report.title?.toLowerCase() || '';
            const content = report.content?.toLowerCase() || '';
            const location = report.location?.toLowerCase() || '';
            // 제목, 내용, 위치 중 하나라도 키워드가 있으면 통과
            return title.includes(keyword) || content.includes(keyword) || location.includes(keyword);
        });

        // 2. 정렬 (최신순 vs 정확도순)
        filtered.sort((a, b) => {
            // 날짜 변환 (Firestore Timestamp 처리)
            const getDate = (r) => r.createdAt ? new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt) : new Date(0);

            if (sortBy === 'latest') {
                return getDate(b) - getDate(a); // 최신순 (내림차순)
            } else if (sortBy === 'relevance' && searchTerm) {
                // 정확도순: 제목에 포함되면 2점, 내용에 포함되면 1점
                const keyword = searchTerm.toLowerCase();
                const scoreA = (a.title?.toLowerCase().includes(keyword) ? 2 : 0) + 
                               (a.content?.toLowerCase().includes(keyword) ? 1 : 0);
                const scoreB = (b.title?.toLowerCase().includes(keyword) ? 2 : 0) + 
                               (b.content?.toLowerCase().includes(keyword) ? 1 : 0);

                if (scoreA !== scoreB) return scoreB - scoreA; // 점수 높은 순
                return getDate(b) - getDate(a); // 점수 같으면 최신순
            }
            return 0;
        });

        return filtered;
    };

    // 최종적으로 화면에 보여줄 데이터
    const finalReports = getProcessedReports();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-24">
            {/* 상단 헤더 */}
            <header className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">위험 지역 신고</h1>
                    </div>
                </div>

                {/* 검색창 및 정렬 버튼 영역 */}
                <div className="px-4 pb-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            placeholder="지역명, 내용으로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-bold text-gray-500 ml-1">
                            총 <span className="text-blue-600">{finalReports.length}</span>건
                        </span>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setSortBy('latest')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${sortBy === 'latest' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                            >
                                최신순
                            </button>
                            <button 
                                onClick={() => {
                                    if(!searchTerm) alert('검색어를 먼저 입력해주세요'); 
                                    else setSortBy('relevance');
                                }}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${sortBy === 'relevance' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                <ArrowDownUp className="w-3 h-3" /> 정확도
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* 메인 리스트 영역 */}
            <main className="flex-grow p-4 space-y-4 overflow-y-auto">
                {loading ? (
                    <div className="text-center p-10 text-gray-500">로딩 중...</div>
                ) : finalReports.length === 0 ? (
                    <div className="text-center p-10 text-gray-400">
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>{searchTerm ? "검색 결과가 없습니다." : "등록된 신고가 없습니다."}</p>
                    </div>
                ) : (
                    finalReports.map((report) => (
                        <Link 
                            to={`/report-board/${report.id}`} 
                            key={report.id} 
                            className="block bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98]"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                        report.type === 'danger' ? 'bg-red-100 text-red-600' : 
                                        report.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
                                        'bg-green-100 text-green-600'
                                    }`}>
                                        {report.type === 'danger' ? '위험' : report.type === 'warning' ? '주의' : '안전'}
                                    </span>
                                    <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{report.title}</h3>
                                </div>
                                <span className="text-xs text-gray-400">{report.displayDate}</span>
                            </div>

                            <div className="flex items-center text-gray-500 text-sm mb-3">
                                <MapPin className="w-4 h-4 mr-1" />
                                {report.location} <span className="mx-2 text-gray-300">|</span> {report.writer}
                            </div>

                            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                                {report.content}
                            </p>

                            <div className="flex items-center space-x-4 border-t pt-3">
                                <span className="flex items-center text-gray-500 text-sm">
                                    <ThumbsUp className="w-4 h-4 mr-1.5" /> 좋아요 {report.likes || 0}
                                </span>
                                <span className="flex items-center text-gray-500 text-sm">
                                    <MessageSquare className="w-4 h-4 mr-1.5" /> 댓글 {report.comments || 0}
                                </span>
                            </div>
                        </Link>
                    ))
                )}
            </main>

            {/* 글쓰기 버튼 (기존 유지) */}
            <button 
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-24 right-6 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition-transform active:scale-95 z-20 flex items-center justify-center"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* 글쓰기 모달 (기존 유지) */}
            {isModalOpen && (
                <AddReportModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={fetchReports} 
                    userUid={userUid} 
                />
            )}
        </div>
    );
}

// 신고 등록 모달 
function AddReportModal({ isOpen, onClose, onSuccess, userUid }) {
    const [formData, setFormData] = useState({ title: '', type: 'danger', content: '', location: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userUid) return alert("로그인이 필요합니다. 다시 로그인해주세요.");

        try {
            await axios.post(`${API_BASE_URL}/api/reports`, {
                uid: userUid,
                ...formData
            });
            alert("신고가 등록되었습니다.");
            onSuccess();
            onClose();
        } catch (error) {
            alert("등록 실패: " + (error.response?.data?.error || error.message));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                <h2 className="text-xl font-bold mb-6 text-gray-800">새 신고 등록</h2>
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                        <input type="text" required placeholder="어떤 위험인가요?" className="w-full p-3 border rounded-xl"
                            onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                        <input type="text" required placeholder="위치를 입력해주세요 (예: 강남역 10번 출구)" className="w-full p-3 border rounded-xl"
                            onChange={e => setFormData({...formData, location: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                        <div className="flex space-x-2">
                            {['danger', 'warning', 'safe'].map(t => (
                                <button type="button" key={t} 
                                    className={`flex-1 py-2 border rounded-lg text-sm font-bold ${formData.type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}
                                    onClick={() => setFormData({...formData, type: t})}>
                                    {t === 'danger' ? '위험' : t === 'warning' ? '주의' : '안전'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                        <textarea required rows="3" placeholder="상세 내용을 적어주세요" className="w-full p-3 border rounded-xl resize-none"
                            onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
                    </div>
                    
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
                        등록하기
                    </button>
                </form>
            </div>
        </div>
    );
}