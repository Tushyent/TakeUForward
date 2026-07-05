import React from 'react';
import Badge from './ui/Badge';

const VerifiedAlumniBadge = ({ isVerifiedAlumni, style }) => {
  if (!isVerifiedAlumni) return null;

  return (
    <Badge 
      variant="success" 
      style={{ 
        marginLeft: '6px', 
        fontSize: '0.75em', 
        padding: '2px 6px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        ...style 
      }}
      title="Verified Alumni"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      Alumni
    </Badge>
  );
};

export default VerifiedAlumniBadge;
