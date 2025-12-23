"use client";
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function WeakKeysWidget() {
  // (1) Mock Data (ลองเพิ่มข้อมูลให้เกิน 4 ตัว เพื่อทดสอบการขึ้นบรรทัดใหม่)
  const weakKeys = [
    { key: 'ข', count: 15 },
    { key: 'ฃ', count: 12 },
    { key: 'ฮ', count: 8 },
    { key: 'ฅ', count: 6 },
    { key: 'ฒ', count: 4 }, // ตัวที่ 5 จะตกลงมาบรรทัดใหม่
    { key: 'ฬ', count: 2 }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
      
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-red-500" size={20} />
        <h3 className="font-bold text-gray-700">ปุ่มที่ควรฝึกเพิ่ม</h3>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">คุณมักจะพิมพ์ผิดที่ปุ่มเหล่านี้บ่อยๆในบทเรียน</p>
      
      {/* (2) แก้ไข: ใช้ grid-cols-4 เพื่อบังคับแถวละ 4 ปุ่ม */}
      <div className="grid grid-cols-4 gap-2">
        {weakKeys.map((item) => (
          <div 
            key={item.key} 
            className="flex flex-col items-center justify-center bg-red-50 border-2 border-red-100 rounded-xl text-red-500 py-3 hover:bg-red-100 transition-colors cursor-default"
          >
            {/* ตัวอักษร */}
            <span className="font-bold text-xl leading-none mb-1">{item.key}</span>
            
            {/* จำนวนครั้ง */}
            <span className="text-[10px] font-medium text-red-400 bg-white/50 px-1.5 rounded-full whitespace-nowrap">
              {item.count} ครั้ง
            </span>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-2.5 rounded-xl bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition-colors">
        ฝึกเน้นปุ่มเหล่านี้
      </button>

    </div>
  );
}