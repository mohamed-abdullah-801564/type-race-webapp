import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Trophy } from 'lucide-react';

const TOAST_STYLES = {
    success: {
        icon: CheckCircle,
        color: 'text-primary',
        borderColor: 'border-primary/40',
        label: 'SYSTEM OK'
    },
    error: {
        icon: XCircle,
        color: 'text-red-400',
        borderColor: 'border-red-500/40',
        label: 'ERROR'
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        label: 'WARNING'
    },
    info: {
        icon: Info,
        color: 'text-cyan-400',
        borderColor: 'border-cyan-500/40',
        label: 'INFO'
    },
    achievement: {
        icon: Trophy,
        color: 'text-yellow-400',
        borderColor: 'border-yellow-500/40',
        label: 'ACHIEVEMENT UNLOCKED',
        glow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
        bar: 'bg-yellow-500'
    }
};

function Toast({ toast, onRemove }) {
    const [visible, setVisible] = useState(false);
    const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
    const Icon = style.icon;

    useEffect(() => {
        const entryTimer = setTimeout(() => setVisible(true), 10);
        const exitTimer = setTimeout(() => setVisible(false), 2600);
        return () => {
            clearTimeout(entryTimer);
            clearTimeout(exitTimer);
        };
    }, []);

    return (
        <div 
            className={`bg-slate-900/95 backdrop-blur-xl border ${style.borderColor} rounded-2xl p-4 w-80 flex items-start gap-4 relative overflow-hidden transition-all duration-500 shadow-2xl ${style.glow || ''} ${
                visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
        >
            <div className={`${style.color} mt-0.5`}>
                <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 flex flex-col gap-1">
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${style.color}`}>
                    {style.label}
                </span>
                <p className="text-xs font-medium text-slate-300 leading-relaxed">
                    {toast.message}
                </p>
            </div>

            <button 
                onClick={() => onRemove(toast.id)}
                className="text-slate-500 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-[2px] bg-white/10 w-full" />
            <div 
                className={`absolute bottom-0 left-0 h-[2px] opacity-60 ${style.bar || style.color.replace('text-', 'bg-')}`}
                style={{
                    animation: 'toast-drain 3s linear forwards'
                }}
            />
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes toast-drain {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            ` }} />
        </div>
    );
}

export default function ToastContainer({ toasts, removeToast }) {
    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end pointer-events-none">
            <div className="flex flex-col gap-3 items-end pointer-events-auto">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </div>
    );
}
