import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const totalUsers = await prisma.user.count();
  const totalProgress = await prisma.lessonProgress.count();

  console.log(`=== PIMWAI DATABASE ANALYTICS ===`);
  console.log(`Total Registered Users: ${totalUsers}`);
  console.log(`Total Lesson Progress Records: ${totalProgress}`);

  // Fetch all lessons & sublessons ordered
  const lessons = await prisma.lesson.findMany({
    orderBy: { order: 'asc' },
    include: {
      subLessons: {
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { userProgress: true }
          }
        }
      }
    }
  });

  console.log('\n--- LESSON COMPLETION STATS ---');
  for (const lesson of lessons) {
    console.log(`\n📘 Lesson ${lesson.order}: ${lesson.title} (${lesson.level})`);
    for (const sub of lesson.subLessons) {
      const count = sub._count.userProgress;
      const pct = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(1) : '0';
      console.log(`   - [${sub.id}] ${sub.title || 'Sublesson'}: ${count} completions (${pct}% of users) | newKeys: ${JSON.stringify(sub.newKeys)}`);
    }
  }

  // Find users highest completed sublesson
  const userProgressList = await prisma.lessonProgress.findMany({
    select: {
      userId: true,
      subLessonId: true,
      wpm: true,
      accuracy: true,
      duration: true,
      subLesson: {
        select: {
          order: true,
          lesson: {
            select: {
              order: true,
              title: true
            }
          }
        }
      }
    }
  });

  // Calculate avg wpm and acc per sublesson
  const statsMap: Record<string, { count: number; totalWpm: number; totalAcc: number; title: string }> = {};
  for (const p of userProgressList) {
    if (!statsMap[p.subLessonId]) {
      statsMap[p.subLessonId] = { count: 0, totalWpm: 0, totalAcc: 0, title: p.subLesson?.lesson?.title || '' };
    }
    statsMap[p.subLessonId].count++;
    statsMap[p.subLessonId].totalWpm += p.wpm;
    statsMap[p.subLessonId].totalAcc += p.accuracy;
  }

  console.log('\n--- PERFORMANCE STATS PER SUBLESSON ---');
  for (const [id, s] of Object.entries(statsMap)) {
    const avgWpm = (s.totalWpm / s.count).toFixed(1);
    const avgAcc = (s.totalAcc / s.count).toFixed(1);
    console.log(`[${id}]: completions=${s.count}, avgWpm=${avgWpm}, avgAcc=${avgAcc}%`);
  }

  // Find where users drop off (last completed sublesson per user)
  const userMaxSublesson: Record<string, { subId: string; lessonOrder: number; subOrder: number }> = {};
  for (const p of userProgressList) {
    const lOrder = p.subLesson?.lesson?.order || 0;
    const sOrder = p.subLesson?.order || 0;
    const currentMax = userMaxSublesson[p.userId];
    if (!currentMax || lOrder > currentMax.lessonOrder || (lOrder === currentMax.lessonOrder && sOrder > currentMax.subOrder)) {
      userMaxSublesson[p.userId] = {
        subId: p.subLessonId,
        lessonOrder: lOrder,
        subOrder: sOrder
      };
    }
  }

  const dropOffCounts: Record<string, number> = {};
  for (const [userId, maxData] of Object.entries(userMaxSublesson)) {
    dropOffCounts[maxData.subId] = (dropOffCounts[maxData.subId] || 0) + 1;
  }

  console.log('\n--- DROP-OFF POINTS (Last SubLesson Completed by User) ---');
  const sortedDropOffs = Object.entries(dropOffCounts).sort((a, b) => b[1] - a[1]);
  for (const [subId, cnt] of sortedDropOffs) {
    console.log(`Stopped at [${subId}]: ${cnt} users`);
  }

  // Users who haven't completed any lessons
  const usersWithProgressCount = Object.keys(userMaxSublesson).length;
  console.log(`\nUsers who never completed any lesson: ${totalUsers - usersWithProgressCount}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
