import React from 'react';
import { Star } from 'lucide-react';

export default function LessonsLoading() {
  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;

  return (
    <div className="flex flex-col w-full max-w-screen-2xl mx-auto mb-10">
      {/* 1. LessonMenuBar Skeleton (ตรงกับโครงสร้างจริง 100%) */}
      <nav className="w-full bg-white h-20 z-20 relative">
        <div className="max-w-screen-2xl h-full flex items-center justify-between pl-11 pr-6 mx-auto">
          {/* ส่วนซ้าย: เมนู Tabs */}
          <div className="flex items-center relative h-full">
            <div className="relative flex items-end justify-center px-10 h-20 font-bold pb-2 text-white z-10">
              <div className="absolute bottom-0 inset-x-0 h-4/6 bg-[#5cb5db] rounded-t-2xl -z-10" />
              <span className="scale-125">ระดับเริ่มต้น</span>
            </div>
            <div className="flex items-end justify-center px-10 h-20 font-bold pb-2 text-gray-800 z-10">
              <span>ระดับกลาง</span>
            </div>
            <div className="flex items-end justify-center px-10 h-20 font-bold pb-2 text-gray-800 z-10">
              <span>ระดับสูง</span>
            </div>
          </div>

          {/* ส่วนขวา: Quests & Circular Progress */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3 border-2 border-gray-200 rounded-full p-2 px-4 h-14">
              {[1, 2, 3].map((i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="h-3.5 w-32 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-2.5 w-16 bg-gray-100 rounded-md animate-pulse" />
                  </div>
                  {i < 3 && <div className="w-[2px] h-10 bg-gray-200 rounded-full mx-1" />}
                </React.Fragment>
              ))}
            </div>

            <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
              <svg className="transform -rotate-90 w-full h-full">
                <circle cx="50%" cy="50%" r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[8px] text-gray-500 font-semibold leading-tight">ภารกิจ</span>
                <span className="text-xl font-bold text-[#5cb5db] leading-none mt-0.5">0/3</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Main Body: LessonList (ซ้าย) + TodayStats (ขวา) */}
      <div className="flex">
        {/* ซ้าย: กล่องสีฟ้า LessonList */}
        <div className="container mx-auto space-y-8">
          <div className="w-[90%] bg-[#5cb5db] rounded-b-lg p-6 pt-1 text-white shadow-xl text-left font-logo ml-11">
            <hr className="border-1 mt-4 mb-4" />

            <div className="mb-4">
              <h1 className="text-2xl font-bold">
                แบบฝึกหัด - ระดับเริ่มต้น — บทเรียนฝึกพิมพ์สัมผัส 10 นิ้ว
              </h1>
              <p className="text-xs sm:text-sm text-white/90 font-medium mt-1">
                ฝึกวางนิ้วตามหลักการพิมพ์สัมผัสตั้งแต่แป้นเหย้า (ฟ ห ก ด ่ า ส ว) แป้นบน แป้นล่าง สระ และวรรณยุกต์อย่างเป็นระบบ
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5, 6].map((order) => (
                <div
                  key={order}
                  className="flex flex-col gap-3 rounded-lg p-6 px-3 bg-white text-gray-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-gray-300 text-gray-400">
                        {order}
                      </div>
                      <div className="flex-1">
                        <div className="h-6 w-48 sm:w-64 bg-gray-200 rounded-md animate-pulse" />
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                  </div>

                  {/* แถบย่อย SubLesson Bars ด้านล่างของการ์ดแต่ละบท */}
                  <div className="flex gap-1.5 pt-2 h-3 items-end">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => (
                      <div
                        key={bar}
                        className="flex-1 h-1.5 rounded-full bg-gray-200 animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ขวา: TodayStats Sidebar */}
        <div className="w-120 flex-shrink-0 hidden lg:block mr-6">
          <div className="w-full rounded-lg p-3 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-gray-700 mb-2">แรงค์ของคุณ</h2>

            <div className="relative w-full flex flex-col items-center mb-4">
              <div className="mb-[-10px] z-20 mt-1">
                <div className="h-8 w-44 bg-gray-200 rounded-full animate-pulse border-2 border-white shadow-sm" />
              </div>

              <div className="relative w-44 h-44 flex items-center justify-center my-2">
                <div className="w-36 h-36 rounded-full bg-gray-200/80 animate-pulse" />
              </div>

              {/* ดาวโค้ง 5 ดวง */}
              <div className="relative h-14 w-full flex justify-center items-start z-20 gap-5">
                {[1, 2, 3, 4, 5].map((starNum) => {
                  const distance = Math.abs(starNum - 3);
                  const yOffset = -1 * (distance * distance) * 3;
                  const rotate = (starNum - 3) * 12;
                  return (
                    <div key={starNum} style={{ transform: `translateY(${yOffset}px) rotate(${rotate}deg)` }}>
                      <Star size={45} className="text-gray-300 fill-gray-300 animate-pulse" />
                    </div>
                  );
                })}
              </div>

              {/* หลอด EXP */}
              <div className="w-full z-20 px-4 mt-1">
                <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden animate-pulse" />
                <div className="h-3 w-28 bg-gray-200 rounded-md mx-auto mt-2 animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-700 mt-3 mb-3">สถิติในวันนี้</h3>
            <div className="w-full grid grid-cols-3 gap-3">
              {['ความเร็ว', 'ความแม่นยำ', 'เวลาที่ใช้'].map((label) => (
                <div key={label} className="bg-[#5cb5db] rounded-2xl p-2 shadow-md">
                  <h4 className="text-center text-sm text-white font-bold my-1">{label}</h4>
                  <div className="bg-white rounded-xl py-5 px-3 flex items-center justify-between">
                    <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
                    <div className="h-4 w-14 bg-gray-200 rounded-md animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
