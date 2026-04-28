import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/react';
import {
  LayoutDashboard, FileText, Wand2, Mail, User,
  LogOut, Briefcase, Menu, X, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useResume } from '../context/ResumeContext';

const NAV = [
  { to: '/resume-builder/dashboard',   icon: LayoutDashboard, label: 'Dashboard',    color: '#96e630' },
  { to: '/resume-builder/builder',     icon: FileText,         label: 'Resume Builder', color: '#c8f03e' },
  { to: '/resume-builder/templates',   icon: Briefcase,        label: 'Templates',   color: '#0ea5e9' },
  { to: '/resume-builder/career-lab',  icon: Wand2,            label: 'Career Lab',  color: '#22c55e' },
  { to: '/resume-builder/cover-letter',icon: Mail,             label: 'Cover Letter', color: '#f59e0b' },
  { to: '/resume-builder/profile',     icon: User,             label: 'Profile',     color: '#ec4899' },
];

function SaveIndicator({ isSaving, isDirty }) {
  if (isSaving) return (
    <span className="flex items-center gap-1.5 text-xs text-indigo-400">
      <span className="rb-save-dot" style={{ background: '#96e630' }} />
      Saving…
    </span>
  );
  if (isDirty) return (
    <span className="flex items-center gap-1.5 text-xs text-amber-400">
      <span className="rb-save-dot" style={{ background: '#f59e0b' }} />
      Unsaved
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
      <span className="rb-save-dot" style={{ background: '#22c55e' }} />
      Saved
    </span>
  );
}

function SidebarContent({ collapsed, onClose }) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();
  const { isSaving, isDirty } = useResume();

  const handleSignOut = async () => {
    await signOut();
    navigate('/resume-builder/dashboard');
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
             style={{ background: 'linear-gradient(135deg,#96e630,#c8f03e)', boxShadow: '0 4px 14px rgba(150,230,48,0.4)' }}>
          <Sparkles size={17} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white leading-tight">Resume Builder</div>
            <div className="text-xs" style={{ color: '#96e630' }}>AI-Powered</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose}
            className={({ isActive }) =>
              `rb-sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center !px-2' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={17} className="shrink-0" style={{ color: 'inherit' }} />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Save state */}
      {!collapsed && (
        <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <SaveIndicator isSaving={isSaving} isDirty={isDirty} />
        </div>
      )}

      {/* User footer */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl"
               style={{ background: 'rgba(255,255,255,0.04)' }}>
            {user.imageUrl
              ? <img src={user.imageUrl} className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30" alt="avatar" />
              : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                     style={{ background: 'linear-gradient(135deg,#96e630,#c8f03e)' }}>
                  {user.firstName?.[0] ?? '?'}
                </div>
            }
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs truncate" style={{ color: '#6b7280' }}>{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        )}
        <button onClick={handleSignOut}
          className={`rb-sidebar-link w-full hover:text-red-400 hover:!bg-red-500/10 ${collapsed ? 'justify-center !px-2' : ''}`}
          title="Sign out">
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="rb-root flex" style={{ background: 'var(--rb-bg)' }}>
      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 relative`}
        style={{
          width: collapsed ? '64px' : '228px',
          background: 'var(--rb-surface)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <SidebarContent collapsed={collapsed} />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center z-10"
          style={{
            background: 'var(--rb-surface-2)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#8892a4',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col z-10"
                 style={{ background: 'var(--rb-surface)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
              <X size={16} />
            </button>
            <SidebarContent collapsed={false} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 shrink-0"
                style={{ background: 'var(--rb-surface)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10">
            <Menu size={19} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#96e630,#c8f03e)' }}>
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">Resume Builder</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
