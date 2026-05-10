import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Beaker, ShieldAlert, Zap,
  Menu, X, Sun, Moon, Calculator, Globe, BarChart3,
  TrendingUp, CheckCircle, AlertCircle,
} from 'lucide-react';
import { useCurrency, CURRENCIES, type CurrencyCode } from '../context/CurrencyContext';
import { api } from '../api/client';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; type: ToastType; message: string; }

export default function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { currencyCode, setCurrencyCode } = useCurrency();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleGlobalOptimize = async () => {
    setIsOptimizing(true);
    try {
      const result = await api.optimizeBatch();
      const { summary } = result;
      addToast(
        'success',
        `Optimized ${summary.total_products} products · +${summary.revenue_lift.toFixed(1)}% projected revenue lift`
      );
    } catch {
      addToast('error', 'Could not reach the API — is the backend running?');
    } finally {
      setIsOptimizing(false);
    }
  };

  const navItems = [
    { path: '/',           label: 'Dashboard',      icon: LayoutDashboard },
    { path: '/products',   label: 'Product Catalog', icon: Package },
    { path: '/simulation', label: 'Simulation Lab',  icon: Beaker },
    { path: '/predict',    label: 'Price Predict',   icon: Calculator },
    { path: '/sales',      label: 'Sales Forecast',  icon: BarChart3 },
    { path: '/safety',     label: 'Safety Rails',    icon: ShieldAlert },
  ];

  // Active check: exact for '/', startsWith for others
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const pageTitle = navItems.find((n) => isActive(n.path))?.label ?? 'PriceFlow AI';

  return (
    <div className="min-h-screen bg-background text-text-primary flex overflow-hidden">
      {/* ── Toast Notifications ───────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-fade-in pointer-events-auto max-w-sm ${
              t.type === 'success'
                ? 'bg-bg-secondary border-accent-success/30 text-accent-success'
                : t.type === 'error'
                ? 'bg-bg-secondary border-accent-danger/30 text-accent-danger'
                : 'bg-bg-secondary border-primary/30 text-primary'
            }`}
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            {t.type === 'success' ? (
              <CheckCircle size={16} className="shrink-0" />
            ) : t.type === 'error' ? (
              <AlertCircle size={16} className="shrink-0" />
            ) : (
              <TrendingUp size={16} className="shrink-0" />
            )}
            <span className="text-text-primary">{t.message}</span>
          </div>
        ))}
      </div>

      {/* ── Mobile Overlay ────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside
        className={`w-64 border-r border-border flex flex-col z-30 fixed lg:static inset-y-0 left-0 transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/20 rounded-lg text-primary">
              <Zap size={20} />
            </div>
            <Link
              to="/"
              className="text-lg font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}
            >
              PriceFlow AI
            </Link>
          </div>
          <button
            className="lg:hidden text-text-secondary hover:text-text-primary p-1"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                style={active ? {
                  backgroundColor: 'rgb(59 130 246 / 0.12)',
                  border: '1px solid rgb(59 130 246 / 0.25)',
                } : {
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-5 py-4 border-t border-border space-y-3">
          {/* Currency (mobile) */}
          <div className="sm:hidden flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
            <Globe size={14} className="text-text-secondary" />
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value as CurrencyCode)}
              className="bg-transparent text-sm text-text-primary focus:outline-none w-full"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* System status */}
          <div className="text-xs space-y-2">
            <div className="flex items-center justify-between text-text-secondary">
              <span>System Status</span>
              <span className="flex items-center gap-1.5 text-accent-success">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
                Live
              </span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span>Rollout Mode</span>
              <span className="text-xs font-medium text-text-primary px-2 py-0.5 rounded-full border border-border"
                style={{ backgroundColor: 'var(--surface)' }}>
                Shadow
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0 z-10"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 text-text-secondary hover:text-text-primary"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <h2 className="text-base font-semibold text-text-primary hidden sm:block">
              {pageTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {/* Currency selector (desktop) */}
            <div className="hidden sm:flex items-center gap-1.5 border border-border rounded-lg px-2.5 py-1.5 text-sm"
              style={{ backgroundColor: 'var(--surface)' }}>
              <Globe size={14} className="text-text-secondary" />
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value as CurrencyCode)}
                className="bg-transparent text-text-primary focus:outline-none text-sm"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                ))}
              </select>
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-text-secondary hover:text-primary transition-colors rounded-lg border border-border"
              style={{ backgroundColor: 'var(--surface)' }}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Global Optimize CTA */}
            <button
              onClick={handleGlobalOptimize}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-60"
              style={{
                background: isOptimizing
                  ? 'rgb(59 130 246 / 0.5)'
                  : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                boxShadow: '0 0 20px rgb(59 130 246 / 0.25)',
              }}
            >
              {isOptimizing ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span className="hidden sm:inline">Running…</span>
                </>
              ) : (
                <>
                  <Zap size={15} />
                  <span className="hidden sm:inline">Optimize All</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          <div
            className="absolute inset-0 pointer-events-none -z-10 opacity-40"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 70% 10%, rgb(59 130 246 / 0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 30% 80%, rgb(139 92 246 / 0.05) 0%, transparent 70%)',
            }}
          />
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
