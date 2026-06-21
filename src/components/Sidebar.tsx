'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Cpu, 
  Network, 
  ShieldCheck, 
  BarChart2, 
  Database,
  GitBranch,
  Settings,
  Zap,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Scale
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useAuth } from './AuthProvider';

export default function Sidebar({ activeHref }: { activeHref?: string }) {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  
  const links = [
    { href: '/chat', label: 'Workspace', icon: MessageSquare },
    { href: '/agents', label: 'Agent Fleet', icon: Cpu },
    { href: '/workflows', label: 'Workflows', icon: Activity },
    { href: '/knowledge', label: 'Knowledge Base', icon: Database },
    { href: '/rules', label: 'Rule Engine', icon: Scale },
    { href: '/governance', label: 'Decision Map', icon: Network },
    { href: '/audit', label: 'Audit Center', icon: ShieldCheck },
    { href: '/lineage', label: 'Data Lineage', icon: GitBranch },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`h-full bg-card/80 backdrop-blur-xl border-r border-border flex flex-col shrink-0 transition-all duration-300 ${isOpen ? 'w-[280px]' : 'w-[80px]'}`}>
      <div className="p-4">
        <div className={`flex items-center mb-8 ${isOpen ? 'justify-between' : 'justify-center flex-col gap-4'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 shrink-0">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            {isOpen && <span className="text-xl font-semibold font-display truncate">Donna OS</span>}
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          >
            {isOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        {isOpen && <div className="mb-4"><ThemeSwitcher /></div>}

        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = activeHref === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors
                  ${isOpen ? 'gap-3' : 'justify-center'}
                  ${isActive 
                    ? 'bg-accent/10 text-accent border border-accent/20' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                title={!isOpen ? link.label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {isOpen && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={`mt-auto p-4 ${isOpen ? '' : 'flex justify-center'}`}>
        {loading ? (
          <div className={`bg-background border border-border p-2 rounded-2xl flex items-center gap-3 animate-pulse ${isOpen ? 'w-full' : 'w-fit'}`}>
            <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
            {isOpen && (
              <div className="min-w-0 flex-1">
                <div className="h-4 bg-muted rounded w-20 mb-2" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            )}
          </div>
        ) : user ? (
          <div className={`bg-background border border-border p-2 rounded-2xl flex items-center gap-3 ${isOpen ? '' : 'justify-center flex-col'}`}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-background shadow-sm shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/50 border-2 border-background shadow-sm shrink-0" />
            )}
            {isOpen && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-foreground">{user.displayName || 'Agent'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <button onClick={logout} className="text-xs text-muted-foreground hover:text-red-400 p-1 shrink-0">
                  Logout
                </button>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/auth"
            className={`bg-accent text-accent-foreground hover:bg-accent/90 border border-border p-3 rounded-2xl flex items-center justify-center font-medium transition-colors ${isOpen ? 'w-full gap-2' : 'w-10 h-10'}`}
          >
            {isOpen ? 'Sign In' : <Zap size={16} />}
          </Link>
        )}
      </div>
    </aside>
  );
}
