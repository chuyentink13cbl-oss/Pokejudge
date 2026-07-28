import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';
import type { Problem, DifficultyType } from '@/lib/types';
import { TYPE_META } from '@/lib/meta';
import { TypeBadge } from '@/components/Badges';
import { Search, CheckCircle2 } from 'lucide-react';

const TYPES: { key: DifficultyType | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'normal', label: 'Normal' },
  { key: 'electric', label: 'Electric' },
  { key: 'fire', label: 'Fire' },
  { key: 'dragon', label: 'Dragon' },
];

export function ProblemsPage() {
  const { profile } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<DifficultyType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('problems')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setProblems(data ?? []);
        setLoading(false);
      });

    if (profile) {
      supabase
        .from('submissions')
        .select('problem_id')
        .eq('user_id', profile.id)
        .eq('status', 'accepted')
        .then(({ data }) => {
          setSolvedIds(new Set(data?.map((s) => s.problem_id) ?? []));
        });
    }
  }, [profile]);

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      if (filter !== 'all' && p.difficulty_type !== filter) return false;
      if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [problems, filter, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Bài tập</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {problems.length} bài · {solvedIds.size} đã giải
          </p>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bài..."
            className="input-field !pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => {
          const active = filter === t.key;
          const meta = t.key !== 'all' ? TYPE_META[t.key] : null;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={
                active
                  ? {
                      color: meta?.color ?? 'var(--type-electric)',
                      backgroundColor: meta?.bg ?? 'rgba(247, 208, 44, 0.12)',
                      border: `1px solid ${meta?.border ?? 'var(--type-electric)'}80`,
                    }
                  : {
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-surface-2)',
                      border: '1px solid var(--border-subtle)',
                    }
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ backgroundColor: 'var(--bg-surface-2)' }}
            />
          ))}
        </div>
      ) : (
        <div className="surface-2 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}
              >
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Tiêu đề</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Hệ</th>
                <th className="px-4 py-3 font-semibold text-right">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const meta = TYPE_META[p.difficulty_type];
                const solved = solvedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/problem/${p.slug}`)}
                    className="cursor-pointer transition-colors hover:bg-[var(--bg-surface-3)]"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <td className="px-4 py-3.5">
                      {solved ? (
                        <CheckCircle2 size={18} className="text-type-grass" />
                      ) : (
                        <div
                          className="w-4 h-4 rounded-full mx-0.5"
                          style={{ border: '1.5px solid var(--border-bright)' }}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold">{p.title}</div>
                      <div
                        className="text-xs sm:hidden mt-1"
                        style={{ color: meta.color }}
                      >
                        {meta.label} · {p.points}pts
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <TypeBadge type={p.difficulty_type} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold" style={{ color: meta.color }}>
                      {p.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Không tìm thấy bài nào.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
