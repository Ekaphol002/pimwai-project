import React from 'react';
import { Play } from 'lucide-react';

export default function TestsLoading() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <div className="w-full max-w-5xl mx-auto px-6 pt-10 pb-10 space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-700 tracking-tight">ทดสอบความเร็ว</h1>
          <p className="text-gray-500 text-base font-medium">วัดระดับความเร็วและความแม่นยำของคุณในเวลาที่กำหนด</p>
        </div>
        <hr className="border-gray-600" />

        {/* กล่องหลักสีฟ้า #5cb5db เหมือนหน้าจริง 100% */}
        <div className="w-full bg-[#5cb5db] rounded-3xl p-8 shadow-lg flex flex-col gap-6">
          {/* แถวปุ่มเลือกเวลา + ปุ่มเริ่มเลย */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="bg-white p-1 rounded-xl flex items-center">
              <div className="px-6 py-1 rounded-lg font-bold text-xl bg-[#5cb5db] text-white shadow-sm">
                1 นาที
              </div>
              <div className="px-6 py-1 rounded-lg font-bold text-xl text-[#5cb5db]">
                3 นาที
              </div>
              <div className="px-6 py-1 rounded-lg font-bold text-xl text-[#5cb5db]">
                5 นาที
              </div>
            </div>

            <div className="bg-[#facc15] text-yellow-900 text-2xl font-bold px-10 py-2 rounded-xl shadow-md flex items-center gap-2">
              <span>เริ่มเลย!!!</span>
              <Play className="fill-yellow-900" />
            </div>
          </div>

          {/* กล่องรูปรถ + กล่องกราฟ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl h-60 border-8 border-white shadow-sm flex flex-col justify-between p-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-7 w-36 bg-gray-200 rounded-lg" />
                <div className="h-8 w-28 bg-gray-200 rounded-lg" />
              </div>
              <div className="h-16 w-48 bg-gray-200 rounded-xl mx-auto mb-4" />
            </div>

            <div className="bg-white rounded-2xl p-4 flex flex-col h-60 shadow-sm animate-pulse">
              <div className="h-6 w-28 bg-gray-200 rounded-md mb-4" />
              <div className="flex-1 bg-gray-100 rounded-xl" />
            </div>
          </div>

          {/* กราฟปุ่มที่มีปัญหา (ProblemKeyChart) */}
          <div className="bg-white rounded-2xl p-6 h-56 shadow-sm flex flex-col gap-4 animate-pulse">
            <div className="h-6 w-56 bg-gray-200 rounded-md" />
            <div className="flex-1 bg-gray-100 rounded-xl" />
          </div>

          {/* ประวัติการทดสอบ (TestHistoryList) */}
          <div className="bg-white rounded-2xl p-6 space-y-3 shadow-sm animate-pulse">
            <div className="h-6 w-44 bg-gray-200 rounded-md mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
