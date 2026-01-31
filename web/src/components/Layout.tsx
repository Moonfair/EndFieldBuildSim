import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-card sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900 hover:text-primary transition-colors">
            EndField Build Sim
          </Link>
          <span className="text-sm text-gray-500 hidden sm:inline">终末地百科</span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
