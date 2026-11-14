// scripts/cleanup_database.js
// สคริปต์ทำความสะอาดฐานข้อมูล FarmSession และ SpeedTestResult
// 1. รวมแถว FarmSession ที่เก่ากว่า 30 วัน ให้เหลือ 1 แถวสรุปต่อวันต่อคน (คง Streak และเวลาย้อนหลังครบ 100%)
// 2. เคลียร์ฟิลด์ mistakes ใน SpeedTestResult ที่เก่ากว่า 30 วันให้เป็น {} เพื่อประหยัดพื้นที่ โดยคงสถิติและคะแนนสูงสุดไว้ครบถ้วน

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function toDateKey(date) {
    const d = new Date(date);
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(d);
}

async function cleanup() {
    console.log('🚀 เริ่มต้นกระบวนการทำความสะอาดฐานข้อมูล (Database Cleanup)...');
    const now = new Date();
    const cutoff30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    console.log(`📅 เกณฑ์เวลา 30 วันย้อนหลัง: ${cutoff30Days.toISOString()}`);

    // =========================================================
    // 1. จัดการ SpeedTestResult: เคลียร์ mistakes ที่เก่าเกิน 30 วัน
    // =========================================================
    console.log('\n--- [1/2] จัดการ SpeedTestResult ---');
    try {
        const updateResult = await prisma.speedTestResult.updateMany({
            where: {
                createdAt: { lt: cutoff30Days },
                NOT: { mistakes: { equals: {} } }
            },
            data: {
                mistakes: {}
            }
        });
        console.log(`✅ เคลียร์ฟิลด์ mistakes เก่าเกิน 30 วันสำเร็จ: ${updateResult.count.toLocaleString()} แถว`);
    } catch (err) {
        console.error('❌ ข้อผิดพลาดใน SpeedTestResult:', err.message);
    }

    // =========================================================
    // 2. จัดการ FarmSession: รวมแถวเก่ากว่า 30 วัน ให้เหลือ 1 แถว/วัน/คน
    // =========================================================
    console.log('\n--- [2/2] จัดการ FarmSession (Consolidate เก่ากว่า 30 วัน) ---');
    try {
        // ดึงรายการฟาร์มที่เก่ากว่า 30 วัน
        const oldSessions = await prisma.farmSession.findMany({
            where: { createdAt: { lt: cutoff30Days } },
            select: {
                id: true,
                userId: true,
                duration: true,
                wordsCount: true,
                expEarned: true,
                wpm: true,
                accuracy: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        });

        console.log(`🔍 พบ FarmSession เก่ากว่า 30 วันทั้งหมด: ${oldSessions.length.toLocaleString()} แถว`);

        if (oldSessions.length > 0) {
            // จัดกลุ่มตาม userId + วันที่ (Asia/Bangkok YYYY-MM-DD)
            const grouped = new Map();

            for (const s of oldSessions) {
                const dayKey = `${s.userId}_${toDateKey(s.createdAt)}`;
                if (!grouped.has(dayKey)) {
                    grouped.set(dayKey, []);
                }
                grouped.get(dayKey).push(s);
            }

            console.log(`📊 รวมกลุ่มได้: ${grouped.size.toLocaleString()} วันกิจกรรม (จากเดิม ${oldSessions.length.toLocaleString()} แถว)`);

            let deletedCount = 0;
            let updatedCount = 0;

            for (const [key, sessions] of grouped.entries()) {
                if (sessions.length <= 1) {
                    // ถ้าวันนั้นมีแค่ 1 แถวอยู่แล้ว ไม่ต้องทำอะไร
                    continue;
                }

                // เลือกแถวแรกเป็นตัวแทนของวันนั้น (เก็บ timestamp ของวันนั้นไว้)
                const primary = sessions[0];
                const otherIds = sessions.slice(1).map(s => s.id);

                let totalDuration = 0;
                let totalWords = 0;
                let totalExp = 0;
                let weightedWpm = 0;
                let weightedAcc = 0;

                for (const s of sessions) {
                    const dur = Math.max(1, s.duration || 1);
                    totalDuration += (s.duration || 0);
                    totalWords += (s.wordsCount || 0);
                    totalExp += (s.expEarned || 0);
                    weightedWpm += (s.wpm || 0) * dur;
                    weightedAcc += (s.accuracy !== undefined ? s.accuracy : 100) * dur;
                }

                const avgWpm = totalDuration > 0 ? Math.round(weightedWpm / totalDuration) : 0;
                const avgAcc = totalDuration > 0 ? Math.round(weightedAcc / totalDuration) : 100;

                // อัปเดตแถวหลักให้เก็บยอดรวมทั้งหมดของวันนั้น
                await prisma.farmSession.update({
                    where: { id: primary.id },
                    data: {
                        duration: totalDuration,
                        wordsCount: totalWords,
                        expEarned: totalExp,
                        wpm: avgWpm,
                        accuracy: avgAcc
                    }
                });
                updatedCount++;

                // ลบแถวซ้ำซ้อนที่เหลือของวันนั้นทิ้ง
                const delRes = await prisma.farmSession.deleteMany({
                    where: { id: { in: otherIds } }
                });
                deletedCount += delRes.count;
            }

            console.log(`✅ รวมแถวสำเร็จ: อัปเดตยอดรวม ${updatedCount.toLocaleString()} วัน, ลบแถวซ้ำออก ${deletedCount.toLocaleString()} แถว`);
        }
    } catch (err) {
        console.error('❌ ข้อผิดพลาดใน FarmSession:', err.message);
    }

    console.log('\n🎉 สิ้นสุดกระบวนการทำความสะอาดฐานข้อมูลเรียบร้อยแล้ว!');
}

cleanup()
    .catch(console.error)
    .finally(() => prisma['$disconnect']());
