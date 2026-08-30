export const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const calculateCurrentStreak = (activityDates: string[]) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayKey = toDateKey(today);
    const yesterdayKey = toDateKey(yesterday);
    const activitySet = new Set(activityDates);

    // ถ้าวันนี้และเมื่อวานไม่ได้ทำเลย streak เป็น 0
    if (!activitySet.has(todayKey) && !activitySet.has(yesterdayKey)) return 0;

    let streak = 0;
    // เริ่มนับจากวันนี้ ถ้าวันนี้ไม่มีก็เริ่มนับจากเมื่อวาน
    let checkDate = activitySet.has(todayKey) ? today : yesterday;

    while (true) {
        if (activitySet.has(toDateKey(checkDate))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1); // ถอยหลังไปเรื่อยๆ
        } else {
            break; // หยุดเมื่อเจอวันว่าง
        }
    }
    return streak;
};

export const calculateLongestStreak = (activityDates: string[]) => {
    if (activityDates.length === 0) return 0;
    
    const uniqueDates = Array.from(new Set(activityDates)).sort();
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        
        // เซ็ตเวลาให้เป็น 00:00:00 เพื่อตัดปัญหา Timezone
        prevDate.setHours(0, 0, 0, 0);
        currDate.setHours(0, 0, 0, 0);
        
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
            currentStreak++;
            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
            }
        } else if (diffDays > 1) {
            currentStreak = 1;
        }
    }
    
    return maxStreak;
};

export const calculateTotalDays = (activityDates: string[]) => {
    if (!activityDates || activityDates.length === 0) return 0;
    return new Set(activityDates.filter(Boolean)).size;
};
