import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils/cn';

interface NavbarProps {
  onCreatePost: () => void;
}

function ZZLogo() {
  return (
    <svg viewBox="0 0 80 64" width="38" height="30" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="ZTYLOOP">
      <path fillRule="evenodd" clipRule="evenodd" d="M2 4h42v12L24 52h20v8H2v-8l20-36H2V4zm34 0h42v12L58 52h20v8H36v-8l20-36H36V4z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function Navbar({ onCreatePost }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={cn(
        'text-sm transition-colors',
        pathname === to
          ? 'font-semibold text-primary border-b-2 border-primary pb-0.5'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        {/* Brand */}
        <Link to={user ? '/feed' : '/'} className="text-primary hover:opacity-80 transition-opacity" title="ZTYLOOP">
          <ZZLogo />
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              {navLink('/feed', 'Feed')}
              {navLink('/explore', 'Explorar')}
              {navLink('/saved', 'Guardados')}

              <button onClick={onCreatePost} className="btn-primary gap-1 px-3 py-1.5 text-xs">
                <PlusIcon /> Publicar
              </button>

              <Link
                to={`/profile/${user.username}`}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold transition-opacity hover:opacity-80',
                  pathname.startsWith('/profile') && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
                )}
                title={user.displayName}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} className="h-8 w-8 rounded-full object-cover" alt="" />
                ) : (
                  user.displayName[0]?.toUpperCase()
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              {navLink('/explore', 'Explorar')}
              <Link to="/login" className="btn-outline px-3 py-1.5 text-xs">Entrar</Link>
              <Link to="/register" className="btn-primary px-3 py-1.5 text-xs">Registrarse</Link>
            </>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn-ghost p-2"
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </div>
    </header>
  );
}
