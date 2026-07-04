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
          background: 'white',
          color: '#000',
          border: '1px solid #ccc',
          borderRadius: '4px',
          listStyleType: 'none',
          padding: 0,
          margin: 0,
          maxHeight: '150px',
          overflowY: 'auto',
          zIndex: 10,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {suggestions.map(user => (
            <li 
              key={user._id} 
              onClick={() => handleSelectMention(user.handle)}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <strong>{user.name}</strong> <span style={{ color: '#666' }}>(@{user.handle})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MentionTextarea;
