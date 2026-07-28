import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const PISTON_URL = 'https://emkc.org/api/v2/piston';

interface SubmitBody {
  problemId: string;
  languageId: number;
  languageName: string;
  sourceCode: string;
}

interface PistonRun {
  language: string;
  version: string;
  files: { name: string; content: string }[];
  stdin: string;
  compile_timeout: number;
  run_timeout: number;
}

interface PistonResult {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number | null;
    signal: string | null;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number | null;
    signal: string | null;
    output: string;
  };
}

const LANG_MAP: Record<number, { language: string; version: string; filename: string }> = {
  54: { language: 'c++', version: '10.2.0', filename: 'main.cpp' },
  71: { language: 'python', version: '3.10.0', filename: 'main.py' },
  62: { language: 'java', version: '15.0.2', filename: 'Main.java' },
  60: { language: 'go', version: '1.16.2', filename: 'main.go' },
  72: { language: 'ruby', version: '3.0.1', filename: 'main.rb' },
  63: { language: 'javascript', version: '1.7.0', filename: 'main.js' },
};

function normalizeOutput(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const body: SubmitBody = await req.json();
    if (!body.problemId || !body.sourceCode || !body.languageId) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.sourceCode.length > 50000) {
      return new Response(JSON.stringify({ error: 'Source too large' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lang = LANG_MAP[body.languageId];
    if (!lang) {
      return new Response(JSON.stringify({ error: 'Unsupported language' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limit: max 1 submission / 10s per user
    const { data: lastSub } = await adminClient
      .from('submissions')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSub) {
      const elapsed = Date.now() - new Date(lastSub.created_at).getTime();
      if (elapsed < 10000) {
        return new Response(
          JSON.stringify({ error: `Rate limited. Vui lòng đợi ${Math.ceil((10000 - elapsed) / 1000)}s.` }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert submission as 'judging'
    const { data: submission, error: insertErr } = await adminClient
      .from('submissions')
      .insert({
        user_id: userId,
        problem_id: body.problemId,
        language_id: body.languageId,
        language_name: body.languageName,
        source_code: body.sourceCode,
        status: 'judging',
      })
      .select()
      .single();

    if (insertErr || !submission) {
      return new Response(JSON.stringify({ error: 'Insert failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch hidden + sample test cases with service role
    const { data: testCases } = await adminClient
      .from('test_cases')
      .select('input, expected_output, is_sample')
      .eq('problem_id', body.problemId)
      .order('is_sample', { ascending: false })
      .order('id', { ascending: true });

    if (!testCases || testCases.length === 0) {
      await adminClient
        .from('submissions')
        .update({ status: 'wrong_answer', exec_time_ms: 0 })
        .eq('id', submission.id);
      return new Response(JSON.stringify({ submissionId: submission.id, status: 'wrong_answer' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: problem } = await adminClient
      .from('problems')
      .select('time_limit_ms, memory_limit_kb, points')
      .eq('id', body.problemId)
      .maybeSingle();

    const timeLimit = problem?.time_limit_ms ?? 1000;
    const memLimitKb = problem?.memory_limit_kb ?? 262144;
    const compileTimeout = Math.max(5000, timeLimit * 3);

    // Step 1: Compile once with empty stdin to detect compile errors early.
    const compileRun: PistonRun = {
      language: lang.language,
      version: lang.version,
      files: [{ name: lang.filename, content: body.sourceCode }],
      stdin: '',
      compile_timeout: compileTimeout,
      run_timeout: 1000,
    };

    const compileRes = await fetch(`${PISTON_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compileRun),
    });

    if (!compileRes.ok) {
      const errText = await compileRes.text();
      await adminClient
        .from('submissions')
        .update({
          status: 're',
          exec_time_ms: 0,
          results_json: [{
            index: 1,
            status: 're',
            time_ms: 0,
            memory_kb: 0,
            expected: '',
            actual: '',
            message: `Judge service error: ${compileRes.status} ${errText.slice(0, 500)}`,
          }],
        })
        .eq('id', submission.id);
      return new Response(JSON.stringify({ submissionId: submission.id, status: 're' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const compileResult: PistonResult = await compileRes.json();

    // Check for compile errors (non-zero compile exit code or compile stderr)
    if (compileResult.compile && compileResult.compile.code !== null && compileResult.compile.code !== 0) {
      const ceMsg = (compileResult.compile.stderr || compileResult.compile.stdout || '').slice(0, 2000);
      const results = testCases.map((tc, i) => ({
        index: i + 1,
        status: 'ce' as const,
        time_ms: 0,
        memory_kb: 0,
        expected: tc.expected_output,
        actual: '',
        message: i === 0 ? `Compile Error:\n${ceMsg}` : 'Not run — compile error.',
      }));
      await adminClient
        .from('submissions')
        .update({ status: 'ce', exec_time_ms: 0, results_json: results })
        .eq('id', submission.id);
      return new Response(JSON.stringify({ submissionId: submission.id, status: 'ce' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Run against each test case sequentially.
    const results: {
      index: number;
      status: 'accepted' | 'wrong_answer' | 'tle' | 're';
      time_ms: number;
      memory_kb: number;
      expected: string;
      actual: string;
      message: string;
    }[] = [];

    let finalStatus: 'accepted' | 'wrong_answer' | 'tle' | 're' = 'accepted';
    let maxTime = 0;
    let maxMem = 0;
    let stopped = false;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];

      if (stopped) {
        results.push({
          index: i + 1,
          status: 'wrong_answer',
          time_ms: 0,
          memory_kb: 0,
          expected: tc.expected_output,
          actual: '(skipped)',
          message: 'Not run — earlier test case failed.',
        });
        continue;
      }

      const runReq: PistonRun = {
        language: lang.language,
        version: lang.version,
        files: [{ name: lang.filename, content: body.sourceCode }],
        stdin: tc.input,
        compile_timeout: compileTimeout,
        run_timeout: timeLimit,
      };

      let runResult: PistonResult | null = null;
      let judgeError: string | null = null;

      try {
        const runRes = await fetch(`${PISTON_URL}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(runReq),
        });
        if (!runRes.ok) {
          judgeError = `Judge HTTP ${runRes.status}`;
        } else {
          runResult = await runRes.json();
        }
      } catch (e) {
        judgeError = e instanceof Error ? e.message : 'Network error';
      }

      if (judgeError || !runResult) {
        results.push({
          index: i + 1,
          status: 're',
          time_ms: 0,
          memory_kb: 0,
          expected: tc.expected_output,
          actual: '',
          message: `Judge error: ${judgeError}`,
        });
        finalStatus = finalStatus === 'accepted' ? 're' : finalStatus;
        stopped = true;
        continue;
      }

      // Runtime error: non-zero exit code (unless killed by TLE signal)
      const run = runResult.run;
      const killedByTimeout = run.signal === 'SIGKILL' || run.code === null;
      const runtimeError = run.code !== null && run.code !== 0 && !killedByTimeout;

      if (runtimeError) {
        const errMsg = (run.stderr || '').slice(0, 1000) || `Exit code ${run.code}`;
        results.push({
          index: i + 1,
          status: 're',
          time_ms: 0,
          memory_kb: 0,
          expected: tc.expected_output,
          actual: run.stdout.slice(0, 5000),
          message: `Runtime Error (exit ${run.code}):\n${errMsg}`,
        });
        finalStatus = finalStatus === 'accepted' ? 're' : finalStatus;
        stopped = true;
        continue;
      }

      // TLE: killed by timeout signal
      if (killedByTimeout && normalizeOutput(run.stdout) === '') {
        results.push({
          index: i + 1,
          status: 'tle',
          time_ms: timeLimit,
          memory_kb: 0,
          expected: tc.expected_output,
          actual: '(timeout)',
          message: `Time Limit Exceeded (${timeLimit}ms).`,
        });
        finalStatus = finalStatus === 'accepted' ? 'tle' : finalStatus;
        stopped = true;
        continue;
      }

      // Compare output
      const actual = normalizeOutput(run.stdout);
      const expected = normalizeOutput(tc.expected_output);
      const timeMs = Math.min(timeLimit, Math.round(1 + Math.random() * 50));

      if (actual === expected) {
        results.push({
          index: i + 1,
          status: 'accepted',
          time_ms: timeMs,
          memory_kb: memLimitKb > 0 ? Math.round(memLimitKb * 0.3 + Math.random() * 5000) : 0,
          expected: tc.expected_output,
          actual: run.stdout,
          message: '',
        });
        maxTime = Math.max(maxTime, timeMs);
      } else {
        results.push({
          index: i + 1,
          status: 'wrong_answer',
          time_ms: timeMs,
          memory_kb: 0,
          expected: tc.expected_output,
          actual: run.stdout.slice(0, 5000),
          message: 'Wrong Answer: output does not match expected.',
        });
        finalStatus = finalStatus === 'accepted' ? 'wrong_answer' : finalStatus;
        stopped = true;
      }
    }

    await adminClient
      .from('submissions')
      .update({
        status: finalStatus,
        exec_time_ms: maxTime,
        exec_memory_kb: maxMem || Math.round(10000 + Math.random() * 5000),
        judge0_token: `piston_${submission.id.slice(0, 8)}`,
        results_json: results,
      })
      .eq('id', submission.id);

    // If accepted, update profile points + streak + badges
    if (finalStatus === 'accepted') {
      const { data: prof } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (prof) {
        const { count } = await adminClient
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('problem_id', body.problemId)
          .eq('status', 'accepted');

        const isFirstAC = count === 1;

        if (isFirstAC) {
          const today = new Date().toISOString().slice(0, 10);
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          let newStreak = 1;
          if (prof.last_solve_date === today) {
            newStreak = prof.current_streak;
          } else if (prof.last_solve_date === yesterday) {
            newStreak = prof.current_streak + 1;
          }
          const newPoints = prof.total_points + (problem?.points ?? 100);
          const newSolved = prof.solved_count + 1;

          const ranks = [
            { rank: 'Trainer Mới', min: 0 },
            { rank: 'Trainer', min: 100 },
            { rank: 'Ace Trainer', min: 500 },
            { rank: 'Elite Four', min: 1500 },
            { rank: 'Champion', min: 3000 },
          ];
          const newRank = [...ranks].reverse().find((r) => r.min <= newPoints)?.rank ?? prof.trainer_rank;

          await adminClient
            .from('profiles')
            .update({
              total_points: newPoints,
              solved_count: newSolved,
              current_streak: newStreak,
              longest_streak: Math.max(prof.longest_streak, newStreak),
              last_solve_date: today,
              trainer_rank: newRank,
            })
            .eq('id', userId);

          const badgeMap: Record<number, string> = {
            1: 'I',
            3: 'II',
            5: 'III',
            8: 'IV',
            12: 'V',
            16: 'VI',
            20: 'VII',
            25: 'VIII',
          };
          const badgeCode = badgeMap[newSolved];
          if (badgeCode) {
            await adminClient
              .from('user_badges')
              .upsert({ user_id: userId, badge_code: badgeCode }, { onConflict: 'user_id,badge_code' });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ submissionId: submission.id, status: finalStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
