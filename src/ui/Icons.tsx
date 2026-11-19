import type { CosmeticSlot } from '../game/cosmetics';
import type { PowerUpId } from '../game/types';

export function CoinIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff0a0" strokeWidth="1.5" />
      <path d="m13.9 7.8-4.3 4.8h2.8l-1.5 3.8 4.1-5h-2.7z" fill="#8b5218" />
    </svg>
  );
}

export function GemIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 3 12 0 4 6-10 12L2 9z" fill="currentColor" />
      <path d="m6 3 2 6 4 12 4-12 2-6M2 9h20" fill="none" stroke="#e5fdff" strokeWidth="1.2" />
    </svg>
  );
}

export function HeartIcon({ active = true }: { active?: boolean }) {
  return (
    <svg className={`heart-icon${active ? ' active' : ''}`} viewBox="0 0 20 18" aria-hidden="true">
      <path d="M10 16.3 2.1 8.9C-1.6 4.9 4.2-.7 8.1 3.1L10 5l1.9-1.9c3.9-3.8 9.7 1.8 6 5.8z" />
      <path className="heart-glint" d="m4.2 7.1 1.9-1.8" />
    </svg>
  );
}

export function PowerupIcon({ id }: { id: PowerUpId }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="powerup-icon">
      {id === 'shield' && (
        <path d="m12 2.5 7 3v5.1c0 4.8-3.1 8.2-7 10.9-3.9-2.7-7-6.1-7-10.9V5.5z" />
      )}
      {id === 'magnet' && (
        <>
          <path d="M5 4v8a7 7 0 0 0 14 0V4" />
          <path d="M3 4h6M15 4h6" />
        </>
      )}
      {id === 'multiplier' && (
        <text
          x="12"
          y="15"
          fill="currentColor"
          stroke="none"
          textAnchor="middle"
          fontFamily="'Press Start 2P',monospace"
          fontSize="8"
        >
          2×
        </text>
      )}
      {id === 'freeze' && (
        <>
          <path d="m12 2 2.6 6.1L21 11l-6.4 2.9L12 20l-2.6-6.1L3 11l6.4-2.9z" />
          <path d="M12 7v10M7 11h10" />
        </>
      )}
      {id === 'grip' && (
        <>
          <rect x="4" y="6" width="16" height="12" rx="1" />
          <path d="M8 3v3m8-3v3M8 18v3m8-3v3M8 10h8m-8 4h5" />
        </>
      )}
    </svg>
  );
}

export function CosmeticIcon({ slot, className = '' }: { slot: CosmeticSlot; className?: string }) {
  if (slot === 'ball')
    return (
      <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
        <circle
          cx="36"
          cy="36"
          r="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity=".75"
        />
        <circle cx="36" cy="36" r="14" fill="currentColor" />
        <circle cx="31" cy="31" r="4" fill="#fff" opacity=".8" />
      </svg>
    );
  if (slot === 'trail')
    return (
      <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
        <path d="m43 15 5 14 14 5-14 5-5 14-5-14-14-5 14-5z" fill="currentColor" />
        <path
          d="m20 12 2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5zM18 46h8v8h-8z"
          fill="currentColor"
          opacity=".68"
        />
      </svg>
    );
  return (
    <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
      <rect x="8" y="8" width="56" height="56" fill="currentColor" opacity=".22" />
      <path
        d="M8 24h56M8 40h56M8 56h56M24 8v56M40 8v56M56 8v56"
        stroke="currentColor"
        strokeWidth="2"
        opacity=".7"
      />
      <circle cx="32" cy="32" r="7" fill="currentColor" />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5m0 0 7-7m-7 7 7 7" />
    </svg>
  );
}
export function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14M16 5v14" />
    </svg>
  );
}
export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3v18l15-9z" />
    </svg>
  );
}
export function RetryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 7v5h-5M4.5 10a8 8 0 0 1 13.7-3L20 12M4 17v-5h5m10.5 2a8 8 0 0 1-13.7 3L4 12" />
    </svg>
  );
}
