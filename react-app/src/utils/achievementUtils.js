
export const ACHIEVEMENTS = [
    {
        id: 'first_race',
        title: "First Steps",
        description: "Complete your first typing race",
        icon: "🚀",
        rarity: "common",
        condition: (stats) => stats.totalRaces >= 1
    },
    {
        id: 'speed_30',
        title: "Speed Demon",
        description: "Reach 30 WPM in any race",
        icon: "⚡",
        rarity: "common",
        condition: (stats) => stats.highestWPM >= 30
    },
    {
        id: 'speed_60',
        title: "Swift Fingers",
        description: "Reach 60 WPM in any race",
        icon: "🔥",
        rarity: "rare",
        condition: (stats) => stats.highestWPM >= 60
    },
    {
        id: 'speed_100',
        title: "Century Breaker",
        description: "Reach 100 WPM in any race",
        icon: "💎",
        rarity: "rare",
        condition: (stats) => stats.highestWPM >= 100
    },
    {
        id: 'speed_120',
        title: "Neural Overdrive",
        description: "Reach 120 WPM in any race",
        icon: "🧠",
        rarity: "legendary",
        condition: (stats) => stats.highestWPM >= 120
    },
    {
        id: 'accuracy_100',
        title: "Flawless Protocol",
        description: "Complete a race with 100% accuracy",
        icon: "🎯",
        rarity: "rare",
        condition: (stats) => stats.perfectRaces >= 1
    },
    {
        id: 'races_10',
        title: "Dedicated Operator",
        description: "Complete 10 typing races",
        icon: "🏃",
        rarity: "common",
        condition: (stats) => stats.totalRaces >= 10
    },
    {
        id: 'races_50',
        title: "Grid Veteran",
        description: "Complete 50 typing races",
        icon: "⚔️",
        rarity: "rare",
        condition: (stats) => stats.totalRaces >= 50
    },
    {
        id: 'races_100',
        title: "Neural Legend",
        description: "Complete 100 typing races",
        icon: "👑",
        rarity: "legendary",
        condition: (stats) => stats.totalRaces >= 100
    },
    {
        id: 'academy_complete',
        title: "Academy Graduate",
        description: "Complete all 13 Academy modules",
        icon: "🎓",
        rarity: "legendary",
        condition: (stats) => stats.academyModulesCompleted >= 13
    },
    {
        id: 'daily_7',
        title: "Week Warrior",
        description: "Complete 7 daily challenges",
        icon: "📅",
        rarity: "rare",
        condition: (stats) => stats.dailyChallengesCompleted >= 7
    },
    {
        id: 'streak_3',
        title: "On A Roll",
        description: "Complete races 3 days in a row",
        icon: "🔥",
        rarity: "common",
        condition: (stats) => stats.currentStreak >= 3
    }
];

export const checkAchievements = (stats) => {
    const earned = JSON.parse(localStorage.getItem('earnedAchievements') || '[]');
    return ACHIEVEMENTS.filter(a => a.condition(stats) && !earned.includes(a.id));
};

export const saveAchievements = (newAchievements) => {
    const earned = JSON.parse(localStorage.getItem('earnedAchievements') || '[]');
    const newIds = newAchievements.map(a => a.id);
    const updated = [...new Set([...earned, ...newIds])];
    localStorage.setItem('earnedAchievements', JSON.stringify(updated));
    return updated;
};

export const buildStatsForAchievements = () => {
    const rankData = JSON.parse(localStorage.getItem('rankData') || '{}');
    const raceHistory = JSON.parse(localStorage.getItem('raceHistory') || '[]');
    const academyProgress = JSON.parse(localStorage.getItem('academyProgress') || '[]');

    const stats = {
        totalRaces: Math.max(rankData?.totalRaces || 0, raceHistory.length),
        highestWPM: rankData.highestWPM || 0,
        perfectRaces: raceHistory.filter(h => parseFloat(h.accuracy) >= 100 && h.noBackspace === true).length,
        academyModulesCompleted: academyProgress.includes('academy_completed') ? 13 : Math.max(0, academyProgress.length - 1),
        dailyChallengesCompleted: raceHistory.filter(h => h.mode === 'daily').length,
        currentStreak: calculateStreak(raceHistory)
    };

    return stats;
};

export const calculateStreak = (history) => {
    if (!history || !Array.isArray(history) || history.length === 0) return 0;

    // Get unique dates in YYYY-MM-DD format
    const dates = [...new Set(history.map(h => {
        if (!h) return null;
        let rawDate = h.date || h.timestamp;
        if (!rawDate) return null;
        const d = new Date(Number(rawDate));
        if (isNaN(d.getTime())) return null;
        // Extract clean local calendar format configuration maps (YYYY-MM-DD)
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }).filter(Boolean))].sort().reverse();

    if (dates.length === 0) return 0;

    // Check if most recent race was today or yesterday
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayDate = new Date();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(todayDate.getDate() - 1);

    const today = formatDate(todayDate);
    const yesterday = formatDate(yesterdayDate);

    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
        const d1 = new Date(dates[i]);
        const d2 = new Date(dates[i + 1]);
        const diff = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
        
        if (diff === 1) {
            streak++;
        } else if (diff > 1) {
            break;
        }
    }
    return streak;
};
