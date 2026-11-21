export default function StatCard({ title, icon, value, valueSuffix, trend, trendLabel, subtitle }) {
    return (
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-5 right-5 text-primary opacity-80 group-hover:scale-105 transition-transform">
                {icon}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
            <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
                    {value}
                    {valueSuffix && <span className="text-xl font-normal opacity-50 ml-1">{valueSuffix}</span>}
                </h3>
                {trend && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                        {trend}
                    </span>
                )}
                {trendLabel && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                        {trendLabel}
                    </span>
                )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{subtitle}</p>
        </div>
    );
}
