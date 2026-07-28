import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Pokeball } from '@/components/Badges';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, username);
    setBusy(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <Pokeball size={64} className="mb-4 glow-electric rounded-full" />
          <h1 className="font-pixel text-2xl mb-2 text-type-electric">PokéJudge</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Giải bài toán, thu thập Huy hiệu Gym, trở thành Champion
          </p>
        </div>

        <div className="surface-2 rounded-2xl p-8 animate-fade-in-up">
          <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-surface-1)' }}>
            <button
              onClick={() => setMode('signup')}
              className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all"
              style={
                mode === 'signup'
                  ? { backgroundColor: 'var(--bg-surface-3)', color: 'var(--type-electric)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              Đăng ký
            </button>
            <button
              onClick={() => setMode('signin')}
              className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all"
              style={
                mode === 'signin'
                  ? { backgroundColor: 'var(--bg-surface-3)', color: 'var(--type-electric)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              Đăng nhập
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Tên Trainer
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={20}
                  className="input-field"
                  placeholder="ash_ketchum"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="trainer@pokejudge.io"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                className="text-sm rounded-lg p-3"
                style={{
                  color: 'var(--type-fire)',
                  backgroundColor: 'rgba(238, 129, 48, 0.1)',
                  border: '1px solid var(--type-fire)',
                }}
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'Đang xử lý...' : mode === 'signup' ? 'Bắt đầu hành trình' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Đăng ký để tự động tạo hồ sơ Trainer. Không cần xác nhận email.
        </p>
      </div>
    </div>
  );
}
