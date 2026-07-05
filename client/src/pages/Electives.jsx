import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import SearchFilterBar from '../components/SearchFilterBar';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, Select, Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Search, AlertCircle } from 'lucide-react';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';

function Electives() {
  const [electives, setElectives] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New elective state
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [platform, setPlatform] = useState('');
  const [semester, setSemester] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [workloadRating, setWorkloadRating] = useState('');
  const [comment, setComment] = useState('');

  const fetchElectives = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axiosClient.get(`/elective-suggestions?${queryParams}`);
      setElectives(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching elective suggestions', err);
      setError('Failed to load elective suggestions');
      toast.error('Failed to load elective suggestions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchElectives();
  }, [fetchElectives]);

  const handleCreateElective = async (e) => {
    e.preventDefault();
    if (!courseCode || !courseName || !platform || !semester || !recommendation || !workloadRating || !comment) {
      toast.error('All fields are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosClient.post('/elective-suggestions', {
        courseCode,
        courseName,
        platform,
        semester,
        recommendation,
        workloadRating: Number(workloadRating),
        comment
      });
      setCourseCode('');
      setCourseName('');
      setPlatform('');
      setSemester('');
      setRecommendation('');
      setWorkloadRating('');
      setComment('');
      
      toast.success('Elective suggestion shared successfully!');
      fetchElectives();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to share elective suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async (id) => {
    const reason = prompt('Why are you reporting this suggestion?');
    if (!reason) return;
    try {
      await axiosClient.post(`/elective-suggestions/${id}/report`, { reason });
      toast.success('Suggestion reported successfully');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to report suggestion');
    }
  };

  const handleUpvote = async (id) => {
    try {
      const { data } = await axiosClient.post(`/elective-suggestions/${id}/upvote`);
      setElectives(electives.map(e => 
        e._id === id ? { ...e, upvotesCount: data.upvotesCount } : e
      ));
    } catch (err) {
      toast.error('Failed to upvote');
    }
  };

  return (
    <div className="page-transition">
      <Navbar />
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <h1>NPTEL & College Electives</h1>
        <p style={{ marginBottom: '2rem', fontSize: '1.1em' }}>Find and share recommendations for NPTEL courses and college electives.</p>
        
        <SearchFilterBar 
          filters={filters} 
          setFilters={setFilters} 
          showType={false} 
          showDept={false} 
          showYear={false} 
          showCourse={true}
          showPlatform={true}
          showSemester={true}
        />

        <Card style={{ marginTop: '2rem' }}>
          <form onSubmit={handleCreateElective}>
            <h3 style={{ marginTop: 0 }}>Suggest an Elective</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <Input 
                placeholder="Course Code (e.g. NOC23-CS12)" 
                value={courseCode} 
                onChange={(e) => setCourseCode(e.target.value)} 
              />
              <Input 
                placeholder="Course Name (e.g. Joy of Computing using Python)" 
                value={courseName} 
                onChange={(e) => setCourseName(e.target.value)} 
              />
              <Select 
                value={platform} 
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="">Select Platform</option>
                <option value="nptel">NPTEL</option>
                <option value="college_elective">College Elective</option>
                <option value="other">Other</option>
              </Select>
              <Select 
                value={semester} 
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="">Taken in Semester</option>
                <option value="Fall 2026">Fall 2026</option>
                <option value="Spring 2026">Spring 2026</option>
                <option value="Fall 2025">Fall 2025</option>
                <option value="Spring 2025">Spring 2025</option>
              </Select>
              <Select 
                value={recommendation} 
                onChange={(e) => setRecommendation(e.target.value)}
              >
                <option value="">Overall Recommendation</option>
                <option value="recommend">Strongly Recommend</option>
                <option value="neutral">Neutral</option>
                <option value="avoid">Avoid</option>
              </Select>
              <Select 
                value={workloadRating} 
                onChange={(e) => setWorkloadRating(e.target.value)}
              >
                <option value="">Workload (1-5)</option>
                <option value="1">1 - Very Light</option>
                <option value="2">2 - Light</option>
                <option value="3">3 - Moderate</option>
                <option value="4">4 - Heavy</option>
                <option value="5">5 - Very Heavy</option>
              </Select>
            </div>
            
            <Textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Why do you recommend (or not recommend) this elective? Mention grading, assignments, etc."
              style={{ width: '100%', minHeight: '80px', marginBottom: '15px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Share Suggestion'}
              </Button>
            </div>
          </form>
        </Card>

        <h2 style={{ marginTop: '3rem' }}>Suggestions</h2>
        {error ? (
          <EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchElectives }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} />
        ) : loading ? <Spinner text="Loading suggestions..." /> : electives.length === 0 ? (
          <EmptyState icon={Search} message="No elective suggestions found matching your filters." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {electives.map((elective) => (
              <Card key={elective._id} style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>
                      {elective.courseCode} - {elective.courseName}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
                      <Badge variant={elective.recommendation === 'recommend' ? 'success' : elective.recommendation === 'avoid' ? 'danger' : 'secondary'}>
                        {elective.recommendation.toUpperCase()}
                      </Badge>
                      <Badge variant="primary">{elective.platform}</Badge>
                      <Badge variant="info">Workload: {elective.workloadRating}/5</Badge>
                      <Badge variant="secondary">{elective.semester}</Badge>
                    </div>
                  </div>
                </div>
                
                <p style={{ fontSize: '1.1em', marginBottom: '15px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {elective.comment}
                </p>
                
                <div style={{ fontSize: '0.85em', color: 'var(--text)', marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    By: {elective.authorId ? (
                      <>
                        <Link to={`/profile/${elective.authorId.username}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                          {elective.authorId.name} (@{elective.authorId.handle})
                        </Link>
                        {elective.authorId.isVerifiedAlumni && <VerifiedAlumniBadge isVerifiedAlumni={elective.authorId.isVerifiedAlumni} />}
                      </>
                    ) : 'Unknown'}
                  </span>
                  <span>• {new Date(elective.createdAt).toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button variant="secondary" onClick={() => handleUpvote(elective._id)} style={{ padding: '6px 12px', fontSize: '13px' }}>
                    ▲ Upvote ({elective.upvotesCount || 0})
                  </Button>
                  <Button variant="secondary" onClick={() => handleReport(elective._id)} style={{ padding: '6px 12px', fontSize: '13px' }}>
                    ⚑ Report
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Electives;
