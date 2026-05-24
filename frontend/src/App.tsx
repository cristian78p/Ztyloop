import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { LandingPage } from '@/pages/landing/LandingPage';
import { FeedPage } from '@/pages/feed/FeedPage';
import { ExplorePage } from '@/pages/explore/ExplorePage';
import { PostDetailPage } from '@/pages/post/PostDetailPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { EditProfilePage } from '@/pages/profile/EditProfilePage';
import { SavedPage } from '@/pages/saved/SavedPage';
import { CreatePostModal } from '@/components/posts/CreatePostModal';
import type { ReactNode } from 'react';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function LandingOrFeed() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }
  return user ? <Navigate to="/feed" replace /> : <LandingPage />;
}

export default function App() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingOrFeed />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route
          element={
            <PrivateRoute>
              <MainLayout onCreatePost={() => setCreateOpen(true)} />
            </PrivateRoute>
          }
        >
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/saved" element={<SavedPage />} />
        </Route>
      </Routes>

      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </AuthProvider>
  );
}
