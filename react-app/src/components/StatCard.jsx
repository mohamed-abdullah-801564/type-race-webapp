export default function StatCard({ title, icon, value, valueSuffix, trend, trendLabel, subtitle }) {
    return (
        <div className="bg-white dark:bg-primary/5 p-6 rounded-xl border border-slate-200 dark:border-primary/10 relative overflow-hidden group">
            <div className="absolute top-4 right-4 text-primary opacity-70">
                {icon}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-primary/70 uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-4xl font-bold text-slate-900 dark:text-white">
                    {value}
                    {valueSuffix && <span className="text-2xl font-normal opacity-50">{valueSuffix}</span>}
                </h3>
                {trend && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {trend}
                    </span>
                )}
                {trendLabel && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {trendLabel}
                    </span>
                )}
            </div>
            <p className="text-xs text-slate-400 mt-4">{subtitle}</p>
        </div>
    );
}
