"use client";
import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color: string; // เช่น "bg-yellow-100"
}

export default function StatCard({ icon, label, value, subValue, color }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-black text-gray-700">
          {value} <span className="text-sm font-medium text-gray-400">{subValue}</span>
        </h3>
      </div>
    </div>
  );
}