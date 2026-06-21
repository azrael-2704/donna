'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "var(--background)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="1" y="1" width="20" height="20" rx="3" stroke="var(--accent)" strokeWidth="1.2" />
            <circle cx="11" cy="11" r="3.5" fill="var(--accent)" />
            <circle cx="5" cy="5" r="1.2" fill="var(--accent)" opacity="0.5" />
            <circle cx="17" cy="5" r="1.2" fill="var(--accent)" opacity="0.5" />
            <circle cx="5" cy="17" r="1.2" fill="var(--accent)" opacity="0.5" />
            <circle cx="17" cy="17" r="1.2" fill="var(--accent)" opacity="0.5" />
            <line x1="5" y1="5" x2="11" y2="11" stroke="var(--accent)" strokeWidth="0.8" opacity="0.35" />
            <line x1="17" y1="5" x2="11" y2="11" stroke="var(--accent)" strokeWidth="0.8" opacity="0.35" />
            <line x1="5" y1="17" x2="11" y2="11" stroke="var(--accent)" strokeWidth="0.8" opacity="0.35" />
            <line x1="17" y1="17" x2="11" y2="11" stroke="var(--accent)" strokeWidth="0.8" opacity="0.35" />
          </svg>
          <span
            className="text-foreground text-[1.05rem] tracking-[-0.02em]"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600 }}
          >
            donna
          </span>
        </div>

        <div className="hidden md:flex items-center gap-9">
          {["Platform", "Governance", "Pricing", "Docs"].map((l) => (
            <a
              key={l}
              href="#"
              className="text-sm transition-colors duration-200 text-muted-foreground hover:text-foreground font-sans"
            >
              {l}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-5">
          <Link
            href="/auth"
            className="text-sm transition-colors duration-200 text-muted-foreground hover:text-foreground font-sans"
          >
            Sign in
          </Link>
          <Link
            href="/chat"
            className="text-sm px-5 py-2 transition-all duration-200 bg-foreground text-background hover:bg-accent rounded font-sans font-medium"
          >
            Start Building
          </Link>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col gap-5">
            {["Platform", "Governance", "Pricing", "Docs"].map((l) => (
              <a key={l} href="#" className="text-sm text-muted-foreground font-sans">
                {l}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-3">
              <Link href="/auth" className="text-sm text-muted-foreground font-sans text-left">
                Sign in
              </Link>
              <Link
                href="/chat"
                className="text-sm px-5 py-2.5 w-fit bg-foreground text-background font-sans font-medium rounded"
              >
                Start Building
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
