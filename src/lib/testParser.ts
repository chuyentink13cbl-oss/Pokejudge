export interface ParsedTestCase {
  input: string;
  expected_output: string;
  is_sample: boolean;
}

/**
 * Parse a ZIP file containing test cases.
 * Supported structures:
 *   - test1/inp.txt + test1/out.txt  (or test1/input.txt + test1/output.txt)
 *   - test1/in + test1/out
 *   - 1.in + 1.out  (flat)
 *   - test1.in + test1.out  (flat)
 */
export async function parseZipTests(file: File): Promise<ParsedTestCase[]> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const entries = Object.keys(zip.files).filter((k) => !zip.files[k].dir);

  // Group by test index
  const groups = new Map<string, { input?: string; output?: string }>();

  for (const path of entries) {
    const lower = path.toLowerCase();
    // Match patterns like test1/inp, 1.in, test1.in, test1/input.txt
    const inpMatch = lower.match(/(?:test)?(\d+)[\/.](?:inp(?:ut)?(?:\.txt)?|in(?:\.txt)?)$/) ||
      lower.match(/(?:^|\/)(\d+)\.in$/);
    const outMatch = lower.match(/(?:test)?(\d+)[\/.](?:out(?:put)?(?:\.txt)?|ans(?:wer)?(?:\.txt)?)$/) ||
      lower.match(/(?:^|\/)(\d+)\.out$/);

    if (inpMatch) {
      const idx = inpMatch[1];
      const g = groups.get(idx) ?? {};
      g.input = await zip.files[path].async('string');
      groups.set(idx, g);
    } else if (outMatch) {
      const idx = outMatch[1];
      const g = groups.get(idx) ?? {};
      g.output = await zip.files[path].async('string');
      groups.set(idx, g);
    }
  }

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => Number(a) - Number(b));
  return sortedKeys
    .map((k) => {
      const g = groups.get(k)!;
      if (g.input === undefined || g.output === undefined) return null;
      return {
        input: g.input,
        expected_output: g.output,
        is_sample: false,
      } as ParsedTestCase;
    })
    .filter((x): x is ParsedTestCase => x !== null);
}

/**
 * Parse a text file with format:
 *   ## Test 1
 *   input:
 *   3 5
 *   output:
 *   8
 *   ## Test 2
 *   ...
 *
 * Also supports "## Test 1: input: output:" inline format.
 */
export async function parseTextTests(file: File): Promise<ParsedTestCase[]> {
  const text = await file.text();
  return parseTextTestsString(text);
}

export function parseTextTestsString(text: string): ParsedTestCase[] {
  const tests: ParsedTestCase[] = [];
  // Split on ## Test N headers
  const blocks = text.split(/^##\s*(?:Test\s*)?(\d+)/im);
  // blocks[0] is preamble before first header; pairs follow as [num, body, num, body...]
  for (let i = 1; i < blocks.length; i += 2) {
    const body = blocks[i + 1] ?? '';
    const parsed = extractInputOutput(body);
    if (parsed) tests.push({ ...parsed, is_sample: false });
  }
  return tests;
}

function extractInputOutput(body: string): { input: string; expected_output: string } | null {
  // Normalize: look for "input:" and "output:" labels
  const inputMatch = body.match(/input\s*:\s*([\s\S]*?)(?:\noutput|\n##|\nTest|$)/i);
  const outputMatch = body.match(/output\s*:\s*([\s\S]*?)(?:\n##|\nTest|$)/i);
  if (!inputMatch || !outputMatch) return null;
  return {
    input: inputMatch[1].trim() + '\n',
    expected_output: outputMatch[1].trim() + '\n',
  };
}
