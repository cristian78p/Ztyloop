import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

interface MobileNavProps {
  onCreatePost: () => void;
}

export function MobileNav({ onCreatePost }: MobileNavProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;

  const item = (to: string, label: string, icon: React.ReactNode) => (
    <Link
      to={to}
      className={cn(
        'flex flex-col items-center gap-0.5 text-[10px] transition-colors',
        pathname === to ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-card px-4 sm:hidden">
      {item(
        '/feed',
        'Feed',
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>,
      )}
      {item(
        '/explore',
        'Explorar',
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>,
      )}

      <button
        onClick={onCreatePost}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-opacity hover:opacity-85 active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {item(
        '/saved',
        'Guardados',
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>,
      )}
      {item(
        `/profile/${user.username}`,
        'Perfil',
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>,
      )}
    </nav>
  );
}
