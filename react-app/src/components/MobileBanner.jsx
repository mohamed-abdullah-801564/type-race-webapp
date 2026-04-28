import { Monitor } from 'lucide-react';

export default function MobileBanner() {
    return (
        <div className="md:hidden mx-4 mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
            <Monitor className="text-amber-400 w-5 h-5 shrink-0" />
            <p className="text-xs font-bold text-amber-400 leading-relaxed">
                For the best typing experience, use a physical keyboard on a desktop device.
            </p>
        </div>
    );
}
