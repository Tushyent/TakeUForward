import React from 'react';

function SearchFilterBar({ filters, setFilters, showType = true, showDept = true, showYear = true, showCourse = true, showProfessor = false, showSemester = false, showCompany = false, showRole = false, showEventType = false, showSkill = false, showPlatform = false }) {
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

      {filters.sort !== undefined && (
        <select name="sort" value={filters.sort || 'newest'} onChange={handleChange} style={{ padding: '5px' }}>
          <option value="newest">Newest</option>
          <option value="hot">Hot (Trending)</option>
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

      {showProfessor && (
        <input 
          type="text" 
          name="professorName" 
          placeholder="Professor name..." 
          value={filters.professorName || ''} 
          onChange={handleChange}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      )}

      {showSemester && (
        <select name="semester" value={filters.semester || ''} onChange={handleChange} style={{ padding: '5px' }}>
          <option value="">All Semesters</option>
          <option value="Fall 2026">Fall 2026</option>
          <option value="Spring 2026">Spring 2026</option>
          <option value="Fall 2025">Fall 2025</option>
          <option value="Spring 2025">Spring 2025</option>
        </select>
      )}

      {showCompany && (
        <input 
          type="text" 
          name="company" 
          placeholder="Company (e.g. Google)" 
          value={filters.company || ''} 
          onChange={handleChange}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      )}

      {showRole && (
        <input 
          type="text" 
          name="role" 
          placeholder="Role (e.g. SDE)" 
          value={filters.role || ''} 
          onChange={handleChange}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      )}

      {showEventType && (
        <select name="eventType" value={filters.eventType || ''} onChange={handleChange} style={{ padding: '5px' }}>
          <option value="">All Event Types</option>
          <option value="hackathon">Hackathon</option>
          <option value="project">Project</option>
          <option value="competition">Competition</option>
          <option value="other">Other</option>
        </select>
      )}

      {showSkill && (
        <input 
          type="text" 
          name="skill" 
          placeholder="Skill (e.g. React)" 
          value={filters.skill || ''} 
          onChange={handleChange}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      )}

      {showPlatform && (
        <select name="platform" value={filters.platform || ''} onChange={handleChange} style={{ padding: '5px' }}>
          <option value="">All Platforms</option>
          <option value="nptel">NPTEL</option>
          <option value="college_elective">College Elective</option>
          <option value="other">Other</option>
        </select>
      )}
    </div>
  );
}

export default SearchFilterBar;
