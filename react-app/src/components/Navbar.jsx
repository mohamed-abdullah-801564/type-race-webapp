import { Link, useLocation } from 'react-router-dom';
import { ChevronsRight, Bell, Settings } from 'lucide-react';

export default function Navbar() {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-primary/10 px-6 py-4 lg:px-20 bg-background-light dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-50">
            <div className="flex flex-1 items-center gap-4">
                <Link to="/" className="flex items-center gap-4">
                    <div className="text-primary">
                        <ChevronsRight className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Type<span className="text-primary text-2xl">.</span>Master
                    </h2>
                </Link>
            </div>

            <nav className="hidden md:flex gap-8 items-center text-sm font-medium">
                <Link to="/" className={`${currentPath === '/' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-500 hover:text-primary transition-colors'}`}>
                    Dashboard
                </Link>
                <Link to="/solo" className={`${currentPath === '/solo' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-500 hover:text-primary transition-colors'}`}>
                    Solo Mode
                </Link>
                <Link to="/multiplayer" className={`${currentPath === '/multiplayer' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-500 hover:text-primary transition-colors'}`}>
                    Multiplayer
                </Link>
            </nav>

            <div className="flex flex-1 justify-end items-center gap-4">
                <button className="p-2 rounded-lg bg-slate-100 dark:bg-primary/5 hover:bg-primary/10 transition-colors">
                    <Bell className="w-6 h-6 text-slate-600 dark:text-primary" />
                </button>
                <button className="p-2 rounded-lg bg-slate-100 dark:bg-primary/5 hover:bg-primary/10 transition-colors">
                    <Settings className="w-6 h-6 text-slate-600 dark:text-primary" />
                </button>
                <div className="h-10 w-10 rounded-full border-2 border-primary/30 p-0.5 overflow-hidden">
                    <img
                        alt="User Avatar"
                        className="h-full w-full rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyZ8GeGyhabNC6yspB1cJTkrXNLe87u0X4LYSEMZo_zYdp1HBc86chYAHMyMJFLCRUs_vaoTLHsfSSlkqlBlf49XrgC3qw83Rzt1WQqIVEOt7x1bp-rp2IxMz6cMBUfdMYeiHT90RS5icaXocgWAsfhuxNwo7cm04_0cpJNSy2q93Yk4pqsAkQ5EdzokS5Px7Uh4jY_N-YsR0OUGJyzoCgk7iAAUAKFQki70GArm-GDC-UaSo0bIWnffEEMl04i1eoLnqNomwdGFs"
                    />
                </div>
            </div>
        </header>
    );
}
