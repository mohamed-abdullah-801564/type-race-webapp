
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
        academyModulesCompleted: academyProgress.length,
        dailyChallengesCompleted: raceHistory.filter(h => h.mode === 'daily').length,
        currentStreak: calculateStreak(raceHistory)
    };

    return stats;
};

const calculateStreak = (history) => {
    if (!history || history.length === 0) return 0;

    // Get unique dates in YYYY-MM-DD format
    const dates = [...new Set(history.map(h => {
        const d = new Date(h.date || h.timestamp);
        return d.toISOString().split('T')[0];
    }))].sort().reverse();

    if (dates.length === 0) return 0;

    // Check if most recent race was today or yesterday
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

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
