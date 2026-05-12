import { Link } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';

function ZZLogo({ width = 38 }: { width?: number }) {
  return (
    <svg viewBox="0 0 80 64" width={width} height={Math.round(width * 0.8)} fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="ZTYLOOP">
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

const SHOWCASE = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
  'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
];

const STATS = [
  { value: '12K+', label: 'Outfits publicados' },
  { value: '4.8K+', label: 'Creadores activos' },
  { value: '98K+', label: 'Votos emitidos' },
];

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    title: 'Comparte tu estilo',
    description: 'Publica fotos de tus outfits y etiqueta cada prenda con enlace directo a la tienda.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: 'Vota lo mejor',
    description: 'La comunidad elige los outfits más icónicos. Los mejores ascienden al top del feed.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Sigue creadores',
    description: 'Encuentra perfiles que inspiren tu estilo y recibe su contenido en tu feed personal.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
    title: 'Descubre tendencias',
    description: 'Explora por categoría — Streetwear, Vintage, Y2K, Minimal — y encuentra tu próximo look.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: 'Guarda tus favoritos',
    description: 'Guarda los outfits que más te inspiran para revisarlos cuando quieras.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Comenta y conecta',
    description: 'Deja comentarios, responde hilos y conecta con personas que comparten tu gusto.',
  },
];

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <span className="text-primary"><ZZLogo /></span>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost p-2">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link to="/login" className="btn-outline px-4 py-1.5 text-sm">Entrar</Link>
            <Link to="/register" className="btn-primary px-4 py-1.5 text-sm">Registrarse</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Decorative background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl px-5 pt-20 pb-16 text-center">
          <span className="badge-primary mb-5 inline-flex gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="mt-px">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
            </svg>
            La red social de moda
          </span>

          <h1 className="font-serif text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Tu estilo,<br />
            <span className="text-gradient">tu comunidad.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
            Comparte outfits, descubre tendencias y conecta con miles de amantes de la moda.
            Vota los mejores looks y etiqueta cada prenda de tu armario.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register" className="btn-primary px-8 py-3 text-base shadow-lg hover-lift">
              Comenzar gratis
            </Link>
            <Link to="/explore" className="btn-outline px-8 py-3 text-base">
              Explorar looks
            </Link>
          </div>

          {/* Social proof numbers */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-serif text-3xl font-bold text-foreground">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Outfit showcase grid ───────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-4 pb-16">
        <div className="overflow-hidden rounded-2xl">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
            {SHOWCASE.map((src, i) => (
              <div
                key={i}
                className="group relative aspect-square overflow-hidden bg-muted"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-primary/0 transition-all duration-300 group-hover:bg-primary/15" />
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Outfits reales de nuestra comunidad
        </p>
      </section>

      {/* ── Features grid ──────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="font-serif text-center text-3xl font-semibold mb-3">
          Todo lo que necesitas
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto text-sm">
          Una plataforma diseñada para que tu estilo sea el protagonista.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card p-5 hover-lift cursor-default"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {f.icon}
              </div>
              <h3 className="font-serif text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-8 pb-16">
        <div className="relative overflow-hidden rounded-2xl profile-banner-placeholder p-12 text-center">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
              ¿Listo para unirte?
            </h2>
            <p className="mt-3 text-white/80 text-sm">
              Crea tu cuenta gratis en segundos. Sin tarjeta de crédito.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register" className="btn-primary px-8 py-3 text-base shadow-xl">
                Crear cuenta gratis
              </Link>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors">
                Ya tengo cuenta →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-5">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-primary"><ZZLogo width={30} /></span>
          <div className="flex gap-5 text-xs text-muted-foreground">
            <Link to="/explore" className="hover:text-foreground transition-colors">Explorar</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Registro</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ZTYLOOP</p>
        </div>
      </footer>
    </div>
  );
}
