import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
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

function InterviewExperiences() {
  const [experiences, setExperiences] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New experience state
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [batchYear, setBatchYear] = useState('');
  const [overallOutcome, setOverallOutcome] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const [rounds, setRounds] = useState([
    { roundName: '', description: '', difficulty: '' }
  ]);

  const fetchExperiences = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axiosClient.get(`/interview-experiences?${queryParams}`);
      setExperiences(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching experiences', err);
      setError('Failed to load experiences');
      toast.error('Failed to load experiences');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const handleAddRound = () => {
    setRounds([...rounds, { roundName: '', description: '', difficulty: '' }]);
  };

  const handleRemoveRound = (index) => {
    if (rounds.length > 1) {
      setRounds(rounds.filter((_, i) => i !== index));
    }
  };

  const handleRoundChange = (index, field, value) => {
    const newRounds = [...rounds];
    newRounds[index][field] = value;
    setRounds(newRounds);
  };

  const handleCreateExperience = async (e) => {
    e.preventDefault();
    if (!company || !role || !batchYear || !overallOutcome) {
      toast.error('Please fill in all general details');
      return;
    }
    
    // validate rounds
    for (const r of rounds) {
      if (!r.roundName || !r.description || !r.difficulty) {
        toast.error('Please fill in all details for each round');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await axiosClient.post('/interview-experiences', {
        company,
        role,
        batchYear: Number(batchYear),
        overallOutcome,
        rounds: rounds.map(r => ({ ...r, difficulty: Number(r.difficulty) })),
        isAnonymous
      });
      
      setCompany('');
      setRole('');
      setBatchYear('');
      setOverallOutcome('');
      setIsAnonymous(false);
      setRounds([{ roundName: '', description: '', difficulty: '' }]);
      
      toast.success('Interview experience shared successfully!');
      fetchExperiences();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to share experience');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async (expId) => {
    const reason = prompt('Why are you reporting this experience?');
    if (!reason) return;
    try {
      await axiosClient.post(`/interview-experiences/${expId}/report`, { reason });
      toast.success('Experience reported successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report experience');
    }
  };

  const handleUpvote = async (expId) => {
    try {
      const { data } = await axiosClient.post(`/interview-experiences/${expId}/upvote`);
      setExperiences(experiences.map(exp => 
        exp._id === expId ? { ...exp, upvotes: Array(data.upvoteCount).fill('placeholder') } : exp
      ));
    } catch (err) {
      console.error(err);
      toast.error('Failed to upvote');
    }
  };

  return (
    <div className="page-transition">
            <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <h1>Interview Experiences</h1>
        <p style={{ marginBottom: '2rem', fontSize: '1.1em' }}>Read and share detailed interview experiences to help your peers prepare.</p>
        
        <SearchFilterBar 
          filters={filters} 
          setFilters={setFilters} 
          showType={false} 
          showDept={false} 
          showCourse={false}
          showYear={true}
          showCompany={true}
          showRole={true}
        />

        <Card style={{ marginTop: '2rem' }}>
          <form onSubmit={handleCreateExperience}>
            <h3 style={{ marginTop: 0 }}>Share Your Experience</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <Input 
                placeholder="Company (e.g. Google)" 
                value={company} 
                onChange={(e) => setCompany(e.target.value)} 
              />
              <Input 
                placeholder="Role (e.g. SDE Intern)" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
              />
              <Input 
                type="number"
                placeholder="Batch Year (e.g. 2026)" 
                value={batchYear} 
                onChange={(e) => setBatchYear(e.target.value)} 
              />
              <Select 
                value={overallOutcome} 
                onChange={(e) => setOverallOutcome(e.target.value)}
              >
                <option value="">Select Outcome</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </Select>
            </div>
            
            <h4 style={{ marginBottom: '10px' }}>Interview Rounds</h4>
            {rounds.map((round, index) => (
              <div key={index} style={{ marginBottom: '15px', padding: '15px', border: '1px dashed var(--border)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong>Round {index + 1}</strong>
                  {rounds.length > 1 && (
                    <Button type="button" variant="danger" onClick={() => handleRemoveRound(index)} style={{ padding: '4px 8px', fontSize: '12px' }}>Remove Round</Button>
                  )}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: '15px', marginBottom: '10px' }}>
                  <Input 
                    placeholder="Round Name (e.g. Online Assessment, DSA Round)" 
                    value={round.roundName} 
                    onChange={(e) => handleRoundChange(index, 'roundName', e.target.value)} 
                  />
                  <Select 
                    value={round.difficulty} 
                    onChange={(e) => handleRoundChange(index, 'difficulty', e.target.value)}
                  >
                    <option value="">Difficulty (1-5)</option>
                    <option value="1">1 - Very Easy</option>
                    <option value="2">2 - Easy</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - Hard</option>
                    <option value="5">5 - Very Hard</option>
                  </Select>
                </div>
                
                <Textarea 
                  value={round.description}
                  onChange={(e) => handleRoundChange(index, 'description', e.target.value)}
                  placeholder="Describe the round, questions asked, platform used..."
                  style={{ width: '100%', minHeight: '60px' }}
                />
              </div>
            ))}
            
            <Button type="button" variant="secondary" onClick={handleAddRound} style={{ marginBottom: '20px' }}>
              + Add Another Round
            </Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                Post Anonymously
              </label>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Share Experience'}
              </Button>
            </div>
          </form>
        </Card>

        <h2 style={{ marginTop: '3rem' }}>Experiences</h2>
        {error ? (
          <EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchExperiences }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} />
        ) : loading ? <Spinner text="Loading experiences..." /> : experiences.length === 0 ? (
          <EmptyState icon={Search} message="No experiences found matching your filters." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {experiences.map((exp) => (
              <Card key={exp._id} style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>
                      {exp.company} - {exp.role}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                      <Badge variant={exp.overallOutcome === 'selected' ? 'success' : exp.overallOutcome === 'rejected' ? 'danger' : 'secondary'}>
                        {exp.overallOutcome.toUpperCase()}
                      </Badge>
                      <Badge variant="info">Batch of {exp.batchYear}</Badge>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                  {exp.rounds?.map((round, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Round {idx + 1}: {round.roundName}</strong>
                        <Badge variant="secondary">Difficulty: {round.difficulty}/5</Badge>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                        {round.description}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div style={{ fontSize: '0.85em', color: 'var(--text)', marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    By: {exp.isAnonymous ? 'Anonymous' : (
                      <>
                        <Link to={`/profile/${exp.authorId?.username}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                          {exp.authorId?.name || 'Unknown'} (@{exp.authorId?.handle || 'unknown'})
                        </Link>
                        {exp.authorId?.isVerifiedAlumni && <VerifiedAlumniBadge isVerifiedAlumni={exp.authorId.isVerifiedAlumni} />}
                      </>
                    )}
                    {!exp.isAnonymous && exp.authorId && (
                      <Link to={`/chat/${exp.authorId._id}`} style={{ textDecoration: 'none' }}>
                        <Badge variant="success">Message</Badge>
                      </Link>
                    )}
                  </span>
                  <span>• {new Date(exp.createdAt).toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button variant="secondary" onClick={() => handleUpvote(exp._id)} style={{ padding: '6px 12px', fontSize: '13px' }}>
                    ▲ Upvote ({exp.upvotes?.length || 0})
                  </Button>
                  <Button variant="secondary" onClick={() => handleReport(exp._id)} style={{ padding: '6px 12px', fontSize: '13px' }}>
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

export default InterviewExperiences;
