/*
# Seed sample problems and test cases

Inserts 6 published problems across all four difficulty types (Normal, Electric,
Fire, Dragon) with sample + hidden test cases. Uses a DO block to insert problems
and their test cases in one go, capturing ids with RETURNING.

## Problems
1. "Tổng hai số" (A+B) — normal
2. "Số chẵn hay lẻ" — normal
3. "Lũy thừa nhanh" — electric
4. "Đếm cặp đôi" — electric
5. "Dãy con tăng dài nhất" (LIS) — fire
6. "Phép XOR tối ưu" — dragon

## Security
No policy changes — inserts run with service role (bypasses RLS).
*/

DO $$
DECLARE
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid;
BEGIN
  -- Problem 1: A+B (normal)
  INSERT INTO problems (title, slug, description_md, statement, difficulty_type, time_limit_ms, memory_limit_kb, points, is_published)
  VALUES (
    'Tổng hai số',
    'tong-hai-so',
    '## Tổng hai số

Cho hai số nguyên $a$ và $b$, hãy tính tổng $a + b$.

### Input
- Một dòng duy nhất chứa hai số nguyên $a$ và $b$ ($-10^9 \le a, b \le 10^9$).

### Output
- In ra tổng $a + b$.

### Ví dụ

**Input:**
```
3 5
```

**Output:**
```
8
```',
    'Tính tổng hai số nguyên a và b.',
    'normal', 1000, 262144, 100, true
  ) RETURNING id INTO p1;

  INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
    (p1, '3 5', '8', true),
    (p1, '-10 20', '10', false),
    (p1, '0 0', '0', false),
    (p1, '1000000000 1000000000', '2000000000', false),
    (p1, '-1000000000 -1000000000', '-2000000000', false);

  -- Problem 2: Chẵn lẻ (normal)
  INSERT INTO problems (title, slug, description_md, statement, difficulty_type, time_limit_ms, memory_limit_kb, points, is_published)
  VALUES (
    'Số chẵn hay lẻ',
    'so-chan-hay-le',
    '## Số chẵn hay lẻ

Cho một số nguyên $n$, hãy xác định $n$ là số chẵn hay số lẻ.

### Input
- Một dòng duy nhất chứa số nguyên $n$ ($-10^{18} \le n \le 10^{18}$).

### Output
- In ra `EVEN` nếu $n$ chẵn, `ODD` nếu $n$ lẻ.

### Ví dụ

**Input:**
```
7
```

**Output:**
```
ODD
```',
    'Xác định số chẵn hay lẻ.',
    'normal', 1000, 262144, 100, true
  ) RETURNING id INTO p2;

  INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
    (p2, '7', 'ODD', true),
    (p2, '4', 'EVEN', false),
    (p2, '0', 'EVEN', false),
    (p2, '-3', 'ODD', false),
    (p2, '1000000000000000000', 'EVEN', false);

  -- Problem 3: Lũy thừa nhanh (electric)
  INSERT INTO problems (title, slug, description_md, statement, difficulty_type, time_limit_ms, memory_limit_kb, points, is_published)
  VALUES (
    'Lũy thừa nhanh',
    'luy-thua-nhanh',
    '## Lũy thừa nhanh

Cho ba số nguyên $a$, $b$, $m$. Tính $a^b \bmod m$.

### Input
- Một dòng duy nhất chứa ba số nguyên $a$, $b$, $m$ ($1 \le m \le 10^9$; $0 \le a, b \le 10^{18}$).

### Output
- In ra $a^b \bmod m$.

### Ví dụ

**Input:**
```
2 10 1000
```

**Output:**
```
24
```',
    'Tính a^b mod m bằng lũy thừa nhanh O(log b).',
    'electric', 1000, 262144, 200, true
  ) RETURNING id INTO p3;

  INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
    (p3, '2 10 1000', '24', true),
    (p3, '3 0 7', '1', false),
    (p3, '0 0 1', '0', false),
    (p3, '7 1 1000000000', '7', false),
    (p3, '2 62 1000000000', '94288672', false);

  -- Problem 4: Đếm cặp đôi (electric)
  INSERT INTO problems (title, slug, description_md, statement, difficulty_type, time_limit_ms, memory_limit_kb, points, is_published)
  VALUES (
    'Đếm cặp đôi',
    'dem-cap-doi',
    '## Đếm cặp đôi

Cho mảng $n$ số nguyên. Đếm số cặp $(i, j)$ sao cho $i < j$ và $a_i = a_j$.

### Input
- Dòng 1: số nguyên $n$ ($1 \le n \le 2 \cdot 10^5$).
- Dòng 2: $n$ số nguyên $a_1, a_2, \dots, a_n$ ($1 \le a_i \le 10^9$).

### Output
- In ra số cặp đôi.

### Ví dụ

**Input:**
```
4
1 2 1 1
```

**Output:**
```
3
```',
    'Đếm số cặp (i,j) với i<j và a_i = a_j.',
    'electric', 1000, 262144, 250, true
  ) RETURNING id INTO p4;

  INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
    (p4, '4
1 2 1 1', '3', true),
    (p4, '1
5', '0', false),
    (p4, '3
1 1 1', '3', false),
    (p4, '5
1 2 3 2 1', '2', false);

  -- Problem 5: LIS (fire)
  INSERT INTO problems (title, slug, description_md, statement, difficulty_type, time_limit_ms, memory_limit_kb, points, is_published)
  VALUES (
    'Dãy con tăng dài nhất',
    'day-con-tang-dai-nhat',
    '## Dãy con tăng dài nhất

Cho mảng $n$ số nguyên. Tìm độ dài dãy con tăng dài nhất (không necessarily liên tiếp).

### Input
- Dòng 1: số nguyên $n$ ($1 \le n \le 10^5$).
- Dòng 2: $n$ số nguyên $a_1, \dots, a_n$ ($1 \le a_i \le 10^9$).

### Output
- In ra độ dài dãy con tăng dài nhất.

### Ví dụ

**Input:**
```
8
1 3 2 4 6 5 7 8
```

**Output:**
```
6
```',
    'Tìm độ dài dãy con tăng dài nhất (LIS) O(n log n).',
    'fire', 1000, 262144, 350, true
  ) RETURNING id INTO p5;

  INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
    (p5, '8
1 3 2 4 6 5 7 8', '6', true),
    (p5, '1
1', '1', false),
    (p5, '5
5 4 3 2 1', '1', false),
    (p5, '6
1 2 3 4 5 6', '6', false);

  -- Problem 6: XOR tối ưu (dragon)
  INSERT INTO problems (title, slug, description_md, statement, difficulty_type, time_limit_ms, memory_limit_kb, points, is_published)
  VALUES (
    'Phép XOR tối ưu',
    'phep-xor-toi-uu',
    '## Phép XOR tối ưu

Cho mảng $n$ số nguyên. Tìm giá trị lớn nhất của $a_i \oplus a_j$ với $i \ne j$.

### Input
- Dòng 1: số nguyên $n$ ($2 \le n \le 2 \cdot 10^5$).
- Dòng 2: $n$ số nguyên $a_1, \dots, a_n$ ($0 \le a_i < 2^{30}$).

### Output
- In ra giá trị XOR lớn nhất.

### Ví dụ

**Input:**
```
3
9 3 12
```

**Output:**
```
15
```',
    'Tìm cặp có XOR lớn nhất dùng Trie nhị phân O(n log maxA).',
    'dragon', 1000, 262144, 500, true
  ) RETURNING id INTO p6;

  INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
    (p6, '3
9 3 12', '15', true),
    (p6, '2
0 0', '0', false),
    (p6, '4
1 2 4 8', '12', false),
    (p6, '3
1 2 3', '3', false);
END $$;