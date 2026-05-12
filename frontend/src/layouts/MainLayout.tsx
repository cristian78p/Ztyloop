import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';

interface MainLayoutProps {
  onCreatePost: () => void;
}

export function MainLayout({ onCreatePost }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar onCreatePost={onCreatePost} />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-20 sm:pb-6">
        <Outlet />
      </main>
      <MobileNav onCreatePost={onCreatePost} />
    </div>
  );
}
