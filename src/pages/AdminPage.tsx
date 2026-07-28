import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';
import type { Problem, DifficultyType, TestCase } from '@/lib/types';
import { TYPE_META } from '@/lib/meta';
import { TypeBadge, Pokeball } from '@/components/Badges';
import { parseZipTests, parseTextTests, type ParsedTestCase } from '@/lib/testParser';
import {
  Upload, FileText, Archive, Plus, Edit3, Trash2, Save, X, Check, FileUp, Eye, EyeOff,
} from 'lucide-react';

type Tab = 'list' | 'edit';

export function AdminPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('list');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    loadProblems();
  }, []);

  async function loadProblems() {
    setLoading(true);
    const { data } = await supabase
      .from('problems')
      .select('*')
      .order('created_at', { ascending: false });
    setProblems(data ?? []);
    setLoading(false);
  }

  if (!profile?.is_admin) {
    return (
      <div className="text-center py-20">
        <p style={{ color: 'var(--text-muted)' }}>Bạn không có quyền truy cập trang này.</p>
        <button onClick={() => navigate('/')} className="btn-ghost mt-4">
          Về trang chính
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Pokeball size={32} className="glow-dragon rounded-full" />
        <div>
          <h1 className="text-2xl font-bold">Bảng điều khiển Admin</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Quản lý bài tập, test case và PDF đề bài
          </p>
        </div>
      </div>

      {tab === 'list' && (
        <ProblemList
          problems={problems}
          loading={loading}
          onEdit={(p) => {
            setEditingProblem(p);
            setIsNew(false);
            setTab('edit');
          }}
          onNew={() => {
            setEditingProblem(null);
            setIsNew(true);
            setTab('edit');
          }}
          onReload={loadProblems}
        />
      )}

      {tab === 'edit' && (
        <ProblemEditor
          problem={editingProblem}
          isNew={isNew}
          onCancel={() => setTab('list')}
          onSaved={() => {
            setTab('list');
            loadProblems();
          }}
        />
      )}
    </div>
  );
}

// ===== Problem List =====
function ProblemList({
  problems,
  loading,
  onEdit,
  onNew,
  onReload,
}: {
  problems: Problem[];
  loading: boolean;
  onEdit: (p: Problem) => void;
  onNew: () => void;
  onReload: () => void;
}) {
  async function togglePublish(p: Problem) {
    await supabase.from('problems').update({ is_published: !p.is_published }).eq('id', p.id);
    onReload();
  }

  async function deleteProblem(p: Problem) {
    if (!confirm(`Xoá bài "${p.title}"? Tất cả test case và lượt nộp sẽ bị xoá.`)) return;
    await supabase.from('problems').delete().eq('id', p.id);
    onReload();
  }

  if (loading) {
    return <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface-2)' }} />;
  }

  return (
    <div className="space-y-4">
      <button onClick={onNew} className="btn-primary flex items-center gap-2">
        <Plus size={18} /> Tạo bài mới
      </button>

      <div className="surface-2 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr
              className="text-left text-xs uppercase tracking-wide"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}
            >
              <th className="px-4 py-3 font-semibold">Tiêu đề</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">Hệ</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">PDF</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <tr
                key={p.id}
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <td className="px-4 py-3.5">
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>/{p.slug}</div>
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell">
                  <TypeBadge type={p.difficulty_type} />
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell">
                  {p.pdf_url ? (
                    <FileText size={16} className="text-type-electric" />
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => togglePublish(p)}
                    className="flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: p.is_published ? 'var(--type-grass)' : 'var(--text-muted)' }}
                  >
                    {p.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                    {p.is_published ? 'Đã đăng' : 'Bản nháp'}
                  </button>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(p)}
                      className="p-2 rounded-lg hover:bg-[var(--bg-surface-3)] transition-colors"
                      style={{ color: 'var(--type-electric)' }}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => deleteProblem(p)}
                      className="p-2 rounded-lg hover:bg-[var(--bg-surface-3)] transition-colors"
                      style={{ color: 'var(--type-fire)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {problems.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Chưa có bài nào.
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Problem Editor =====
function ProblemEditor({
  problem,
  isNew,
  onCancel,
  onSaved,
}: {
  problem: Problem | null;
  isNew: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { session } = useAuth();
  const [title, setTitle] = useState(problem?.title ?? '');
  const [slug, setSlug] = useState(problem?.slug ?? '');
  const [difficulty, setDifficulty] = useState<DifficultyType>(problem?.difficulty_type ?? 'normal');
  const [timeLimit, setTimeLimit] = useState(problem?.time_limit_ms ?? 1000);
  const [memoryLimit, setMemoryLimit] = useState(problem?.memory_limit_kb ?? 262144);
  const [points, setPoints] = useState(problem?.points ?? 100);
  const [published, setPublished] = useState(problem?.is_published ?? false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(problem?.pdf_url ?? null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'details' | 'pdf' | 'tests'>('details');
  const problemIdRef = useRef<string | null>(problem?.id ?? null);

  useEffect(() => {
    if (!problem) return;
    problemIdRef.current = problem.id;
    supabase
      .from('test_cases')
      .select('*')
      .eq('problem_id', problem.id)
      .order('id', { ascending: true })
      .then(({ data }) => {
        setTestCases(data ?? []);
        setLoadingTests(false);
      });
  }, [problem]);

  function slugify(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    if (!title.trim() || !pdfUrl) {
      setError('Tiêu đề và file/link PDF đề bài là bắt buộc.');
      setSaving(false);
      return;
    }
    const finalSlug = slug.trim() || slugify(title);

    const payload = {
      title: title.trim(),
      slug: finalSlug,
      description_md: '',
      statement: null,
      pdf_url: pdfUrl,
      difficulty_type: difficulty,
      time_limit_ms: timeLimit,
      memory_limit_kb: memoryLimit,
      points,
      is_published: published,
    };

    let id = problemIdRef.current;
    if (isNew || !id) {
      const { data, error: insErr } = await supabase
        .from('problems')
        .insert(payload)
        .select()
        .single();
      if (insErr || !data) {
        setError(insErr?.message ?? 'Tạo bài thất bại.');
        setSaving(false);
        return;
      }
      id = data.id;
      problemIdRef.current = id;
    } else {
      const { error: updErr } = await supabase
        .from('problems')
        .update(payload)
        .eq('id', id);
      if (updErr) {
        setError(updErr.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onSaved();
  }

  async function handlePdfUpload(file: File) {
    setPdfUploading(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf';
      const path = `${slug || slugify(title) || 'problem'}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('problem-pdfs')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('problem-pdfs').getPublicUrl(path);
      setPdfUrl(pub.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload PDF thất bại.');
    } finally {
      setPdfUploading(false);
    }
  }

  async function handleZipUpload(file: File) {
    try {
      const parsed = await parseZipTests(file);
      if (parsed.length === 0) {
        setError('Không tìm thấy test case hợp lệ trong ZIP. Xem hướng dẫn định dạng.');
        return;
      }
      await saveTestCases(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parse ZIP thất bại.');
    }
  }

  async function handleTextUpload(file: File) {
    try {
      const parsed = await parseTextTests(file);
      if (parsed.length === 0) {
        setError('Không tìm thấy test case hợp lệ trong file text.');
        return;
      }
      await saveTestCases(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parse text thất bại.');
    }
  }

  async function saveTestCases(parsed: ParsedTestCase[]) {
    if (!problemIdRef.current) {
      setError('Vui lòng lưu bài trước khi thêm test case.');
      return;
    }
    const rows = parsed.map((tc) => ({
      problem_id: problemIdRef.current,
      input: tc.input,
      expected_output: tc.expected_output,
      is_sample: false,
    }));
    const { error: insErr } = await supabase.from('test_cases').insert(rows);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    // Reload test cases
    const { data } = await supabase
      .from('test_cases')
      .select('*')
      .eq('problem_id', problemIdRef.current)
      .order('id', { ascending: true });
    setTestCases(data ?? []);
  }

  async function deleteTestCase(tc: TestCase) {
    if (!confirm('Xoá test case này?')) return;
    await supabase.from('test_cases').delete().eq('id', tc.id);
    setTestCases((prev) => prev.filter((t) => t.id !== tc.id));
  }

  async function toggleSample(tc: TestCase) {
    await supabase.from('test_cases').update({ is_sample: !tc.is_sample }).eq('id', tc.id);
    setTestCases((prev) =>
      prev.map((t) => (t.id === tc.id ? { ...t, is_sample: !t.is_sample } : t))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{isNew ? 'Tạo bài mới' : `Sửa: ${problem?.title}`}</h2>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex items-center gap-1.5">
            <X size={16} /> Huỷ
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1.5">
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu bài'}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="text-sm rounded-lg p-3"
          style={{ color: 'var(--type-fire)', backgroundColor: 'rgba(238, 129, 48, 0.1)', border: '1px solid var(--type-fire)' }}
        >
          {error}
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-2">
        {([
          { key: 'details', label: 'Thông tin' },
          { key: 'pdf', label: 'PDF đề bài' },
          { key: 'tests', label: 'Test case' },
        ] as const).map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={
              activeSection === s.key
                ? { color: 'var(--type-electric)', backgroundColor: 'rgba(247, 208, 44, 0.1)', border: '1px solid var(--type-electric)80' }
                : { color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Details section */}
      {activeSection === 'details' && (
        <div className="surface-2 rounded-xl p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Tiêu đề
              </label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (isNew) setSlug(slugify(e.target.value));
                }}
                className="input-field"
                placeholder="Tổng hai số"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Slug (URL)
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="input-field"
                placeholder="tong-hai-so"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Hệ (độ khó)
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyType)}
                className="input-field cursor-pointer"
              >
                <option value="normal">Normal</option>
                <option value="electric">Electric</option>
                <option value="fire">Fire</option>
                <option value="dragon">Dragon</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Giới hạn thời (ms)
              </label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Giới hạn bộ nhớ (KB)
              </label>
              <input
                type="number"
                value={memoryLimit}
                onChange={(e) => setMemoryLimit(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Điểm
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 accent-yellow-400"
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Đăng bài (hiển thị với người dùng)
            </span>
          </label>
        </div>
      )}

      {/* PDF section */}
      {activeSection === 'pdf' && (
        <div className="surface-2 rounded-xl p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <FileText size={18} className="text-type-electric" /> PDF đề bài
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Dán link PDF hoặc tải file lên. Người dùng sẽ xem được trực tiếp trong trình duyệt.
          </p>

          {/* URL input */}
          <div className="flex gap-2">
            <input
              value={pdfUrl ?? ''}
              onChange={(e) => setPdfUrl(e.target.value.trim() || null)}
              className="input-field"
              placeholder="https://example.com/problem.pdf"
            />
            {pdfUrl && (
              <button
                onClick={() => setPdfUrl(null)}
                className="px-3 rounded-lg text-sm font-semibold whitespace-nowrap"
                style={{ color: 'var(--type-fire)', backgroundColor: 'rgba(238, 129, 48, 0.1)' }}
              >
                Xoá link
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
            <span className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>hoặc</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
          </div>

          {/* File upload */}
          <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-type-electric"
            style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-1)' }}
          >
            <Upload size={32} style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {pdfUploading ? 'Đang tải lên...' : 'Chọn file PDF'}
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePdfUpload(f);
              }}
            />
          </label>

          {pdfUrl && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={18} className="text-type-electric shrink-0" />
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate hover:text-type-electric">
                    {pdfUrl.length > 50 ? pdfUrl.slice(0, 50) + '...' : pdfUrl}
                  </a>
                </div>
              </div>
              <iframe src={pdfUrl} className="w-full h-[500px] rounded-lg" style={{ border: '1px solid var(--border-subtle)' }} title="PDF preview" />
            </div>
          )}
        </div>
      )}

      {/* Test cases section */}
      {activeSection === 'tests' && (
        <div className="space-y-4">
          {!problemIdRef.current && (
            <div
              className="text-sm rounded-lg p-3"
              style={{ color: 'var(--type-electric)', backgroundColor: 'rgba(247, 208, 44, 0.1)', border: '1px solid var(--type-electric)' }}
            >
              Vui lòng lưu bài trước khi thêm test case.
            </div>
          )}

          {/* Upload zone */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="surface-2 rounded-xl p-5 space-y-3">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <Archive size={16} className="text-type-electric" /> Nạp từ file ZIP
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Cấu trúc: <code className="text-type-electric">test1/inp</code> + <code className="text-type-electric">test1/out</code> hoặc <code className="text-type-electric">1.in</code> + <code className="text-type-electric">1.out</code>
              </p>
              <label className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors hover:border-type-electric"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <FileUp size={20} style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Chọn file .zip</span>
                <input
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  disabled={!problemIdRef.current}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleZipUpload(f);
                  }}
                />
              </label>
            </div>

            <div className="surface-2 rounded-xl p-5 space-y-3">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <FileText size={16} className="text-type-electric" /> Nạp từ file text
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Định dạng: <code className="text-type-electric">## Test 1</code> + <code className="text-type-electric">input:</code> + <code className="text-type-electric">output:</code>
              </p>
              <label className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors hover:border-type-electric"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <FileUp size={20} style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Chọn file .txt</span>
                <input
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  disabled={!problemIdRef.current}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleTextUpload(f);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Manual add */}
          <ManualTestCaseAdd problemId={problemIdRef.current} onAdded={(tc) => setTestCases((prev) => [...prev, tc])} />

          {/* Existing test cases */}
          <div className="surface-2 rounded-xl p-5">
            <h3 className="font-bold mb-3 text-sm">
              Test case hiện có ({testCases.length})
            </h3>
            {loadingTests ? (
              <div className="h-32 animate-pulse rounded-lg" style={{ backgroundColor: 'var(--bg-surface-1)' }} />
            ) : testCases.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                Chưa có test case. Nạp từ ZIP/text hoặc thêm thủ công.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testCases.map((tc, i) => (
                  <div
                    key={tc.id}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface-3)' }}
                        >
                          HIDDEN
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>Input</div>
                          <pre className="p-2 rounded max-h-24 overflow-auto" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                            {tc.input.slice(0, 200)}{tc.input.length > 200 ? '...' : ''}
                          </pre>
                        </div>
                        <div>
                          <div className="font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>Output</div>
                          <pre className="p-2 rounded max-h-24 overflow-auto" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                            {tc.expected_output.slice(0, 200)}{tc.expected_output.length > 200 ? '...' : ''}
                          </pre>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTestCase(tc)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-3)] shrink-0"
                      style={{ color: 'var(--type-fire)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ManualTestCaseAdd({
  problemId,
  onAdded,
}: {
  problemId: string | null;
  onAdded: (tc: TestCase) => void;
}) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!problemId || !input.trim() || !output.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('test_cases')
      .insert({
        problem_id: problemId,
        input: input,
        expected_output: output,
        is_sample: false,
      })
      .select()
      .single();
    setBusy(false);
    if (error || !data) return;
    onAdded(data as TestCase);
    setInput('');
    setOutput('');
  }

  return (
    <div className="surface-2 rounded-xl p-5 space-y-3">
      <h3 className="font-bold flex items-center gap-2 text-sm">
        <Plus size={16} className="text-type-electric" /> Thêm test case thủ công
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className="input-field font-mono text-xs"
            placeholder="3 5"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Output</label>
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            rows={4}
            className="input-field font-mono text-xs"
            placeholder="8"
          />
        </div>
      </div>
      <button
        onClick={add}
        disabled={busy || !problemId || !input.trim() || !output.trim()}
        className="btn-primary !py-1.5 !px-4 text-sm flex items-center gap-1.5 ml-auto"
      >
        <Plus size={14} /> Thêm
      </button>
    </div>
  );
}
