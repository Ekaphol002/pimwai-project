import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function restore(backupFileName?: string) {
  const backupDir = path.join(__dirname, '..', 'backups');
  
  let targetFile = backupFileName;
  if (!targetFile) {
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json')).sort().reverse();
    if (files.length === 0) {
      throw new Error('No backup files found in backups directory!');
    }
    targetFile = files[0];
  }

  const fullPath = path.isAbsolute(targetFile) ? targetFile : path.join(backupDir, targetFile);
  console.log(`🔄 Restoring database from: ${fullPath}`);

  const rawData = fs.readFileSync(fullPath, 'utf-8');
  const backupData = JSON.parse(rawData);

  console.log(`📅 Backup Timestamp: ${backupData.metadata?.timestamp}`);
  console.log(`📦 Restoring tables...`);

  // Restores can be performed in transaction or sequential batching
  // 1. Lessons & SubLessons
  if (backupData.data.lessons) {
    console.log(`Restoring ${backupData.data.lessons.length} lessons...`);
    for (const lesson of backupData.data.lessons) {
      await prisma.lesson.upsert({
        where: { id: lesson.id },
        update: {
          title: lesson.title,
          level: lesson.level,
          order: lesson.order,
          slug: lesson.slug
        },
        create: {
          id: lesson.id,
          title: lesson.title,
          level: lesson.level,
          order: lesson.order,
          slug: lesson.slug
        }
      });
    }
  }

  if (backupData.data.subLessons) {
    console.log(`Restoring ${backupData.data.subLessons.length} sublessons...`);
    for (const sub of backupData.data.subLessons) {
      await prisma.subLesson.upsert({
        where: { id: sub.id },
        update: {
          title: sub.title,
          content: sub.content,
          mode: sub.mode,
          order: sub.order,
          lessonId: sub.lessonId,
          newKeys: sub.newKeys
        },
        create: {
          id: sub.id,
          title: sub.title,
          content: sub.content,
          mode: sub.mode,
          order: sub.order,
          lessonId: sub.lessonId,
          newKeys: sub.newKeys
        }
      });
    }
  }

  // 2. Users & Progress
  if (backupData.data.users) {
    console.log(`Restoring ${backupData.data.users.length} users...`);
    for (const u of backupData.data.users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {
          name: u.name,
          username: u.username,
          email: u.email,
          image: u.image,
          rank: u.rank,
          stars: u.stars,
          currentExp: u.currentExp,
          xp: u.xp,
          keyboardSound: u.keyboardSound,
          showInLeaderboard: u.showInLeaderboard
        },
        create: {
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          image: u.image,
          rank: u.rank,
          stars: u.stars,
          currentExp: u.currentExp,
          xp: u.xp,
          keyboardSound: u.keyboardSound,
          showInLeaderboard: u.showInLeaderboard
        }
      });
    }
  }

  if (backupData.data.lessonProgress) {
    console.log(`Restoring ${backupData.data.lessonProgress.length} lesson progress records...`);
    for (const p of backupData.data.lessonProgress) {
      await prisma.lessonProgress.upsert({
        where: {
          userId_subLessonId: {
            userId: p.userId,
            subLessonId: p.subLessonId
          }
        },
        update: {
          wpm: p.wpm,
          accuracy: p.accuracy,
          stars: p.stars,
          duration: p.duration,
          status: p.status
        },
        create: {
          id: p.id,
          userId: p.userId,
          subLessonId: p.subLessonId,
          wpm: p.wpm,
          accuracy: p.accuracy,
          stars: p.stars,
          duration: p.duration,
          status: p.status
        }
      });
    }
  }

  console.log(`\n🎉 Restore completed successfully!`);
  await prisma.$disconnect();
}

const targetArg = process.argv[2];
restore(targetArg).catch(e => {
  console.error('❌ Restore failed:', e);
  process.exit(1);
});
