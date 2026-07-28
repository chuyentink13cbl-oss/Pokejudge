import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';
import type { Profile, Submission, Problem } from '@/lib/types';
import { TYPE_META, STATUS_META } from '@/lib/meta';
import { GymBadge, Pokeball, StatusBadge, TypeBadge } from '@/components/Badges';
import { Flame, Target, Trophy, TrendingUp, Calendar } from 'lucide-react';

const BADGES = [
  { code: 'I', label: 'Huy hiệu Đá', req: 1 },
  { code: 'II', label: 'Huy hiệu Nước', req: 3 },
  { code: 'III', label: 'Huy hiệu Điện', req: 5 },
  { code: 'IV', label: 'Huy hiệu Cỏ', req: 8 },
  { code: 'V', label: 'Huy hiệu Lửa', req: 12 },
  { code: 'VI', label: 'Huy hiệu Tâm Linh', req: 16 },
  { code: 'VII', label: 'Huy hiệu Băng', req: 20 },
  { code: 'VIII', label: 'Huy hiệu Rồng', req: 25 },
];

const RANKS = [
  { rank: 'Trainer Mới', min: 0, icon: '🌱' },
  { rank: 'Trainer', min: 100, icon: '⚔️' },
  { rank: 'Ace Trainer', min: 500, icon: '⚡' },
  { rank: 'Elite Four', min: 1500, icon: '👑' },
  { rank: 'Champion', min: 3000, icon: '🏆' },
];

export function ProfilePage({ userId }: { userId?: string }) {
  const { profile: ownProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [problems, setProblems] = useState<Record<string, Problem>>({});
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const targetId = userId ?? ownProfile?.id;

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data as Profile | null);
        setLoading(false);
      });

    supabase
      .from('submissions')
      .select('*')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setSubmissions(data ?? []));

    supabase
      .from('user_badges')
      .select('badge_code')
      .eq('user_id', targetId)
      .then(({ data }) => setBadges(data?.map((b) => b.badge_code) ?? []));

    supabase
      .from('problems')
      .select('*')
      .then(({ data }) => {
        const map: Record<string, Problem> = {};
        data?.forEach((p) => (map[p.id] = p));
        setProblems(map);
      });
  }, [targetId]);

  if (loading) {
    return (
      <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface-2)' }} />
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p style={{ color: 'var(--text-muted)' }}>Không tìm thấy Trainer.</p>
      </div>
    );
  }

  const currentRank = [...RANKS].reverse().find((r) => r.min <= profile.total_points);
  const nextRank = RANKS.find((r) => r.min > profile.total_points);
  const isOwn = ownProfile?.id === profile.id;
  const streakEgg =
    profile.current_streak === 0 ? '🥚' :
    profile.current_streak < 3 ? '🐣' :
    profile.current_streak < 7 ? '🐥' :
    profile.current_streak < 14 ? '🐤' : '🦅';

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="surface-2 rounded-2xl p-8 relative overflow-hidden animate-fade-in-up">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at top right, ${TYPE_META.dragon.glow}, transparent 60%)`,
          }}
        />
        <div className="relative flex flex-col sm:flex-row items-start gap-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--type-electric), var(--type-fire))',
              color: '#1a1a1a',
              boxShadow: '0 0 32px -8px var(--type-electric-glow)',
            }}
          >
            {profile.username[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{profile.username}</h1>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{currentRank?.icon}</span>
              <span className="font-semibold text-type-electric">{profile.trainer_rank}</span>
              {profile.is_admin && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ color: 'var(--type-dragon)', backgroundColor: 'rgba(111, 53, 252, 0.15)' }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat icon={<TrendingUp size={15} />} label="Điểm" value={profile.total_points} color="var(--type-electric)" />
              <Stat icon={<Target size={15} />} label="Đã giải" value={profile.solved_count} color="var(--type-grass)" />
              <Stat icon={<Flame size={15} />} label="Streak" value={`${profile.current_streak} ${streakEgg}`} color="var(--type-fire)" />
              <Stat icon={<Trophy size={15} />} label="Kỷ lục" value={profile.longest_streak} color="var(--type-dragon)" />
            </div>
          </div>
        </div>
      </div>

      {/* Rank progression */}
      <div className="surface-2 rounded-2xl p-6 animate-fade-in-up">
        <h2 className="text-lg font-bold mb-4">Trainer Rank</h2>
        <div className="flex items-center gap-2 mb-3">
          {RANKS.map((r) => (
            <div key={r.rank} className="flex-1 text-center">
              <div className="text-xl mb-1">{r.icon}</div>
              <div
                className="text-[10px] mb-1.5"
                style={{ color: profile.total_points >= r.min ? 'var(--type-electric)' : 'var(--text-muted)' }}
              >
                {r.rank}
              </div>
              <div
                className="h-1.5 rounded-full"
                style={{ backgroundColor: profile.total_points >= r.min ? 'var(--type-electric)' : 'var(--border-subtle)' }}
              />
            </div>
          ))}
        </div>
        {nextRank && (
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Còn <span className="font-bold text-type-electric">{nextRank.min - profile.total_points} pts</span> để lên {nextRank.rank}
          </p>
        )}
      </div>

      {/* Gym badges */}
      <div className="surface-2 rounded-2xl p-6 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <Pokeball size={24} />
          <h2 className="text-lg font-bold">Huy hiệu Gym</h2>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {badges.length}/{BADGES.length}
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
          {BADGES.map((b) => (
            <div key={b.code} className="flex flex-col items-center">
              <GymBadge code={b.code} label={b.label} unlocked={badges.includes(b.code)} size={56} />
              {!badges.includes(b.code) && (
                <span className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {b.req} bài
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent submissions */}
      <div className="surface-2 rounded-2xl p-6 animate-fade-in-up">
        <h2 className="text-lg font-bold mb-4">Lượt nộp gần đây</h2>
        {submissions.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
            Chưa có lượt nộp nào. {isOwn && 'Bắt đầu giải bài tại '}
            {isOwn && (
              <button onClick={() => navigate('/problems')} className="text-type-electric font-semibold">
                danh sách bài
              </button>
            )}
          </p>
        ) : (
          <div className="space-y-2">
            {submissions.map((s) => {
              const prob = problems[s.problem_id];
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={s.status} />
                    <button
                      onClick={() => prob && navigate(`/problem/${prob.slug}`)}
                      className="text-sm font-semibold truncate hover:text-type-electric transition-colors text-left"
                    >
                      {prob?.title ?? 'Bài đã xoá'}
                    </button>
                    {prob && <TypeBadge type={prob.difficulty_type} />}
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                    <span>{s.language_name}</span>
                    {s.exec_time_ms !== null && <span>{s.exec_time_ms}ms</span>}
                    <Calendar size={12} />
                    {new Date(s.created_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5" style={{ color }}>
        {icon}
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
