import { TYPE_META, STATUS_META } from '@/lib/meta';
import type { DifficultyType, SubmissionStatus } from '@/lib/types';

export function TypeBadge({
  type,
  size = 'sm',
}: {
  type: DifficultyType;
  size?: 'sm' | 'md';
}) {
  const meta = TYPE_META[type];
  const pad = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${pad}`}
      style={{
        color: meta.color,
        backgroundColor: meta.bg,
        border: `1px solid ${meta.border}40`,
      }}
    >
      <span className="text-[0.85em]">{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      {meta.label}
    </span>
  );
}

export function Pokeball({
  size = 40,
  className = '',
  spinning = false,
}: {
  size?: number;
  className?: string;
  spinning?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${className} ${spinning ? 'animate-spin-slow' : ''}`}
    >
      <defs>
        <radialGradient id="pb-top" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="100%" stopColor="#e63946" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="#1a1a2e" stroke="#e6edf3" strokeWidth="3" />
      <path d="M 4 50 A 46 46 0 0 1 96 50" fill="url(#pb-top)" />
      <line x1="4" y1="50" x2="96" y2="50" stroke="#e6edf3" strokeWidth="4" />
      <circle cx="50" cy="50" r="14" fill="#1a1a2e" stroke="#e6edf3" strokeWidth="4" />
      <circle cx="50" cy="50" r="7" fill="#e6edf3" />
    </svg>
  );
}

export function GymBadge({
  code,
  label,
  unlocked,
  size = 64,
}: {
  code: string;
  label: string;
  unlocked: boolean;
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{
          filter: unlocked ? 'drop-shadow(0 0 8px rgba(247, 208, 44, 0.5))' : 'grayscale(1) opacity(0.3)',
        }}
      >
        <polygon
          points="50,5 72,18 90,40 90,60 72,82 50,95 28,82 10,60 10,40 28,18"
          fill={unlocked ? '#1c2230' : '#161b22'}
          stroke={unlocked ? '#f7d02c' : '#484f58'}
          strokeWidth="3"
        />
        <polygon
          points="50,18 65,28 78,45 78,55 65,72 50,82 35,72 22,55 22,45 35,28"
          fill={unlocked ? 'rgba(247, 208, 44, 0.15)' : 'transparent'}
          stroke={unlocked ? '#f7d02c' : '#484f58'}
          strokeWidth="1.5"
        />
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill={unlocked ? '#f7d02c' : '#6e7681'}
        >
          {code}
        </text>
      </svg>
      <span
        className="text-xs font-medium"
        style={{ color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        {label}
      </span>
    </div>
  );
}
