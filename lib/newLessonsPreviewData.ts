export interface LessonPreviewSubLesson {
  id: string;
  title: string;
  mode: 'character' | 'word';
  order: number;
  newKeys: string[];
  content: string;
  stageType: 'key_intro' | 'hand_sync' | 'real_words' | 'sentence' | 'boss_exam';
  description: string;
  reason: string;
}

export interface LessonPreviewLesson {
  id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  keysTheme: string;
  description: string;
  subLessons: LessonPreviewSubLesson[];
}

import { BEGINNER_LESSONS_PREVIEW } from './lessonsData/beginnerLessons';
import { INTERMEDIATE_LESSONS_PREVIEW } from './lessonsData/intermediateLessons';
import { ADVANCED_LESSONS_PREVIEW } from './lessonsData/advancedLessons';

// รวมบทเรียนทั้ง 3 ระดับ รวมทั้งหมด 21 บทเรียน บทละ 10 ด่าน (รวม 210 ด่าน)
// ออกแบบตามหลักสูตรสากล 10 ด่านต่อบทเรียน + คำศัพท์และความหมายจริง 100%
export const NEW_LESSONS_PREVIEW: LessonPreviewLesson[] = [
  ...BEGINNER_LESSONS_PREVIEW,
  ...INTERMEDIATE_LESSONS_PREVIEW,
  ...ADVANCED_LESSONS_PREVIEW
];
