import React from 'react';

const Spinner = ({ text = "Loading...", center = true }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: center ? 'center' : 'flex-start',
      padding: '2rem',
      gap: '1rem',
      height: center ? '50vh' : 'auto'
    }}>
      <div className="spinner"></div>
      {text && <span style={{ color: 'var(--text)' }}>{text}</span>}
    </div>
  );
};

export default Spinner;
