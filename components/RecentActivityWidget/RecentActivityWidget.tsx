"use client";

import React from 'react';
import { History, Zap, Star, BookOpen } from 'lucide-react';

interface ActivityItem {
    id: string;
    type: 'lesson' | 'test';
    title: string;
    wpm: number;
    accuracy: number;
    stars: number;
    date: string;
}

interface Props {
    activities: ActivityItem[];
}

export default function RecentActivityWidget({ activities }: Props) {
  
  // ฟังก์ชันแปลงวันที่เป็น "2 hours ago" แบบง่ายๆ
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHrs / 24);

    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHrs < 24) return `${diffHrs} ชั่วโมงที่แล้ว`;
    return `${diffDays} วันที่แล้ว`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-gray-800">ประวัติล่าสุด</h3>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
            <div className="text-center text-gray-400 py-4">ยังไม่มีประวัติการฝึกฝน</div>
        ) : (
            activities.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                    {/* ✅ แก้ไข: w-15 -> w-10 เพื่อให้เป็นวงกลม และเพิ่ม fill="currentColor" ที่ไอคอน */}
                    <div className={`w-10 h-10 rounded-full flex items-center ${item.type === 'lesson' ? 'text-[#5cb5db]' : 'text-yellow-600'}`}>
                        {item.type === 'lesson' 
                            ? <BookOpen size={20} fill="currentColor" /> 
                            : <Zap size={18} fill="currentColor" />
                        }
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-700 line-clamp-1">{item.title}</p>
                        <p className="text-xs text-gray-400">{timeAgo(item.date)}</p>
                    </div>
                </div>
                
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                         {/* ถ้าเป็น Lesson โชว์ดาว, ถ้าเป็น Test โชว์ WPM */}
                         {item.type === 'lesson' ? (
                            <span className="flex items-center text-xs font-bold text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-full">
                                {item.stars} <Star size={10} className="ml-0.5 fill-yellow-500" />
                            </span>
                         ) : (
                            <span className="text-xs font-bold text-[#5cb5db] bg-blue-50 px-2 py-1 rounded-full ">
                                {item.wpm}wpm
                            </span>
                         )}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 font-medium">
                        Acc: {item.accuracy}%
                    </div>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
}