import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, Select, Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Route, AlertCircle } from 'lucide-react';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';

function CareerRoadmaps() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Filter state
  const [careerPathFilter, setCareerPathFilter] = useState('');

  // Form state
  const [careerPath, setCareerPath] = useState('');
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState([{ stepTitle: '', description: '' }]);

  const fetchRoadmaps = useCallback(async () => {
    setLoading(true);
    try {
      


      const queryParams = new URLSearchParams();
      if (careerPathFilter) queryParams.append('careerPath', careerPathFilter);

      const response = await axiosClient.get(`/career-roadmaps?${queryParams.toString()}`);
      setRoadmaps(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching roadmaps', err);
      setError('Failed to load career roadmaps');
      toast.error('Failed to load career roadmaps');
    } finally {
      setLoading(false);
    }
  }, [careerPathFilter]);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  const handleAddStep = () => {
    setSteps([...steps, { stepTitle: '', description: '' }]);
  };

  const handleRemoveStep = (index) => {
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated);
  };

  const handleStepChange = (index, field, value) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const handleCreateRoadmap = async (e) => {
    e.preventDefault();
    if (!careerPath || !title) {
      toast.error('Career Path and Title are required');
      return;
    }

    const validSteps = steps.filter(s => s.stepTitle.trim() !== '' && s.description.trim() !== '');
    if (validSteps.length === 0) {
      toast.error('At least one valid step is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosClient.post('/career-roadmaps', {
        careerPath,
        title,
        steps: validSteps
      });
      setCareerPath('');
      setTitle('');
      setSteps([{ stepTitle: '', description: '' }]);
      
      toast.success('Career roadmap posted successfully!');
      fetchRoadmaps();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post career roadmap');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async (id) => {
    const reason = prompt('Why are you reporting this roadmap?');
    if (!reason) return;
    try {
      await axiosClient.post(`/career-roadmaps/${id}/report`, { reason });
      toast.success('Roadmap reported successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report roadmap');
    }
  };

  const handleUpvote = async (id) => {
    try {
      const { data } = await axiosClient.post(`/career-roadmaps/${id}/upvote`);
      setRoadmaps(roadmaps.map(r => 
        r._id === id ? { ...r, upvotesCount: data.upvotesCount } : r
      ));
    } catch (err) {
      console.error(err);
      toast.error('Failed to upvote');
    }
  };

  const isEligibleMentor = user?.role === 'alumni' && user?.isVerifiedAlumni;

  return (
    <div className="page-transition">
            <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <h1>Career Roadmaps</h1>
        <p style={{ marginBottom: '2rem', fontSize: '1.1em' }}>Step-by-step guidance curated by verified alumni.</p>
        
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Select 
            value={careerPathFilter} 
            onChange={(e) => setCareerPathFilter(e.target.value)}
          >
            <option value="">All Career Paths</option>
            <option value="sde">Software Development (SDE)</option>
            <option value="pm">Product Management</option>
            <option value="core">Core Engineering</option>
            <option value="higher_studies">Higher Studies</option>
            <option value="other">Other</option>
          </Select>
        </div>

        {isEligibleMentor && (
          <Card style={{ marginTop: '2rem', borderColor: 'var(--primary)' }}>
            <form onSubmit={handleCreateRoadmap}>
              <h3 style={{ marginTop: 0 }}>Create a Career Roadmap</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <Input 
                  placeholder="Roadmap Title (e.g. SDE 1 Prep Guide)" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
                <Select 
                  value={careerPath} 
                  onChange={(e) => setCareerPath(e.target.value)}
                >
                  <option value="">Select Career Path</option>
                  <option value="sde">Software Development (SDE)</option>
                  <option value="pm">Product Management</option>
                  <option value="core">Core Engineering</option>
                  <option value="higher_studies">Higher Studies</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <h4 style={{ marginBottom: '10px' }}>Steps</h4>
              {steps.map((step, idx) => (
                <div key={`step-${idx}`} style={{ background: 'var(--bg-surface)', padding: '15px', borderRadius: '6px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ color: 'var(--text)' }}>Step {idx + 1}</strong>
                    {steps.length > 1 && (
                      <Button variant="danger" onClick={() => handleRemoveStep(idx)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                        Remove
                      </Button>
                    )}
                  </div>
                  <Input 
                    placeholder="Step Title" 
                    value={step.stepTitle} 
                    onChange={(e) => handleStepChange(idx, 'stepTitle', e.target.value)} 
                    style={{ marginBottom: '10px' }}
                  />
                  <Textarea 
                    value={step.description}
                    onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                    placeholder="Describe what needs to be done in this step..."
                    style={{ width: '100%', minHeight: '60px' }}
                  />
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={handleAddStep} style={{ marginBottom: '20px' }}>
                + Add Step
              </Button>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Publishing...' : 'Publish Roadmap'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        <h2 style={{ marginTop: '3rem' }}>Published Roadmaps</h2>
        {error ? (
          <EmptyState icon={AlertCircle} title="Error" message={error} action={{ label: 'Retry', onClick: fetchRoadmaps }} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} />
        ) : loading ? <Spinner text="Loading roadmaps..." /> : roadmaps.length === 0 ? (
          <EmptyState icon={Route} message="No career roadmaps found." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {roadmaps.map((roadmap) => (
              <Card key={roadmap._id} style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: 'var(--primary)', fontSize: '1.4rem' }}>
                      {roadmap.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
                      <Badge variant="primary">{roadmap.careerPath.toUpperCase()}</Badge>
                      <span style={{ fontSize: '0.85em', color: 'var(--text)' }}>
                        Curated by: {roadmap.authorId ? (
                          <>
                            <Link to={`/profile/${roadmap.authorId.username}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>
                              {roadmap.authorId.name}
                            </Link>
                            {roadmap.authorId.isVerifiedAlumni && <VerifiedAlumniBadge isVerifiedAlumni={roadmap.authorId.isVerifiedAlumni} />}
                          </>
                        ) : 'Unknown'}
                      </span>
                      <span style={{ fontSize: '0.85em', color: 'var(--text)' }}>
                        • {new Date(roadmap.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '15px 0', borderTop: '1px solid var(--border)' }}>
                  {roadmap.steps.map((step, idx) => (
                    <div key={step.order || idx} style={{ marginBottom: idx === roadmap.steps.length - 1 ? 0 : '15px', display: 'flex', gap: '15px' }}>
                      <div style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 'bold' }}>
                        {step.order}
                      </div>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)', fontSize: '1.1em' }}>{step.stepTitle}</strong>
                        <p style={{ margin: 0, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                  <Button variant="secondary" onClick={() => handleUpvote(roadmap._id)} style={{ padding: '6px 12px', fontSize: '13px' }}>
                    ▲ Upvote ({roadmap.upvotesCount || 0})
                  </Button>
                  <Button variant="secondary" onClick={() => handleReport(roadmap._id)} style={{ padding: '6px 12px', fontSize: '13px' }}>
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

export default CareerRoadmaps;
