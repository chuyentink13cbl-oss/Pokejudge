import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';
import type { Problem, Submission } from '@/lib/types';
import { TYPE_META } from '@/lib/meta';
import { TypeBadge, Pokeball, GymBadge } from '@/components/Badges';
import { BookOpen, Trophy, Flame, Target, TrendingUp, ChevronRight } from 'lucide-react';

const RANK_THRESHOLDS = [
  { rank: 'Trainer Mới', min: 0 },
  { rank: 'Trainer', min: 100 },
  { rank: 'Ace Trainer', min: 500 },
  { rank: 'Elite Four', min: 1500 },
  { rank: 'Champion', min: 3000 },
];

const BADGES = [
  { code: 'I', label: 'Huy hiệu Đá' },
  { code: 'II', label: 'Huy hiệu Nước' },
  { code: 'III', label: 'Huy hiệu Điện' },
  { code: 'IV', label: 'Huy hiệu Cỏ' },
  { code: 'V', label: 'Huy hiệu Lửa' },
  { code: 'VI', label: 'Huy hiệu Tâm Linh' },
  { code: 'VII', label: 'Huy hiệu Băng' },
  { code: 'VIII', label: 'Huy hiệu Rồng' },
];

export function HomePage() {
  const { profile } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [recentSubs, setRecentSubs] = useState<Submission[]>([]);
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from('problems')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => setProblems(data ?? []));

    if (profile) {
      supabase
        .from('submissions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => setRecentSubs(data ?? []));

      supabase
        .from('user_badges')
        .select('badge_code')
        .eq('user_id', profile.id)
        .then(({ data }) => setBadges(data?.map((b) => b.badge_code) ?? []));
    }
  }, [profile]);

  const solvedSet = new Set(
    recentSubs.filter((s) => s.status === 'accepted').map((s) => s.problem_id)
  );
  const nextRank = RANK_THRESHOLDS.find((r) => r.min > (profile?.total_points ?? 0));
  const currentRank = [...RANK_THRESHOLDS].reverse().find((r) => r.min <= (profile?.total_points ?? 0));
  const progress = nextRank
    ? Math.min(
        100,
        (((profile?.total_points ?? 0) - (currentRank?.min ?? 0)) /
          (nextRank.min - (currentRank?.min ?? 0))) *
          100
      )
    : 100;

  const streakEgg = (streak: number) => {
    if (streak === 0) return '🥚';
    if (streak < 3) return '🐣';
    if (streak < 7) return '🐥';
    if (streak < 14) return '🐤';
    return '🦅';
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl surface-2 p-8 sm:p-12 animate-fade-in-up">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at top right, var(--type-electric-glow), transparent 50%), radial-gradient(ellipse at bottom left, var(--type-dragon-glow), transparent 50%)',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <Pokeball size={48} className="glow-electric rounded-full" />
            <h1 className="font-pixel text-2xl sm:text-3xl text-type-electric">
              PokéJudge
            </h1>
          </div>
          <p className="text-lg max-w-2xl mb-6" style={{ color: 'var(--text-secondary)' }}>
            Giải bài toán lập trình thi đấu, thu thập Huy hiệu Gym, leo rank Trainer và
            tranh tài tại Đấu trường Liên Minh.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/problems')} className="btn-primary">
              Bắt đầu luyện tập
            </button>
            <button onClick={() => navigate('/league')} className="btn-ghost">
              <Trophy size={16} className="inline mr-1.5" />
              Xem Đấu trường
            </button>
          </div>
        </div>
      </section>

      {/* Stats grid */}
      {profile && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Tổng điểm"
            value={profile.total_points.toString()}
            color="var(--type-electric)"
          />
          <StatCard
            icon={<Target size={20} />}
            label="Bài đã giải"
            value={profile.solved_count.toString()}
            color="var(--type-grass)"
          />
          <StatCard
            icon={<Flame size={20} />}
            label="Streak hiện tại"
            value={`${profile.current_streak} ${streakEgg(profile.current_streak)}`}
            color="var(--type-fire)"
          />
          <StatCard
            icon={<Trophy size={20} />}
            label="Huy hiệu"
            value={`${badges.length}/${BADGES.length}`}
            color="var(--type-dragon)"
          />
        </section>
      )}

      {/* Rank progress */}
      {profile && (
        <section className="surface-2 rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Tiến trình Trainer Rank</h2>
            <span className="text-sm font-semibold text-type-electric">{profile.trainer_rank}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {RANK_THRESHOLDS.map((r) => (
              <div key={r.rank} className="flex-1 text-center">
                <div
                  className="text-[10px] mb-1"
                  style={{
                    color:
                      profile.total_points >= r.min ? 'var(--type-electric)' : 'var(--text-muted)',
                  }}
                >
                  {r.rank}
                </div>
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      profile.total_points >= r.min ? 'var(--type-electric)' : 'var(--border-subtle)',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{profile.total_points} pts</span>
            <span>
              {nextRank ? `Còn ${nextRank.min - profile.total_points} pts đến ${nextRank.rank}` : 'Đã đạt hạng cao nhất!'}
            </span>
          </div>
          <div
            className="h-2 rounded-full mt-3 overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface-1)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--type-electric), var(--type-fire))',
              }}
            />
          </div>
        </section>
      )}

      {/* Badges showcase */}
      {profile && (
        <section className="surface-2 rounded-2xl p-6 animate-fade-in-up">
          <h2 className="text-lg font-bold mb-4">Bộ sưu tập Huy hiệu Gym</h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
            {BADGES.map((b) => (
              <GymBadge
                key={b.code}
                code={b.code}
                label={b.label}
                unlocked={badges.includes(b.code)}
                size={56}
              />
            ))}
          </div>
        </section>
      )}

      {/* Problems preview */}
      <section className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen size={20} className="text-type-electric" />
            Bài tập nổi bật
          </h2>
          <button
            onClick={() => navigate('/problems')}
            className="text-sm text-type-electric flex items-center gap-1 hover:gap-2 transition-all"
          >
            Tất cả bài <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.slice(0, 6).map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/problem/${p.slug}`)}
              className="surface-2 rounded-xl p-5 text-left hover:surface-3 transition-all group"
              style={{ borderLeft: `3px solid ${TYPE_META[p.difficulty_type].color}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <TypeBadge type={p.difficulty_type} />
                <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  {p.points}pts
                </span>
              </div>
              <h3 className="font-semibold mb-1.5 group-hover:text-type-electric transition-colors">
                {p.title}
              </h3>
              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {p.statement ?? ''}
              </p>
              {solvedSet.has(p.id) && (
                <div className="mt-3 text-xs font-bold text-type-grass">✓ Đã giải</div>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="surface-2 rounded-xl p-5 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
