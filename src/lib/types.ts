export type DifficultyType = 'normal' | 'electric' | 'fire' | 'dragon';

export type SubmissionStatus =
  | 'pending'
  | 'judging'
  | 'accepted'
  | 'wrong_answer'
  | 'tle'
  | 're'
  | 'ce';

export interface Profile {
  id: string;
  username: string;
  trainer_rank: string;
  total_points: number;
  solved_count: number;
  current_streak: number;
  longest_streak: number;
  last_solve_date: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description_md: string;
  statement: string | null;
  pdf_url: string | null;
  difficulty_type: DifficultyType;
  time_limit_ms: number;
  memory_limit_kb: number;
  points: number;
  is_published: boolean;
  created_at: string;
}

export interface TestCase {
  id: string;
  problem_id: string;
  input: string;
  expected_output: string;
  is_sample: boolean;
}

export interface TestCaseResult {
  index: number;
  status: SubmissionStatus;
  time_ms: number;
  memory_kb: number;
  expected: string;
  actual: string;
  message: string;
}

export interface Submission {
  id: string;
  user_id: string;
  problem_id: string;
  language_id: number;
  language_name: string;
  source_code: string;
  status: SubmissionStatus;
  exec_time_ms: number | null;
  exec_memory_kb: number | null;
  judge0_token: string | null;
  results_json: TestCaseResult[] | null;
  created_at: string;
}

export interface UserBadge {
  user_id: string;
  badge_code: string;
  unlocked_at: string;
}

export interface Language {
  id: number;
  name: string;
  monacoId: string;
  template: string;
}

export const LANGUAGES: Language[] = [
  {
    id: 54,
    name: 'C++',
    monacoId: 'cpp',
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {
  ios_base::sync_with_stdio(false);
  cin.tie(NULL);

  int a, b;
  cin >> a >> b;
  cout << a + b << endl;
  return 0;
}`,
  },
  {
    id: 71,
    name: 'Python',
    monacoId: 'python',
    template: `import sys
input = sys.stdin.readline

def main():
    a, b = map(int, input().split())
    print(a + b)

if __name__ == "__main__":
    main()`,
  },
  {
    id: 62,
    name: 'Java',
    monacoId: 'java',
    template: `import java.util.*;

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    int a = sc.nextInt();
    int b = sc.nextInt();
    System.out.println(a + b);
  }
}`,
  },
  {
    id: 60,
    name: 'Go',
    monacoId: 'go',
    template: `package main

import "fmt"

func main() {
  var a, b int
  fmt.Scan(&a, &b)
  fmt.Println(a + b)
}`,
  },
  {
    id: 72,
    name: 'Ruby',
    monacoId: 'ruby',
    template: `a, b = gets.split.map(&:to_i)
puts a + b`,
  },
  {
    id: 63,
    name: 'JavaScript',
    monacoId: 'javascript',
    template: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);
const a = parseInt(input[0]);
const b = parseInt(input[1]);
console.log(a + b);`,
  },
];

export function languageById(id: number): Language | undefined {
  return LANGUAGES.find((l) => l.id === id);
}
