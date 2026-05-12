import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-black tracking-widest text-foreground">ZTYLOOP</h1>
          <p className="mt-2 text-sm text-muted-foreground">Red social de moda</p>
        </div>
        <div className="card p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
