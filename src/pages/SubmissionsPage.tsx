import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';
import type { Submission, Problem } from '@/lib/types';
import { StatusBadge, TypeBadge } from '@/components/Badges';
import { Calendar, Code2 } from 'lucide-react';

export function SubmissionsPage() {
  const { profile } = useAuth();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [problems, setProblems] = useState<Record<string, Problem>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('submissions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setSubs(data ?? []);
        setLoading(false);
      });

    supabase.from('problems').select('*').then(({ data }) => {
      const map: Record<string, Problem> = {};
      data?.forEach((p) => (map[p.id] = p));
      setProblems(map);
    });
  }, [profile]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface-2)' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Lượt nộp bài</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {subs.length} lượt nộp gần đây
        </p>
      </div>

      {subs.length === 0 ? (
        <div className="surface-2 rounded-xl p-12 text-center">
          <Code2 size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            Bạn chưa nộp bài nào.
          </p>
          <button onClick={() => navigate('/problems')} className="btn-primary">
            Bắt đầu giải bài
          </button>
        </div>
      ) : (
        <div className="surface-2 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wide"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}
              >
                <th className="px-4 py-3 font-semibold">Verdict</th>
                <th className="px-4 py-3 font-semibold">Bài</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Ngôn ngữ</th>
                <th className="px-4 py-3 font-semibold text-right hidden sm:table-cell">Thời gian</th>
                <th className="px-4 py-3 font-semibold text-right">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const prob = problems[s.problem_id];
                return (
                  <tr
                    key={s.id}
                    onClick={() => prob && navigate(`/problem/${prob.slug}`)}
                    className="cursor-pointer transition-colors hover:bg-[var(--bg-surface-3)]"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <td className="px-4 py-3.5">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{prob?.title ?? 'Đã xoá'}</span>
                        {prob && <TypeBadge type={prob.difficulty_type} />}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {s.language_name}
                    </td>
                    <td className="px-4 py-3.5 text-right hidden sm:table-cell text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {s.exec_time_ms !== null ? `${s.exec_time_ms}ms` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.created_at).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
