import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';

/** Persistent chrome: nav across the top, routed screen below. */
export function AppShell() {
  return (
    <div className="min-h-screen bg-blue-midnight text-white-whisper">
      <NavBar />
      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
