import React from 'react';

/**
 * Spinner — loading indicator.
 * Replaces the old spinner div with a centered, well-spaced loading block.
 * For page-level loading, also exports SkeletonCard for shimmer placeholders.
 */
const Spinner = ({ text = 'Loading...', center = true, size = 'md' }) => {
  const sizes = {
    sm: { width: 18, height: 18, borderWidth: 2 },
    md: { width: 28, height: 28, borderWidth: 3 },
    lg: { width: 40, height: 40, borderWidth: 4 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: center ? 'center' : 'flex-start',
      padding: center ? 'var(--space-16) var(--space-6)' : 'var(--space-4)',
      gap: 'var(--space-4)',
      height: center ? '50vh' : 'auto',
    }}>
      <div style={{
        width: s.width,
        height: s.height,
        borderRadius: '50%',
        border: `${s.borderWidth}px solid var(--border-strong)`,
        borderTopColor: 'var(--primary)',
        animation: 'spin 0.8s ease-in-out infinite',
        flexShrink: 0,
      }} />
      {text && (
        <span style={{
          color: 'var(--text-muted)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}>
          {text}
        </span>
      )}
    </div>
  );
};

/**
 * SkeletonCard — shimmer placeholder for content loading.
 * Use in place of real cards while data is fetching.
 */
export const SkeletonCard = ({ lines = 3 }) => (
  <div style={{
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-6)',
    marginBottom: 'var(--space-6)',
  }}>
    {/* Header skeleton */}
    <div className="skeleton" style={{ height: 16, width: '45%', marginBottom: 'var(--space-4)' }} />
    {/* Content lines */}
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="skeleton"
        style={{
          height: 12,
          width: `${100 - i * 15}%`,
          marginBottom: i < lines - 1 ? 'var(--space-3)' : 0,
        }}
      />
    ))}
  </div>
);

export default Spinner;
