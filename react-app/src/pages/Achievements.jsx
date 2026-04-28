import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { ACHIEVEMENTS } from '../utils/achievementUtils';
import { Trophy, Lock, Shield, Award, Zap } from 'lucide-react';

export default function Achievements() {
    const [earnedIds, setEarnedIds] = useState([]);

    useEffect(() => {
        const earned = JSON.parse(localStorage.getItem('earnedAchievements') || '[]');
        setEarnedIds(earned);
    }, []);

    const isEarned = (id) => earnedIds.includes(id);

    const getRarityStyle = (rarity) => {
        switch (rarity) {
            case 'legendary':
                return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            case 'rare':
                return 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30';
            default:
                return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary/30 relative">
            {/* Background Scanline Effect */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%]" />
            
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-20 py-16 relative">
                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-20">
                    <div className="relative mb-6">
                        <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-2xl animate-pulse"></div>
                        <Trophy className="w-20 h-20 text-yellow-500 relative drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                    </div>
                    <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">
                        Achievement Archive
                    </h1>
                    <div className="flex items-center gap-4 bg-slate-900/50 border border-white/5 px-6 py-2 rounded-full backdrop-blur-xl">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                            Protocol Completion: <span className="text-white">{earnedIds.length} / {ACHIEVEMENTS.length}</span> Unlocked
                        </span>
                    </div>
                </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {ACHIEVEMENTS.map((achievement) => {
                        const earned = isEarned(achievement.id);
                        return (
                            <div 
                                key={achievement.id}
                                className={`group relative bg-black/40 border-2 rounded-3xl p-8 flex flex-col items-center gap-4 text-center transition-all duration-500 ${
                                    earned 
                                    ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]' 
                                    : 'border-white/5 opacity-40 grayscale'
                                }`}
                            >
                                {/* Rarity Badge */}
                                <div className={`absolute top-4 right-4 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getRarityStyle(achievement.rarity)}`}>
                                    {achievement.rarity}
                                </div>

                                {/* Icon */}
                                <div className={`text-5xl mb-2 transition-transform duration-500 ${earned ? 'group-hover:scale-110' : ''}`}>
                                    {achievement.icon}
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-black text-white uppercase tracking-tight leading-tight">
                                        {achievement.title}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed px-2">
                                        {achievement.description}
                                    </p>
                                </div>

                                {/* Lock Icon overlay for unearned */}
                                {!earned && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-3xl backdrop-blur-[1px]">
                                        <Lock className="w-8 h-8 text-slate-400 opacity-80" />
                                    </div>
                                )}

                                {/* Glow effect on hover for earned */}
                                {earned && (
                                    <div className="absolute inset-0 bg-yellow-400/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Status */}
                <div className="mt-20 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-4 bg-black/40 px-8 py-3 rounded-full border border-white/5 shadow-2xl">
                        <Award className="w-4 h-4 text-primary opacity-50" />
                        <span className="text-[9px] font-black text-primary tracking-[0.3em] font-mono animate-pulse uppercase">
                            Secure Neural Vault // Integrity Verified
                        </span>
                    </div>
                </div>
            </main>
        </div>
    );
}
