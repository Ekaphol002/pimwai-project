interface ExpBarProps {
  currentExp: number;
  maxExp: number;
  showText?: boolean;
  barColor?: string;
}

export default function ExpBar({ currentExp, maxExp, showText = true, barColor = "bg-[#5cb5db]" }: ExpBarProps) {
  // คำนวณเปอร์เซ็นต์
  const safeMax = Math.max(1, maxExp || 1);
  const percentage = Math.min(100, Math.max(0, (currentExp / safeMax) * 100));

  return (
    <div className="w-full select-none">
      {/* ตัวหลอด EXP (หลอดสีเทาชัดเจน ไม่มีเงา ไม่มีขอบ) */}
      <div className="w-full bg-gray-300 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
        <div
          className={`${barColor} h-full rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* ข้อความ EXP */}
      {showText && (
        <div className="text-center text-xs font-bold text-gray-500 mt-1.5 logo-font">
          {Math.floor(currentExp).toLocaleString()} / {Math.floor(safeMax).toLocaleString()} EXP
        </div>
      )}
    </div>
  );
}