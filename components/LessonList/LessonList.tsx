"use client";

import { Play, RotateCcw, Star } from 'lucide-react';
import Link from 'next/link';

// --- 1. Interfaces (ปรับปรุงใหม่ให้รับข้อมูลจาก DB ได้) ---
export interface SubLesson { // export เพื่อให้ไฟล์อื่นเรียกใช้ได้
  id: string;
  title?: string;
  status: string; // 'not_started' | 'completed'
  stars?: number;
  wpm?: number;
  acc?: number;
}

export interface LessonUnit {
  id: number;
  order: number;
  title: string;
  status: string; // 'completed' | 'resume' | 'start'
  avgSpeed?: string;
  avgAcc?: string;
  time?: string;
  subLessons?: SubLesson[];
}

interface LessonListProps {
  title: string;
  introText?: string;
  lessons: LessonUnit[]; // รับ Array ของ LessonUnit ที่ถูกต้อง
}

// --- 2. Button Function ---
function LessonButton({
  status,
  lessonId,
  subLessons = []
}: {
  status: string,
  lessonId: number,
  subLessons?: SubLesson[]
}) {
  const baseStyle = "flex items-center justify-center gap-1 w-24 h-8 text-sm font-bold rounded-lg transition transform duration-200 hover:scale-105";

  if (subLessons.length === 0) return null;

  let targetSubLessonId = subLessons[0].id;

  if (status === 'resume') {
    const nextLesson = subLessons.find(sl => sl.status !== 'completed');
    if (nextLesson) {
      targetSubLessonId = nextLesson.id;
    }
  }

  const targetUrl = `/lesson/${lessonId}/${targetSubLessonId}`;

  if (status === 'completed') {
    return (
      <Link href={targetUrl}>
        <button className={`${baseStyle} bg-white text-green-700 hover:bg-gray-100`}>
          <RotateCcw className="w-3.5 h-3.5" />
          Restart
        </button>
      </Link>
    );
  }
  if (status === 'resume') {
    return (
      <Link href={targetUrl}>
        <button className={`${baseStyle} bg-yellow-400 text-yellow-900 hover:bg-yellow-500`}>
          <Play className="w-3.5 h-3.5 mr-0.5" fill="currentColor" />
          Resume
        </button>
      </Link>
    );
  }
  if (status === 'start') {
    return (
      <Link href={targetUrl}>
        <button className={`${baseStyle} bg-blue-200 text-white hover:bg-blue-200`}>
          <Play className="w-3.5 h-3.5 mr-0.5" fill="currentColor" />
          Start
        </button>
      </Link>
    );
  }
  return null;
}

// --- 3. Interactive Bar Component ---
function InteractiveBar({
  status,
  lessonId,
  subLessonId,
  stars = 0,
  wpm = 0,
  acc = 0,
  isUnitCompleted = false,
  isNextUp = false,
  label = ""
}: {
  status: string,
  lessonId: number,
  subLessonId: string,
  stars?: number,
  wpm?: number,
  acc?: number,
  isUnitCompleted?: boolean,
  isNextUp?: boolean,
  label?: string
}) {

  let colorClass = 'bg-gray-200';
  let isClickable = false;
  const hasPlayed = status === 'completed' || isUnitCompleted || (status === 'resume' && stars > 0);

  if (isUnitCompleted) {
    colorClass = 'bg-[rgb(180,219,155)] hover:bg-[#a3d489]';
    isClickable = true;
  } else {
    if (status === 'completed') {
      colorClass = 'bg-[#5cb5db] hover:bg-[#4ba3c9]';
      isClickable = true;
    } else if (status === 'resume') {
      colorClass = 'bg-yellow-400 hover:bg-yellow-500';
      isClickable = true;
    } else if (isNextUp) {
      // ปกติสีเทา แต่ Hover แล้วเป็นสีเหลือง
      colorClass = 'bg-gray-200 hover:bg-yellow-400'; 
      isClickable = true;
    }
  }

  const barContent = (
    <div className={`h-2 w-full rounded transition-colors duration-200 ${colorClass}`}></div>
  );

  return (
    <div className="group relative flex-1 transition-[flex] duration-300 ease-out hover:flex-[1.5] hover:z-10 flex flex-col justify-end">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 flex flex-col items-center">
        <div className="flex flex-col items-center bg-gray-800/90 px-6 py-2 rounded-lg backdrop-blur-sm shadow-xl border border-gray-700/50">
          <span className="text-[13px] text-white font-bold mb-1.5">{label}</span>
          <div className="flex gap-1 mb-1.5">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                size={14}
                className={
                  !hasPlayed
                    ? "text-gray-600 fill-gray-600"
                    : (s <= stars ? "text-yellow-400 fill-yellow-400" : "text-gray-600 fill-gray-600")
                }
              />
            ))}
          </div>
          <div className="text-[13px] text-gray-300 font-medium px-2 rounded flex gap-2">
            <span>{hasPlayed ? wpm : '-- '} WPM</span>
            <span className="text-gray-500">|</span>
            <span>{hasPlayed ? acc : '-- '}% Acc</span>
          </div>
        </div>
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800/90 -mt-[1px]"></div>
      </div>

      {isClickable ? (
        <Link href={`/lesson/${lessonId}/${subLessonId}`} className="block w-full cursor-pointer">
          {barContent}
        </Link>
      ) : (
        <div className="block w-full cursor-default">
          {barContent}
        </div>
      )}
    </div>
  );
}

// --- 4. Main Component ---
export default function LessonList({ title, lessons }: LessonListProps) {

  const cleanTitle = (t: string) => {
    const parts = t.split(':');
    return parts.length > 1 ? parts[1].trim() : t;
  };

  return (
    <div className="w-[90%] bg-[#5cb5db] rounded-b-lg p-6 pt-1 text-white shadow-xl text-left font-logo ml-11">
      <hr className="border-1 mt-4 mb-4" />
      <h2 className="text-2xl mb-4 font-bold animate-fadeInDown">
        {title}
      </h2>

      <div className="flex flex-col gap-4">
        {lessons.map((unit, index) => (
          <div
            key={unit.id}
            className={`
              flex flex-col gap-3 rounded-lg animate-fadeInDown
              ${unit.status === 'completed' ? 'p-3 bg-[#71b16b] text-white' :
                unit.status === 'start' ? 'p-6 px-3 bg-white text-gray-800' :
                  'p-3 bg-white text-gray-800'
              }
            `}
            style={{ animationDelay: `${index * 0.05}s` }}
          >

            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-4">
                <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold
                    border-2
                    ${unit.status === 'completed' ? 'bg-white text-[#71b16b]' : 'border-gray-300 text-gray-500'}
                  `}>
                  {unit.order}
                </div>

                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${unit.status === 'completed' ? 'text-white' : 'text-gray-800'
                    }`}>
                    {unit.title}
                  </h3>

                  {unit.avgSpeed && (
                    <div className="pt-1">
                      <hr className={unit.status === 'completed' ? 'border-[rgb(180,219,155)]' : 'border-gray-300'} />
                      <p className={`text-sm mt-1 ${unit.status === 'completed' ? 'text-green-100' : 'text-gray-500'} flex gap-4`}>
                        <span>Avg Speed: {unit.avgSpeed}</span>
                        <span>Avg Acc: {unit.avgAcc}</span>
                        <span>Time: {unit.time}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                <LessonButton
                  status={unit.status}
                  lessonId={unit.id}
                  subLessons={unit.subLessons}
                />
              </div>
            </div>

            {/* SubLesson Squares Row */}
            {unit.subLessons && (unit.status === 'completed' || unit.status === 'resume' || unit.status === 'start') && (
              <div className="flex gap-1.5 pt-2 h-3 items-end">
                {unit.subLessons?.map((subLesson, subIndex) => {
                  const isDone = subLesson.status === 'completed' || unit.status === 'completed';
                  // (Mockup Data สำหรับการแสดงผล - อนาคตจะเอาค่าจริงจาก DB)
                  const displayStars = subLesson.stars || 0;
                  const displayWpm = subLesson.wpm || 0;
                  const displayAcc = subLesson.acc || 0;
                  const subLessonLabel = `${cleanTitle(unit.title)} ${subIndex + 1}`;
                  const isNextUp = subLesson.status === 'not_started' && 
                                   (subIndex === 0 || unit.subLessons![subIndex - 1].status === 'completed');

                  return (
                    <InteractiveBar
                      key={subLesson.id}
                      status={subLesson.status}
                      lessonId={unit.id}
                      subLessonId={subLesson.id}
                      stars={displayStars}
                      wpm={displayWpm}
                      acc={displayAcc}
                      isUnitCompleted={unit.status === 'completed'}
                      isNextUp={isNextUp}
                      label={subLessonLabel}
                    />
                  );
                })}
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}