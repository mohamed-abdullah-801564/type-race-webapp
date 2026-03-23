import { Zap } from 'lucide-react';

export default function PlayerProgressBar({ player, isCurrentUser }) {
    const { name, avatar, progress } = player;

    return (
        <div className={`flex flex-col gap-3 group ${isCurrentUser ? '' : 'opacity-80 hover:opacity-100 transition-opacity'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border overflow-hidden ${isCurrentUser ? 'bg-primary/20 border-primary/40' : 'bg-slate-800 border-slate-700'}`}>
                        <img alt={name} className="w-full h-full object-cover" src={avatar} />
                    </div>
                    <div>
                        <p className="text-slate-100 text-base font-bold leading-none mb-1">
                            {name} {isCurrentUser && <span className="text-xs font-normal text-primary/70 ml-2">(You)</span>}
                        </p>
                        <p className={`${isCurrentUser ? 'text-primary' : 'text-slate-400'} text-xs font-mono`}>
                            {progress}% Complete
                        </p>
                    </div>
                </div>
                {isCurrentUser && <Zap className="text-primary w-6 h-6" />}
            </div>
            <div className="h-3 w-full bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50">
                <div
                    className={`h-full rounded-full ${isCurrentUser ? 'bg-primary shadow-[0_0_12px_rgba(0,245,212,0.6)]' : 'bg-primary/40'}`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
}
