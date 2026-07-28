import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';
import type { Problem, Submission, SubmissionStatus, TestCaseResult } from '@/lib/types';
import { LANGUAGES } from '@/lib/types';
import { TYPE_META, STATUS_META } from '@/lib/meta';
import { TypeBadge, StatusBadge, Pokeball } from '@/components/Badges';
import { Clock, MemoryStick, ArrowLeft, Send, FileText, ChevronDown } from 'lucide-react';

export function ProblemPage({ slug }: { slug: string }) {
  const { session } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [langId, setLangId] = useState(LANGUAGES[0].id);
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<SubmissionStatus | null>(null);
  const [showPokeball, setShowPokeball] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [results, setResults] = useState<TestCaseResult[] | null>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    supabase
      .from('problems')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        setProblem(data as Problem | null);
        setLoading(false);
      });
  }, [slug]);

  function onLangChange(id: number) {
    setLangId(id);
    const lang = LANGUAGES.find((l) => l.id === id);
    if (lang) setCode(lang.template);
  }

  async function handleSubmit() {
    if (!problem || !session) return;
    setSubmitting(true);
    setVerdict(null);
    setExecTime(null);
    setResults(null);
    setSubmitError(null);
    setShowPokeball(true);

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-solution`;
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          problemId: problem.id,
          languageId: langId,
          languageName: LANGUAGES.find((l) => l.id === langId)?.name ?? 'C++',
          sourceCode: code,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }

      const body = await res.json();
      const submissionId = body.submissionId as string;

      // Subscribe to realtime updates for this submission
      if (realtimeRef.current) realtimeRef.current.unsubscribe();

      const channel = supabase
        .channel(`submission-${submissionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'submissions',
            filter: `id=eq.${submissionId}`,
          },
          (payload) => {
            const sub = payload.new as Submission;
            if (sub.status !== 'judging' && sub.status !== 'pending') {
              setShowPokeball(false);
              setVerdict(sub.status);
              setExecTime(sub.exec_time_ms ?? null);
              setResults(sub.results_json ?? null);
              setSubmitting(false);
            }
          }
        )
        .subscribe();

      realtimeRef.current = channel;

      // Fallback: if realtime doesn't fire, poll once after 3s
      setTimeout(async () => {
        if (verdict === null) {
          const { data } = await supabase
            .from('submissions')
            .select('status, exec_time_ms, results_json')
            .eq('id', submissionId)
            .maybeSingle();
          if (data && data.status !== 'judging' && data.status !== 'pending') {
            setShowPokeball(false);
            setVerdict(data.status as SubmissionStatus);
            setExecTime(data.exec_time_ms ?? null);
            setResults(data.results_json as TestCaseResult[] | null);
            setSubmitting(false);
          }
        }
      }, 4000);
    } catch (err) {
      setShowPokeball(false);
      setSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : 'Submit failed');
    }
  }

  useEffect(() => {
    return () => {
      if (realtimeRef.current) realtimeRef.current.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-surface-2)' }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface-2)' }} />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="text-center py-20">
        <p style={{ color: 'var(--text-muted)' }}>Không tìm thấy bài tập.</p>
        <button onClick={() => navigate('/problems')} className="btn-ghost mt-4">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const meta = TYPE_META[problem.difficulty_type];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/problems')}
        className="flex items-center gap-1.5 text-sm hover:text-type-electric transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TypeBadge type={problem.difficulty_type} size="md" />
            <span className="text-sm font-bold" style={{ color: meta.color }}>
              {problem.points} pts
            </span>
          </div>
          <h1 className="text-2xl font-bold">{problem.title}</h1>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <Clock size={15} /> {problem.time_limit_ms}ms
          </div>
          <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <MemoryStick size={15} /> {Math.round(problem.memory_limit_kb / 1024)}MB
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: problem statement (PDF only) */}
        <div className="surface-2 rounded-xl flex flex-col max-h-[600px] overflow-hidden">
          {problem.pdf_url ? (
            <iframe
              src={problem.pdf_url}
              className="flex-1 min-h-[500px] m-4 rounded-lg"
              style={{ border: '1px solid var(--border-subtle)' }}
              title="Problem PDF"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <FileText size={48} className="mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Đề bài chưa có PDF. Vui lòng liên hệ admin để cập nhật.
              </p>
            </div>
          )}
        </div>

        {/* Right: editor + submit */}
        <div className="space-y-4">
          <div className="surface-2 rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <select
                value={langId}
                onChange={(e) => onLangChange(Number(e.target.value))}
                className="bg-transparent text-sm font-semibold outline-none cursor-pointer"
                style={{ color: 'var(--text-primary)' }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id} style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                    {l.name}
                  </option>
                ))}
              </select>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {LANGUAGES.find((l) => l.id === langId)?.monacoId}
              </span>
            </div>
            <Editor
              height="380px"
              language={LANGUAGES.find((l) => l.id === langId)?.monacoId}
              value={code}
              onChange={(v) => setCode(v ?? '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: 2,
                fontFamily: 'Fira Code, monospace',
                automaticLayout: true,
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Pokeball size={18} spinning /> Đang chấm...
                </>
              ) : (
                <>
                  <Send size={16} /> Nộp bài
                </>
              )}
            </button>
          </div>

          {submitError && (
            <div
              className="text-sm rounded-lg p-3"
              style={{
                color: 'var(--type-fire)',
                backgroundColor: 'rgba(238, 129, 48, 0.1)',
                border: '1px solid var(--type-fire)',
              }}
            >
              {submitError}
            </div>
          )}

          {/* Pokéball animation overlay */}
          {showPokeball && (
            <div className="flex flex-col items-center py-8 animate-fade-in-up">
              <Pokeball size={80} className="animate-pokeball-shake" />
              <p className="mt-4 text-sm font-semibold animate-pulse-glow px-4 py-2 rounded-lg" style={{ color: 'var(--type-psychic)' }}>
                Pokéball đang lắc... chờ verdict
              </p>
            </div>
          )}

          {/* Verdict display */}
          {verdict && !showPokeball && (
            <div
              className="rounded-xl p-5 animate-fade-in-up"
              style={{
                backgroundColor: STATUS_META[verdict].bg,
                border: `1px solid ${STATUS_META[verdict].color}`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Pokeball size={32} className="animate-pokeball-burst" />
                <StatusBadge status={verdict} />
              </div>
              {execTime !== null && (
                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Thời gian: {execTime}ms
                </p>
              )}
              {verdict === 'accepted' && (
                <p className="text-sm mt-2 font-medium" style={{ color: 'var(--type-grass)' }}>
                  Hoàn xuất sắc! Bạn đã chinh phục bài này.
                </p>
              )}
            </div>
          )}

          {/* Detailed per-test-case results */}
          {results && results.length > 0 && (
            <DetailedResults results={results} />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailedResults({ results }: { results: TestCaseResult[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const passed = results.filter((r) => r.status === 'accepted').length;
  const total = results.length;

  return (
    <div className="surface-2 rounded-xl p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm">Chi tiết chấm</h3>
        <span className="text-xs font-bold" style={{ color: passed === total ? 'var(--type-grass)' : 'var(--type-fire)' }}>
          {passed}/{total} test pass
        </span>
      </div>
      <div className="space-y-2">
        {results.map((r) => {
          const meta = STATUS_META[r.status];
          const isOpen = expanded === r.index;
          return (
            <div
              key={r.index}
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)' }}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : r.index)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-[var(--bg-surface-3)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                    Test {r.index}
                  </span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{r.time_ms}ms</span>
                  <span>{Math.round(r.memory_kb / 1024)}MB</span>
                  <ChevronDown size={14} className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </div>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 space-y-2 animate-fade-in-up">
                  {r.message && (
                    <div className="text-xs p-2 rounded" style={{ color: 'var(--type-fire)', backgroundColor: 'rgba(238, 129, 48, 0.08)' }}>
                      {r.message}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Expected</div>
                      <pre className="text-xs p-2 rounded max-h-32 overflow-auto" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                        {r.expected || '(empty)'}
                      </pre>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Actual</div>
                      <pre className="text-xs p-2 rounded max-h-32 overflow-auto" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                        {r.actual || '(empty)'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
