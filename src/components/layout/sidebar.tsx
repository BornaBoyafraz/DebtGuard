'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FlaskConical,
  Bot,
  History,
  Settings2,
  LogOut,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useAuthContext } from '@/contexts/auth-context';
import { useFinancialStore } from '@/store/financial-store';
import { useUIStore } from '@/store/ui-store';
import { Badge } from '@/components/ui/badge';
import { AriaAvatar } from '@/components/chat/aria-avatar';

const navItems = [
  { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Simulate', href: '/app/simulate', icon: FlaskConical },
  { label: 'AI Advisor', href: '/app/chat', icon: Bot },
  { label: 'History', href: '/app/history', icon: History },
  { label: 'Settings', href: '/app/settings', icon: Settings2 },
];

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L3 7V12C3 17.25 6.75 22.03 12 23C17.25 22.03 21 17.25 21 12V7L12 2Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M12 2L3 7V12C3 17.25 6.75 22.03 12 23C17.25 22.03 21 17.25 21 12V7L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 6L8 8.5V12C8 14.75 9.75 17.27 12 18C14.25 17.27 16 14.75 16 12V8.5L12 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { logout: supabaseLogout } = useAuthContext();
  const { riskAnalysis } = useFinancialStore();
  const { sidebarOpen, setSidebarOpen, toggleAriaChat, ariaChatUnread } = useUIStore();

  const closeSidebar = () => setSidebarOpen(false);

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const sidebarContent = (
    <aside className="flex h-full w-[240px] flex-col bg-surface border-r border-border">
      {/* Logo section */}
      <div className="flex items-center gap-2.5 py-5 px-5">
        <Link
          href="/app/dashboard"
          className="flex items-center gap-2.5"
          onClick={closeSidebar}
        >
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <ShieldIcon className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="text-lg font-bold text-text-primary">DebtGuard</span>
        </Link>
        <button
          onClick={closeSidebar}
          className="ml-auto md:hidden text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 mx-3 rounded-lg text-sm font-medium transition-all duration-150 relative',
                isActive
                  ? 'bg-accent-subtle text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 bg-accent-subtle rounded-lg"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="w-[18px] h-[18px] relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}

        {/* Aria toggle — not a route, toggles the floating panel */}
        <button
          onClick={() => {
            closeSidebar();
            toggleAriaChat();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 mx-3 rounded-lg text-sm font-medium transition-all duration-150 text-text-secondary hover:text-text-primary hover:bg-surface-elevated relative"
          style={{ width: 'calc(100% - 24px)' }}
        >
          <div className="relative w-[18px] h-[18px] shrink-0">
            <AriaAvatar size="sm" />
            {ariaChatUnread && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full" />
            )}
          </div>
          <span>The Chef</span>
          <span className="ml-auto text-[10px] text-text-muted">⌘J</span>
        </button>
      </nav>

      {/* Risk widget */}
      {riskAnalysis && (
        <div className="px-4 pb-3">
          <div className="rounded-lg border border-border bg-surface-elevated p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">
                Risk Score
              </span>
              <Badge
                variant={
                  riskAnalysis.level === 'low'
                    ? 'low'
                    : riskAnalysis.level === 'medium'
                      ? 'medium'
                      : riskAnalysis.level === 'high'
                        ? 'high'
                        : 'critical'
                }
              >
                {riskAnalysis.level.toUpperCase()}
              </Badge>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span
                className={cn(
                  'text-xl font-bold',
                  riskAnalysis.level === 'low'
                    ? 'text-success'
                    : riskAnalysis.level === 'medium'
                      ? 'text-warning'
                      : riskAnalysis.level === 'high'
                        ? 'text-danger'
                        : 'text-danger'
                )}
              >
                {riskAnalysis.score}
              </span>
              <span className="text-xs text-text-muted">/100</span>
              <span
                className={cn(
                  'ml-auto w-2 h-2 rounded-full',
                  riskAnalysis.level === 'low'
                    ? 'bg-success'
                    : riskAnalysis.level === 'medium'
                      ? 'bg-warning'
                      : riskAnalysis.level === 'high'
                        ? 'bg-danger'
                        : 'bg-danger'
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* User section */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-subtle flex items-center justify-center text-accent text-sm font-semibold shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-text-muted truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
          <button
            onClick={() => {
              void supabaseLogout().then(() => router.push('/'));
            }}
            className="text-text-muted hover:text-danger transition-colors cursor-pointer shrink-0"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block w-[240px] shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={closeSidebar}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed top-0 left-0 z-50 h-full md:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
