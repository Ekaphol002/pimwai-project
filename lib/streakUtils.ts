
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
