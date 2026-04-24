import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    GraduationCap, 
    Cpu, 
    Shield, 
    Zap, 
    ChevronRight, 
    Target, 
    Lock, 
    Play, 
    Activity, 
    Terminal
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { ACADEMY_MODULES } from '../utils/typingUtils';

export default function TrainingAcademy() {
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState('mod_1');
    const [unlockedIds, setUnlockedIds] = useState([]);

    useEffect(() => {
        const progress = JSON.parse(localStorage.getItem('academyProgress') || '["mod_1"]');
        setUnlockedIds(progress);
    }, []);

    const selectedModule = ACADEMY_MODULES.find(m => m.id === selectedId) || ACADEMY_MODULES[0];

    const handleStartModule = () => {
        if (!unlockedIds.includes(selectedId)) return;
        
        navigate('/solo', { 
            state: { 
                text: selectedModule.text, 
                isAcademy: true, 
                academyTitle: selectedModule.title,
                moduleId: selectedModule.id
            } 
        });
    };

    const getDifficultyColor = (diff) => {
        switch(diff) {
            case 'easy': return 'text-green-400';
            case 'medium': return 'text-yellow-400';
            case 'hard': return 'text-red-400';
            default: return 'text-primary';
        }
    };

    return (
        <div className="min-h-screen bg-background-dark text-slate-300 font-sans selection:bg-primary/30 selection:text-primary flex flex-col relative overflow-hidden">
            {/* Cyber Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50" />
            
            <Navbar />

            <main className="flex-1 flex overflow-hidden relative z-10">
                {/* Sidebar: Progressive Curriculum */}
                <div className="w-[380px] border-r border-white/5 bg-black/20 flex flex-col pt-12">
                    <div className="px-8 mb-8 text-left">
                        <div className="flex items-center gap-2 mb-2">
                             <GraduationCap className="w-4 h-4 text-primary" />
                             <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Training Curriculum</span>
                        </div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Neural Path</h2>
                        <div className="h-1 w-12 bg-primary mt-2" />
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-12 custom-scrollbar">
                        {ACADEMY_MODULES.map((module, index) => {
                            const isSelected = module.id === selectedId;
                            const isUnlocked = unlockedIds.includes(module.id);
                            
                            return (
                                <button
                                    key={module.id}
                                    onClick={() => isUnlocked && setSelectedId(module.id)}
                                    disabled={!isUnlocked}
                                    className={`w-full group relative flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 border ${
                                        isSelected 
                                        ? 'bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(0,245,212,0.1)]' 
                                        : isUnlocked 
                                            ? 'bg-transparent border-transparent hover:bg-white/5' 
                                            : 'opacity-40 cursor-not-allowed'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-xs border ${
                                        isSelected 
                                        ? 'bg-primary text-background-dark border-primary' 
                                        : 'bg-white/5 text-slate-500 border-white/10'
                                    }`}>
                                        {isUnlocked ? String(index + 1).padStart(2, '0') : <Lock className="w-4 h-4" />}
                                    </div>
                                    
                                    <div className="flex-1 text-left">
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
                                            {module.difficulty}
                                        </div>
                                        <div className={`text-md font-bold truncate max-w-[200px] ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                            {module.title}
                                        </div>
                                    </div>
                                    
                                    {isSelected && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#00f5d4] animate-pulse" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Dashboard: Module Detail */}
                <div className="flex-1 bg-black/40 flex flex-col p-12 lg:p-24 overflow-y-auto">
                    <div className="max-w-4xl w-full mx-auto animate-in fade-in slide-in-from-right-12 duration-700">
                        {/* Meta Info */}
                        <div className="flex items-center gap-4 mb-14">
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/20 rounded-full">
                                <Activity className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Neural Status: Optimal</span>
                            </div>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>

                        {/* Heading */}
                        <div className="relative mb-16">
                            <div className="absolute -left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-transparent" />
                            <h1 className="text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter italic mb-6">
                                {selectedModule.title}
                            </h1>
                            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-2xl">
                                {selectedModule.description}
                            </p>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-8 mb-16">
                            <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-10 group hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-3 mb-8">
                                    <Target className="w-5 h-5 text-primary opacity-40" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Targets</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {selectedModule.keys.map(key => (
                                        <div key={key} className="w-12 h-12 flex items-center justify-center bg-black/60 border border-white/10 rounded-2xl text-lg font-mono font-bold text-slate-300 group-hover:border-primary/40 group-hover:text-primary transition-all group-hover:-translate-y-1 shadow-[0_4px_0_rgba(255,255,255,0.05)]">
                                            {key}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-10 group hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-3 mb-8">
                                    <Shield className="w-5 h-5 text-primary opacity-40" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Complexity Level</span>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">Integrity Requirements</span>
                                        <span className={`text-md font-black uppercase ${getDifficultyColor(selectedModule.difficulty)}`}>{selectedModule.difficulty}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full bg-primary shadow-[0_0_15px_#00f5d4] transition-all duration-1000`} 
                                            style={{ width: selectedModule.difficulty === 'easy' ? '33%' : (selectedModule.difficulty === 'medium' ? '66%' : '100%') }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-10 mb-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6">
                                <Terminal className="w-5 h-5 text-white/5 group-hover:text-primary/20 transition-colors" />
                            </div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-4">Neural Packet Preview</span>
                            <div className="text-xl font-mono text-slate-400 bg-black/20 p-8 rounded-2xl border border-white/5 italic select-none">
                                {selectedModule.text}
                            </div>
                        </div>

                        {/* Execute Button */}
                        <button 
                            onClick={handleStartModule}
                            className="w-full group relative flex items-center justify-between p-10 bg-primary rounded-[40px] overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_20px_60px_rgba(0,245,212,0.25)]"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
                            <div className="relative z-10 flex items-center gap-8">
                                <div className="w-16 h-16 rounded-2xl bg-background-dark flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform duration-500">
                                    <Play className="w-7 h-7 text-primary fill-current" />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-black text-background-dark/50 uppercase tracking-widest mb-1">Execute Protocol</div>
                                    <div className="text-3xl lg:text-4xl font-black text-background-dark uppercase italic tracking-tighter">Initiate Protocol</div>
                                </div>
                            </div>
                            <ChevronRight className="w-12 h-12 text-background-dark relative z-10 group-hover:translate-x-3 transition-transform" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
