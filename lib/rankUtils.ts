// ==========================================
// 👑 Rank Configuration & Progression Utility
// รองรับระบบ 7 ระดับแรงค์ พร้อมระบบ 5 ดาวต่อแรงค์
// ==========================================

export interface RankTier {
    rank: number;
    name: string;
    thaiName: string;
    theme: string;
    minExp: number;
    maxExp: number;
    expPerStar: number;
    color: string;
    badgeBg: string;
}

export const RANK_TIERS: RankTier[] = [
    {
        rank: 1,
        name: "Woodland Novice",
        thaiName: "นักพิมพ์พงไพร",
        theme: "Wood & Earth",
        minExp: 0,
        maxExp: 3000,
        expPerStar: 500, // 3,000 / 6 = 500 ต่อดาว (0★ ถึง 5★ หลอดเต็ม)
        color: "text-amber-700",
        badgeBg: "from-amber-600 to-amber-800"
    },
    {
        rank: 2,
        name: "Golden Treasure",
        thaiName: "ขุมทรัพย์ทองคำ",
        theme: "Golden Vault",
        minExp: 3000,
        maxExp: 9000,
        expPerStar: 1000, // (9,000 - 3,000) / 6 = 1,000 ต่อดาว
        color: "text-yellow-500",
        badgeBg: "from-yellow-400 to-amber-500"
    },
    {
        rank: 3,
        name: "Frostbite Blade",
        thaiName: "ดาบเยือกแข็ง",
        theme: "Crystal Frost",
        minExp: 9000,
        maxExp: 24000,
        expPerStar: 2500, // (24,000 - 9,000) / 6 = 2,500 ต่อดาว
        color: "text-cyan-500",
        badgeBg: "from-cyan-400 to-blue-500"
    },
    {
        rank: 4,
        name: "Obsidian Titan",
        thaiName: "ผู้พิทักษ์ศิลาเงิน",
        theme: "Steel Obsidian",
        minExp: 24000,
        maxExp: 54000,
        expPerStar: 5000, // (54,000 - 24,000) / 6 = 5,000 ต่อดาว (ลงตัวเป๊ะ!)
        color: "text-slate-400",
        badgeBg: "from-slate-500 to-zinc-700"
    },
    {
        rank: 5,
        name: "Venom Sorcerer",
        thaiName: "จอมเวทโอสถพิษ",
        theme: "Poison Mystic",
        minExp: 54000,
        maxExp: 114000,
        expPerStar: 10000, // (114,000 - 54,000) / 6 = 10,000 ต่อดาว
        color: "text-emerald-500",
        badgeBg: "from-emerald-500 to-green-700"
    },
    {
        rank: 6,
        name: "Crimson Overlord",
        thaiName: "จอมทัพเพลิงทับทิม",
        theme: "Crimson Flame",
        minExp: 114000,
        maxExp: 234000,
        expPerStar: 20000, // (234,000 - 114,000) / 6 = 20,000 ต่อดาว
        color: "text-rose-500",
        badgeBg: "from-rose-500 to-red-700"
    },
    {
        rank: 7,
        name: "Cosmic Astra",
        thaiName: "เทพเจ้าจักรวาลนิ้วแสง",
        theme: "Cosmic Astral",
        minExp: 234000,
        maxExp: Infinity,
        expPerStar: 20000,
        color: "text-purple-400",
        badgeBg: "from-purple-600 via-indigo-600 to-pink-500"
    }
];

export interface RankInfo {
    rank: number;
    rankName: string;
    thaiRankName: string;
    stars: number;
    currentBarExp: number;
    maxBarExp: number;
    color: string;
    badgeBg: string;
    image: string;
    isTop10Eligible?: boolean; // true เมื่อ EXP >= 200,000 แต่ยังไม่ติด Top 10 (เป็น Rank 6 5 ดาวเพื่อรอชิง Top 10)
}

/**
 * คำนวณ Rank และดาว (Stars 0-5) รวมถึง EXP ในหลอดความคืบหน้า จากค่า Total EXP
 * @param exp EXP สะสมทั้งหมด
 * @param isTop10 ผู้ใช้อยู่ใน Top 10 หรือไม่ (เงื่อนไขจำเป็นสำหรับ Rank 7: Cosmic Astra)
 */
export function calculateRankInfo(exp: number = 0, isTop10: boolean = false): RankInfo {
    const safeExp = Math.max(0, exp || 0);

    let tier = RANK_TIERS[0];
    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
        if (safeExp >= RANK_TIERS[i].minExp) {
            tier = RANK_TIERS[i];
            break;
        }
    }

    // 🌟 กฎพิเศษสำหรับ Rank 7 (Cosmic Astra - เทพเจ้าจักรวาลนิ้วแสง):
    // ต้องมี EXP >= 200,000 และ "ต้องอยู่ใน Top 10 ของเซิร์ฟเวอร์เท่านั้น"
    // หาก EXP >= 200,000 แต่ไม่ได้อยู่ใน Top 10 จะถูกแคปอยู่ที่ Rank 6 (Crimson Overlord 5 ดาว)
    if (tier.rank === 7 && !isTop10) {
        const rank6Tier = RANK_TIERS[5]; // Rank 6: Crimson Overlord
        return {
            rank: 6,
            rankName: rank6Tier.name,
            thaiRankName: rank6Tier.thaiName,
            stars: 5,
            currentBarExp: rank6Tier.expPerStar,
            maxBarExp: rank6Tier.expPerStar,
            color: rank6Tier.color,
            badgeBg: rank6Tier.badgeBg,
            image: `/Rank6.png`,
            isTop10Eligible: true
        };
    }

    const expInRank = safeExp - tier.minExp;
    let stars = Math.min(5, Math.floor(expInRank / tier.expPerStar));
    let currentBarExp = expInRank - (stars * tier.expPerStar);
    let maxBarExp = tier.expPerStar;

    // สำหรับ Rank สูงสุด (Rank 7)
    if (tier.rank === 7) {
        stars = Math.min(5, Math.floor(expInRank / tier.expPerStar));
        currentBarExp = expInRank % tier.expPerStar;
    }

    return {
        rank: tier.rank,
        rankName: tier.name,
        thaiRankName: tier.thaiName,
        stars,
        currentBarExp: Math.min(maxBarExp, currentBarExp),
        maxBarExp,
        color: tier.color,
        badgeBg: tier.badgeBg,
        image: `/Rank${tier.rank}.png`,
        isTop10Eligible: false
    };
}

/**
 * คำนวณเฉพาะเลข Rank (1 - 7) สำหรับบันทึก Database
 */
export function getRankFromExp(exp: number = 0, isTop10: boolean = false): number {
    return calculateRankInfo(exp, isTop10).rank;
}

// ==========================================
// ⚡ Rank Multiplier & Perk Calculation Utility
// ==========================================

export interface RankMultiplierConfig {
    rank: number;
    stars: number;
    baseMultiplier: number;
    starBonus: number;
    totalBaseMultiplier: number;
    maxMultiplierCap: number;
}

export const RANK_MULTIPLIERS: Record<number, { base: number; perStar: number; maxCap: number }> = {
    1: { base: 1.0, perStar: 0.04, maxCap: 2.5 },  // Rank 1: Woodland Novice (1.0x - 1.20x base, peak 2.5x)
    2: { base: 1.5, perStar: 0.10, maxCap: 3.5 },  // Rank 2: Golden Treasure (1.5x - 2.00x base, peak 3.5x)
    3: { base: 2.5, perStar: 0.15, maxCap: 5.0 },  // Rank 3: Frostbite Blade (2.5x - 3.25x base, peak 5.0x)
    4: { base: 4.0, perStar: 0.20, maxCap: 7.5 },  // Rank 4: Obsidian Titan (4.0x - 5.00x base, peak 7.5x)
    5: { base: 6.5, perStar: 0.30, maxCap: 11.0 }, // Rank 5: Venom Sorcerer (6.5x - 8.00x base, peak 11.0x)
    6: { base: 10.0, perStar: 0.40, maxCap: 16.0 },// Rank 6: Crimson Overlord (10.0x - 12.00x base, peak 16.0x)
    7: { base: 15.0, perStar: 0.60, maxCap: 25.0 } // Rank 7: Cosmic Astra (15.0x - 18.00x base, peak 25.0x)
};

export function getRankMultiplierConfig(rank: number = 1, stars: number = 0): RankMultiplierConfig {
    const safeRank = Math.min(7, Math.max(1, rank || 1));
    const safeStars = Math.min(5, Math.max(0, stars || 0));
    const config = RANK_MULTIPLIERS[safeRank] || RANK_MULTIPLIERS[1];
    const starBonus = Number((safeStars * config.perStar).toFixed(2));
    const totalBaseMultiplier = Number((config.base + starBonus).toFixed(2));

    return {
        rank: safeRank,
        stars: safeStars,
        baseMultiplier: config.base,
        starBonus,
        totalBaseMultiplier,
        maxMultiplierCap: config.maxCap
    };
}
