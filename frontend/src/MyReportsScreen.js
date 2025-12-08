// frontend/src/MyReportsScreen.js

import React from 'react';
import { ArrowLeft, MapPin, Calendar, MessageSquare, ThumbsUp } from 'lucide-react';
import { Link } from 'react-router-dom';

// 🚨 임시 데이터 (나중에 DB에서 내 글만 불러오도록 수정)
const MY_DUMMY_REPORTS = [
    { id: 1, type: 'danger', title: '가로등 고장 신고합니다', location: '역삼동 123-4', date: '2025.10.01', status: '처리중', likes: 5 },
    { id: 2, type: 'warning', title: '보도블럭 파손 주의', location: '서초동 55번지', date: '2025.09.28', status: '완료', likes: 12 },
];

export default function MyReportsScreen() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white p-4 border-b shadow-sm flex items-center sticky top-0 z-10">
                <Link to="/profile" className="mr-4 text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">내 신고 내역</h1>
            </header>

            <main className="p-4 space-y-4">
                {MY_DUMMY_REPORTS.map((report) => (
                    <div key={report.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                report.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                                {report.type === 'danger' ? '위험' : '주의'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                report.status === '완료' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'
                            }`}>
                                {report.status}
                            </span>
                        </div>
                        
                        <h3 className="font-bold text-gray-800 text-lg mb-1">{report.title}</h3>
                        
                        <div className="flex items-center text-gray-500 text-sm mb-3">
                            <MapPin className="w-3 h-3 mr-1" /> {report.location}
                            <span className="mx-2">|</span>
                            <Calendar className="w-3 h-3 mr-1" /> {report.date}
                        </div>

                        <div className="border-t pt-3 flex text-sm text-gray-400 space-x-3">
                            <span className="flex items-center"><ThumbsUp className="w-4 h-4 mr-1"/> {report.likes}</span>
                            <span className="flex items-center"><MessageSquare className="w-4 h-4 mr-1"/> 0</span>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
}