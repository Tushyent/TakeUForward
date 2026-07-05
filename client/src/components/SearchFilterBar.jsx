import React from 'react';

function SearchFilterBar({ filters, setFilters, showType = true, showDept = true, showYear = true, showCourse = true }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', padding: '10px', background: '#f5f5f5', color: '#000', borderRadius: '8px' }}>
      <input 
        type="text" 
        name="q" 
        placeholder="Search text..." 
        value={filters.q || ''} 
        onChange={handleChange}
        style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      
      {showType && (
        <select name="type" value={filters.type || ''} onChange={handleChange} style={{ padding: '5px' }}>
          <option value="">All Types</option>
          <option value="question">Question</option>
          <option value="resource">Resource</option>
          <option value="event">Event</option>
        </select>
      )}

      {showDept && (
        <select name="dept" value={filters.dept || ''} onChange={handleChange} style={{ padding: '5px' }}>
          <option value="">All Depts</option>
          <option value="CSE">CSE</option>
          <option value="IT">IT</option>
          <option value="ECE">ECE</option>
        </select>
      )}

      {showYear && (
        <select name="year" value={filters.year || ''} onChange={handleChange} style={{ padding: '5px' }}>
          <option value="">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
      )}

      {showCourse && (
        <input 
          type="text" 
          name="courseCode" 
          placeholder="Course code (e.g. CS123)" 
          value={filters.courseCode || ''} 
          onChange={handleChange}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      )}
    </div>
  );
}

export default SearchFilterBar;
