import React from 'react';
import { FileQuestion } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState - polished empty/zero-data placeholder.
 * Props:
 *   icon       - Lucide icon component (default: FileQuestion)
 *   title      - bold primary message (required)
 *   message    - optional sub-description
 *   action     - { label, onClick } for an optional CTA button
 *   style      - override styles
 */
const EmptyState = ({
  icon: Icon = FileQuestion,
  title = 'Nothing here yet.',
  message,
  action,
  style = {},
}) => {
  return (
    <div
      className="empty-state"
      style={style}
    >
      {/* Icon container with subtle glow */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 'var(--radius-md)',
        background: 'rgba(124,106,247,0.10)',
        border: '1px solid rgba(124,106,247,0.20)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--space-2)',
      }}>
        <Icon size={28} color="var(--primary)" strokeWidth={1.5} />
      </div>

      <p style={{
        margin: 0,
        fontSize: 'var(--text-base)',
        fontWeight: 600,
        color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
      }}>
        {title}
      </p>

      {message && (
        <p style={{
          margin: 0,
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
          maxWidth: 320,
          lineHeight: 1.6,
          textAlign: 'center',
        }}>
          {message}
        </p>
      )}

      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          style={{ marginTop: 'var(--space-2)' }}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
