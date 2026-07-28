import type { DifficultyType, SubmissionStatus } from '@/lib/types';

export const TYPE_META: Record<
  DifficultyType,
  { label: string; color: string; glow: string; bg: string; border: string; emoji: string }
> = {
  normal: {
    label: 'Normal',
    color: 'var(--type-normal)',
    glow: 'var(--type-normal-glow)',
    bg: 'rgba(168, 168, 120, 0.12)',
    border: 'var(--type-normal)',
    emoji: '⚪',
  },
  electric: {
    label: 'Electric',
    color: 'var(--type-electric)',
    glow: 'var(--type-electric-glow)',
    bg: 'rgba(247, 208, 44, 0.12)',
    border: 'var(--type-electric)',
    emoji: '⚡',
  },
  fire: {
    label: 'Fire',
    color: 'var(--type-fire)',
    glow: 'var(--type-fire-glow)',
    bg: 'rgba(238, 129, 48, 0.12)',
    border: 'var(--type-fire)',
    emoji: '🔥',
  },
  dragon: {
    label: 'Dragon',
    color: 'var(--type-dragon)',
    glow: 'var(--type-dragon-glow)',
    bg: 'rgba(111, 53, 252, 0.12)',
    border: 'var(--type-dragon)',
    emoji: '🐉',
  },
};

export const STATUS_META: Record<
  SubmissionStatus,
  { label: string; color: string; bg: string }
> = {
  pending: { label: 'Pending', color: 'var(--status-pending)', bg: 'rgba(139, 148, 158, 0.12)' },
  judging: { label: 'Judging', color: 'var(--status-judging)', bg: 'rgba(249, 85, 135, 0.12)' },
  accepted: { label: 'Accepted', color: 'var(--status-ac)', bg: 'rgba(122, 199, 76, 0.12)' },
  wrong_answer: { label: 'Wrong Answer', color: 'var(--status-wa)', bg: 'rgba(238, 129, 48, 0.12)' },
  tle: { label: 'Time Limit', color: 'var(--status-tle)', bg: 'rgba(247, 208, 44, 0.12)' },
  re: { label: 'Runtime Error', color: 'var(--status-re)', bg: 'rgba(249, 85, 135, 0.12)' },
  ce: { label: 'Compile Error', color: 'var(--status-ce)', bg: 'rgba(99, 144, 240, 0.12)' },
};
