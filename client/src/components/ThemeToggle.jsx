import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/theme-context';

const ThemeToggle = ({ className = '', style = {} }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      style={style}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? (
        <Sun size={16} className="theme-toggle-icon icon-sun" />
      ) : (
        <Moon size={16} className="theme-toggle-icon icon-moon" />
      )}
    </button>
  );
};

export default ThemeToggle;
