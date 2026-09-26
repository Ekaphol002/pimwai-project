import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.lesson.findMany({
    orderBy: { order: 'asc' },
    include: {
      subLessons: {
        orderBy: { order: 'asc' }
      }
    }
  });

  console.log(`Fetched ${lessons.length} lessons from DB.`);
  const summary = lessons.map(l => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    level: l.level,
    order: l.order,
    subLessonsCount: l.subLessons.length,
    subLessons: l.subLessons.map(s => ({
      id: s.id,
      title: s.title,
      mode: s.mode,
      order: s.order,
      newKeys: s.newKeys,
      contentSample: s.content.substring(0, 40)
    }))
  }));

  fs.writeFileSync('scripts/db_lessons_summary.json', JSON.stringify(summary, null, 2), 'utf-8');
  console.log('Saved to scripts/db_lessons_summary.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
