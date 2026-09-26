import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFilePath = path.join(backupDir, `pimwai_full_backup_${timestamp}.json`);
  console.log(`🚀 Starting PIMWAI full database backup...`);
  console.log(`📁 Target File: ${backupFilePath}`);

  const [
    users,
    accounts,
    sessions,
    verificationTokens,
    lessons,
    subLessons,
    lessonProgress,
    speedTestResults,
    feedbacks,
    reports
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.account.findMany(),
    prisma.session.findMany(),
    prisma.verificationToken.findMany(),
    prisma.lesson.findMany({ include: { subLessons: true } }),
    prisma.subLesson.findMany(),
    prisma.lessonProgress.findMany(),
    prisma.speedTestResult.findMany(),
    prisma.feedback.findMany(),
    prisma.report.findMany()
  ]);

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      totalRecords: {
        users: users.length,
        accounts: accounts.length,
        sessions: sessions.length,
        verificationTokens: verificationTokens.length,
        lessons: lessons.length,
        subLessons: subLessons.length,
        lessonProgress: lessonProgress.length,
        speedTestResults: speedTestResults.length,
        feedbacks: feedbacks.length,
        reports: reports.length
      }
    },
    data: {
      users,
      accounts,
      sessions,
      verificationTokens,
      lessons,
      subLessons,
      lessonProgress,
      speedTestResults,
      feedbacks,
      reports
    }
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log(`\n✅ Backup completed successfully!`);
  console.log(`📊 Backup Summary:`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Lesson Progress Records: ${lessonProgress.length}`);
  console.log(`   - Lessons: ${lessons.length}`);
  console.log(`   - SubLessons: ${subLessons.length}`);
  console.log(`   - Speed Test Results: ${speedTestResults.length}`);
  console.log(`   - Feedbacks: ${feedbacks.length}`);
  console.log(`   - Reports: ${reports.length}`);
  console.log(`💾 File Size: ${(fs.statSync(backupFilePath).size / (1024 * 1024)).toFixed(2)} MB`);

  await prisma.$disconnect();
}

backup().catch(err => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
