import { useAuth } from '@/lib/auth';
import { navigate, type Route } from '@/lib/router';
import { Pokeball } from '@/components/Badges';
import { Zap, BookOpen, Trophy, User, LogOut, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';

export function AppShell({ route, children }: { route: Route; children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: 'home', label: 'Trang chính', icon: Zap, path: '/' },
    { name: 'problems', label: 'Bài tập', icon: BookOpen, path: '/problems' },
    { name: 'league', label: 'Đấu trường', icon: Trophy, path: '/league' },
    { name: 'submissions', label: 'Lượt nộp', icon: BookOpen, path: '/submissions' },
  ];

  if (profile?.is_admin) {
    navItems.push({ name: 'admin', label: 'Admin', icon: Shield, path: '/admin' });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(10, 14, 20, 0.8)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 group"
          >
            <Pokeball size={32} className="group-hover:rotate-180 transition-transform duration-500" />
            <span className="font-pixel text-sm text-type-electric hidden sm:block">PokéJudge</span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = route.name === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
                  style={
                    active
                      ? { color: 'var(--type-electric)', backgroundColor: 'rgba(247, 208, 44, 0.1)' }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {profile && (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all"
                style={{ border: '1px solid var(--border-default)' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: 'var(--type-electric)', color: '#1a1a1a' }}
                >
                  {profile.username[0]?.toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {profile.username}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {profile.trainer_rank} · {profile.total_points}pts
                  </div>
                </div>
              </button>
            )}
            <button onClick={signOut} className="btn-ghost !px-2.5" title="Đăng xuất">
              <LogOut size={16} />
            </button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: 'var(--text-primary)' }}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden surface-2 px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
            {profile && (
              <>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <User size={16} />
                  {profile.username}
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium"
                  style={{ color: 'var(--type-fire)' }}
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">{children}</main>

      <footer
        className="border-t mt-12 py-6 text-center text-xs"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        PokéJudge — Online Judge chủ đề Pokémon · Dark Premium UI
      </footer>
    </div>
  );
}
