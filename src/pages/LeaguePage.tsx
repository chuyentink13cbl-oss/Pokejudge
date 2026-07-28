import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import type { Profile } from '@/lib/types';
import { Pokeball } from '@/components/Badges';
import { Trophy, Medal, Crown, Flame } from 'lucide-react';

export function LeaguePage() {
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setLeaders(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface-2)' }} />
        ))}
      </div>
    );
  }

  const top4 = leaders.slice(0, 4);
  const rest = leaders.slice(4);
  const rankIcons = [
    { icon: Crown, color: 'var(--type-electric)', glow: 'var(--type-electric-glow)' },
    { icon: Medal, color: 'var(--type-water)', glow: 'var(--type-water-glow)' },
    { icon: Medal, color: 'var(--type-fire)', glow: 'var(--type-fire-glow)' },
    { icon: Medal, color: 'var(--type-dragon)', glow: 'var(--type-dragon-glow)' },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center animate-fade-in-up">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Pokeball size={36} className="glow-electric rounded-full" />
          <h1 className="font-pixel text-xl sm:text-2xl text-type-electric">Đấu trường Liên Minh</h1>
          <Pokeball size={36} className="glow-electric rounded-full" />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Bảng xếp hạng Trainer xuất sắc nhất — Top 4 là Elite Four
        </p>
      </div>

      {/* Elite Four podium */}
      {top4.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {top4.map((p, i) => {
            const RankIcon = rankIcons[i].icon;
            const isChampion = i === 0;
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/profile/${p.id}`)}
                className="surface-2 rounded-2xl p-6 text-center relative overflow-hidden transition-all hover:scale-[1.02] animate-fade-in-up"
                style={{
                  border: `1px solid ${rankIcons[i].color}60`,
                  boxShadow: `0 0 32px -8px ${rankIcons[i].glow}`,
                }}
              >
                {isChampion && (
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      background: `radial-gradient(ellipse at center, ${rankIcons[i].color}, transparent 70%)`,
                    }}
                  />
                )}
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${rankIcons[i].color}, ${rankIcons[i].color}80)`,
                      color: '#1a1a1a',
                    }}
                  >
                    {p.username[0]?.toUpperCase()}
                  </div>
                  <RankIcon
                    size={28}
                    className="mx-auto mb-2"
                    style={{ color: rankIcons[i].color }}
                  />
                  <div className="text-xs font-bold mb-1" style={{ color: rankIcons[i].color }}>
                    {isChampion ? 'CHAMPION' : `ELITE FOUR #${i + 1}`}
                  </div>
                  <div className="font-semibold truncate">{p.username}</div>
                  <div className="text-lg font-bold mt-1" style={{ color: rankIcons[i].color }}>
                    {p.total_points} pts
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {p.solved_count} bài · {p.trainer_rank}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Rest of leaderboard */}
      <div className="surface-2 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr
              className="text-left text-xs uppercase tracking-wide"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}
            >
              <th className="px-4 py-3 font-semibold w-16">#</th>
              <th className="px-4 py-3 font-semibold">Trainer</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">Rank</th>
              <th className="px-4 py-3 font-semibold text-right">Điểm</th>
              <th className="px-4 py-3 font-semibold text-right hidden sm:table-cell">Bài</th>
            </tr>
          </thead>
          <tbody>
            {rest.map((p, i) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/profile/${p.id}`)}
                className="cursor-pointer transition-colors hover:bg-[var(--bg-surface-3)]"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <td className="px-4 py-3.5 font-bold" style={{ color: 'var(--text-muted)' }}>
                  {i + 5}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: 'var(--bg-surface-3)', color: 'var(--text-secondary)' }}
                    >
                      {p.username[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold">{p.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {p.trainer_rank}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-type-electric">
                  {p.total_points}
                </td>
                <td className="px-4 py-3.5 text-right hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                  {p.solved_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rest.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Chưa có Trainer nào ngoài Elite Four.
          </div>
        )}
      </div>

      {leaders.length === 0 && (
        <div className="text-center py-16">
          <Trophy size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            Chưa có Trainer nào trên bảng xếp hạng. Hãy là người đầu tiên!
          </p>
        </div>
      )}
    </div>
  );
}
