import React from 'react';
import { Input, Select } from './ui/Input';

function SearchFilterBar({ filters, setFilters, showType = true, showDept = true, showYear = true, showCourse = true, showProfessor = false, showSemester = false, showCompany = false, showRole = false, showEventType = false, showSkill = false, showPlatform = false }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <Input 
        type="text" 
        name="q" 
        placeholder="Search text..." 
        value={filters.q || ''} 
        onChange={handleChange}
      />
      
      {showType && (
        <Select name="type" value={filters.type || ''} onChange={handleChange}>
          <option value="">All Types</option>
          <option value="question">Question</option>
          <option value="resource">Resource</option>
          <option value="event">Event</option>
        </Select>
      )}

      {filters.sort !== undefined && (
        <Select name="sort" value={filters.sort || 'newest'} onChange={handleChange}>
          <option value="newest">Newest</option>
          <option value="hot">Hot (Trending)</option>
        </Select>
      )}

      {showDept && (
        <Select name="dept" value={filters.dept || ''} onChange={handleChange}>
          <option value="">All Depts</option>
          <option value="CSE">CSE</option>
          <option value="IT">IT</option>
          <option value="ECE">ECE</option>
        </Select>
      )}

      {showYear && (
        <Select name="year" value={filters.year || ''} onChange={handleChange}>
          <option value="">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </Select>
      )}

      {showCourse && (
        <Input 
          type="text" 
          name="courseCode" 
          placeholder="Course code (e.g. CS123)" 
          value={filters.courseCode || ''} 
          onChange={handleChange}
        />
      )}

      {showProfessor && (
        <Input 
          type="text" 
          name="professorName" 
          placeholder="Professor name..." 
          value={filters.professorName || ''} 
          onChange={handleChange}
        />
      )}

      {showSemester && (
        <Select name="semester" value={filters.semester || ''} onChange={handleChange}>
          <option value="">All Semesters</option>
          <option value="Fall 2026">Fall 2026</option>
          <option value="Spring 2026">Spring 2026</option>
          <option value="Fall 2025">Fall 2025</option>
          <option value="Spring 2025">Spring 2025</option>
        </Select>
      )}

      {showCompany && (
        <Input 
          type="text" 
          name="company" 
          placeholder="Company (e.g. Google)" 
          value={filters.company || ''} 
          onChange={handleChange}
        />
      )}

      {showRole && (
        <Input 
          type="text" 
          name="role" 
          placeholder="Role (e.g. SDE)" 
          value={filters.role || ''} 
          onChange={handleChange}
        />
      )}

      {showEventType && (
        <Select name="eventType" value={filters.eventType || ''} onChange={handleChange}>
          <option value="">All Event Types</option>
          <option value="hackathon">Hackathon</option>
          <option value="project">Project</option>
          <option value="competition">Competition</option>
          <option value="other">Other</option>
        </Select>
      )}

      {showSkill && (
        <Input 
          type="text" 
          name="skill" 
          placeholder="Skill (e.g. React)" 
          value={filters.skill || ''} 
          onChange={handleChange}
        />
      )}

      {showPlatform && (
        <Select name="platform" value={filters.platform || ''} onChange={handleChange}>
          <option value="">All Platforms</option>
          <option value="nptel">NPTEL</option>
          <option value="college_elective">College Elective</option>
          <option value="other">Other</option>
        </Select>
      )}
    </div>
  );
}

export default SearchFilterBar;
