import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Beaker, ShieldAlert, Zap, Menu, X, Sun, Moon, Calculator, Globe } from 'lucide-react';
import { useCurrency, CURRENCIES, type CurrencyCode } from '../context/CurrencyContext';

export default function Layout() {
  const location = useLocation();
  const [isGlobalOptimizing, setIsGlobalOptimizing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const { currencyCode, setCurrencyCode } = useCurrency();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/products', label: 'Product Catalog', icon: Package },
    { path: '/simulation', label: 'Simulation Lab', icon: Beaker },
    { path: '/predict', label: 'Manual Predict', icon: Calculator },
    { path: '/sales', label: 'Sales Forecast', icon: Calculator },
    { path: '/safety', label: 'Safety Rails', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 border-r border-border surface p-6 flex flex-col glass-panel z-30 fixed lg:static inset-y-0 left-0 transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <Zap size={24} className="animate-pulse-glow" />
            </div>
            <Link to={'/'} className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              PriceFlow AI
            </Link>
          </div>
          <button 
            className="lg:hidden text-text-secondary hover:text-text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-primary/20 text-primary font-medium border border-primary/30' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-border flex flex-col gap-4">
          {/* Mobile Currency Selector */}
          <div className="sm:hidden flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
            <Globe size={16} className="text-text-secondary" />
            <select 
              value={currencyCode} 
              onChange={(e) => setCurrencyCode(e.target.value as CurrencyCode)}
              className="bg-transparent text-sm text-text-primary focus:outline-none w-full"
            >
              {Object.values(CURRENCIES).map(c => (
                <option key={c.code} value={c.code} className="bg-surface">{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-text-secondary">
            <div className="flex items-center justify-between mb-2">
              <span>Status</span>
              <span className="flex items-center gap-1.5 text-accent-success text-xs bg-accent-success/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse"></span>
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Mode</span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border">
                <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse"></span>
                <span className="text-xs font-medium text-text-primary">Shadow</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 border-b border-border surface/80 glass-panel flex items-center justify-between px-4 lg:px-8 z-10">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden text-text-secondary hover:text-text-primary p-1"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold capitalize hidden sm:block">
              {location.pathname === '/' ? 'Overview Dashboard' : location.pathname.slice(1).replace('-', ' ')}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-surface border border-border rounded-lg px-2 py-1.5">
              <Globe size={16} className="text-text-secondary" />
              <select 
                value={currencyCode} 
                onChange={(e) => setCurrencyCode(e.target.value as CurrencyCode)}
                className="bg-transparent text-sm text-text-primary focus:outline-none"
              >
                {Object.values(CURRENCIES).map(c => (
                  <option key={c.code} value={c.code} className="bg-surface">{c.code} ({c.symbol})</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-text-secondary hover:text-primary transition-colors rounded-lg bg-surface border border-border"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => {
                setIsGlobalOptimizing(true);
                setTimeout(() => setIsGlobalOptimizing(false), 2000);
              }}
              disabled={isGlobalOptimizing}
              className="px-3 sm:px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2"
            >
              {isGlobalOptimizing ? (
                <><span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span> <span className="hidden sm:inline">Running...</span></>
              ) : (
                <><span className="hidden sm:inline">Run Global Optimization</span><span className="sm:hidden">Optimize</span></>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none -z-10" />
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
