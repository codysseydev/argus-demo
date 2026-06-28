import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';

/** Persistent chrome: nav across the top, routed screen below. */
export function AppShell() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <NavBar />
      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
