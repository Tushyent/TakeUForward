import React, { useRef, useState } from 'react';
import useMentionSearch from '../hooks/useMentionSearch';

const MentionTextarea = ({ value, onChange, placeholder, style }) => {
  const textareaRef = useRef(null);
  const [cursorPos, setCursorPos] = useState(null);

  const { suggestions, showSuggestions, insertMention } = useMentionSearch(value, cursorPos);

  const handleUpdateCursor = () => {
    if (textareaRef.current) {
      setCursorPos(textareaRef.current.selectionStart);
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    setCursorPos(e.target.selectionStart);
  };

  const handleSelectMention = (handle) => {
    const { newText, newCursorPos } = insertMention(handle);
    onChange(newText);
    
    // Use timeout to let React update the value before moving cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPos(newCursorPos);
      }
    }, 0);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyUp={handleUpdateCursor}
        onClick={handleUpdateCursor}
        placeholder={placeholder}
        style={{ ...style, position: 'relative', zIndex: 1 }}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          listStyleType: 'none',
          padding: 0,
          margin: 0,
          maxHeight: '150px',
          overflowY: 'auto',
          zIndex: 10,
          boxShadow: 'var(--shadow-md)'
        }}>
          {suggestions.map(user => (
            <li 
              key={user._id} 
              onClick={() => handleSelectMention(user.handle)}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-input)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
            >
              <strong>{user.name}</strong> <span style={{ color: 'var(--text-muted)' }}>(@{user.handle})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MentionTextarea;
