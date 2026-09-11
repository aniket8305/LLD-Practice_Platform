import { Link, Outlet } from 'react-router-dom';
import { BookOpen, History, Home } from 'lucide-react';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-lg text-gray-900">LLD Practice</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                Problems
              </Link>
              <Link
                to="/history"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <History className="w-4 h-4" />
                History
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
