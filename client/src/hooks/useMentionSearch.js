import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const useMentionSearch = (text, cursorPosition) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  useEffect(() => {
    if (cursorPosition === null || cursorPosition === undefined) {
      setShowSuggestions(false);
      return;
    }

    // Find the text before the cursor
    const textBeforeCursor = text.slice(0, cursorPosition);
    
    // Check if the current word being typed starts with @
    // Regex matches the last word if it starts with @, capturing the characters after @
    const match = /(?:^|\s)@([\w.-]*)$/.exec(textBeforeCursor);

    if (match) {
      const query = match[1];
      // Determine the exact index where the @ symbol is located
      setMentionStartIndex(cursorPosition - query.length - 1);
      
      if (query.length >= 0) {
        // Only fetch if there is at least one character after @
        const delayDebounceFn = setTimeout(async () => {
          try {
            const { data } = await axiosClient.get(`/users/search?q=${query}`);
            setSuggestions(data);
            setShowSuggestions(data.length > 0);
          } catch (err) {
            console.error('Mention search failed', err);
            setShowSuggestions(false);
          }
        }, 300); // 300ms debounce

        return () => clearTimeout(delayDebounceFn);
      } else {
        // If just '@' typed, hide suggestions or show a default list (we will just hide for now)
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
      setMentionStartIndex(-1);
    }
  }, [text, cursorPosition]);

  const insertMention = (handle) => {
    if (mentionStartIndex === -1) return { newText: text, newCursorPos: cursorPosition };

    const textBeforeMention = text.slice(0, mentionStartIndex);
    const textAfterCursor = text.slice(cursorPosition);
    
    const insertion = `@${handle} `;
    const newText = textBeforeMention + insertion + textAfterCursor;
    const newCursorPos = textBeforeMention.length + insertion.length;

    setShowSuggestions(false);
    return { newText, newCursorPos };
  };

  return {
    suggestions,
    showSuggestions,
    insertMention
  };
};

export default useMentionSearch;
