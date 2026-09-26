import { PrismaClient } from '@prisma/client';
import { BEGINNER_LESSONS_PREVIEW } from '../lib/lessonsData/beginnerLessons';
import { INTERMEDIATE_LESSONS_PREVIEW } from '../lib/lessonsData/intermediateLessons';
import { ADVANCED_LESSONS_PREVIEW } from '../lib/lessonsData/advancedLessons';

const prisma = new PrismaClient();

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function updateWithRetry(fn: () => Promise<any>, retries = 5, wait = 1000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      console.warn(`⏳ Connection busy, retrying in ${wait}ms... (${i + 1}/${retries})`);
      await delay(wait);
    }
  }
}

async function updateCurriculum() {
  console.log('🚀 Starting safe in-place update of lessons (Sequential with retry)...');

  const progressCountBefore = await updateWithRetry(() => prisma.lessonProgress.count());
  console.log(`📊 Current LessonProgress records in DB: ${progressCountBefore}`);

  const levelConfigs = [
    { level: 'beginner', data: BEGINNER_LESSONS_PREVIEW },
    { level: 'intermediate', data: INTERMEDIATE_LESSONS_PREVIEW },
    { level: 'advanced', data: ADVANCED_LESSONS_PREVIEW },
  ];

  let updatedSubLessonCount = 0;
  let updatedLessonCount = 0;

  for (const config of levelConfigs) {
    console.log(`\n========================================`);
    console.log(`Processing Level: ${config.level.toUpperCase()}`);
    console.log(`========================================`);

    const dbLessons: any[] = await updateWithRetry(() => prisma.lesson.findMany({
      where: { level: config.level },
      orderBy: { order: 'asc' },
      include: {
        subLessons: {
          orderBy: { order: 'asc' }
        }
      }
    }));

    for (const newLessonData of config.data) {
      const targetDbLesson = dbLessons.find((l: any) => l.order === newLessonData.order);
      if (!targetDbLesson) {
        console.warn(`⚠️ Warning: Lesson with order ${newLessonData.order} not found in DB for level ${config.level}`);
        continue;
      }

      const lessonTitle = newLessonData.title.includes(': ') ? newLessonData.title.split(': ')[1] : newLessonData.title;
      await updateWithRetry(() => prisma.lesson.update({
        where: { id: targetDbLesson.id },
        data: { title: lessonTitle }
      }));
      updatedLessonCount++;

      for (const newSub of newLessonData.subLessons) {
        const targetSub = targetDbLesson.subLessons.find((s: any) => s.order === newSub.order);
        if (!targetSub) {
          continue;
        }

        await updateWithRetry(() => prisma.subLesson.update({
          where: { id: targetSub.id },
          data: {
            title: newSub.title,
            content: newSub.content,
            mode: newSub.mode,
            newKeys: newSub.newKeys
          }
        }));

        updatedSubLessonCount++;
        await delay(50); // เล็กน้อยเพื่อไม่ให้ exhaust connection pool ของ Supabase/PostgreSQL
      }

      console.log(`✅ Updated Lesson ${targetDbLesson.order}: "${lessonTitle}" (10 stages updated)`);
    }
  }

  const progressCountAfter = await updateWithRetry(() => prisma.lessonProgress.count());
  console.log(`\n========================================`);
  console.log(`🎉 In-Place Curriculum Update Completed!`);
  console.log(`- Updated Lessons: ${updatedLessonCount}`);
  console.log(`- Updated SubLessons: ${updatedSubLessonCount}`);
  console.log(`- LessonProgress before: ${progressCountBefore}`);
  console.log(`- LessonProgress after:  ${progressCountAfter}`);
  console.log(`- Data Loss: ${progressCountBefore - progressCountAfter} records (0 = 100% safe)`);
  console.log(`========================================\n`);
}

updateCurriculum()
  .catch((e) => {
    console.error('❌ Error during update:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
