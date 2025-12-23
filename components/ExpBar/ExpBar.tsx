interface ExpBarProps {
  currentExp: number;
  maxExp: number;
}

export default function ExpBar({ currentExp, maxExp }: ExpBarProps) {
  // คำนวณเปอร์เซ็นต์
  const percentage = (currentExp / maxExp) * 100;

  return (
    <div className="w-full">
      {/* ตัวหลอด EXP */}
      <div className="w-full bg-gray-300 rounded-full h-2.5">
        <div
          className="bg-[#5cb5db] h-2.5 rounded-full"
          style={{ width: `${percentage}%` }} // <-- ควบคุมความกว้างจาก %
        ></div>
      </div>
      {/* ข้อความ EXP */}
      <div className="text-center text-xs font-semibold text-gray-500 mt-1">
        {currentExp}/{maxExp} EXP
      </div>
    </div>
  );
}