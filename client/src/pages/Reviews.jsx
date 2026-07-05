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
import { Input } from '../components/ui/Input';
import VerifiedAlumniBadge from '../components/VerifiedAlumniBadge';

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New review state
  const [courseCode, setCourseCode] = useState('');
  const [professorName, setProfessorName] = useState('');
  const [semester, setSemester] = useState('');
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axiosClient.get(`/reviews?${queryParams}`);
      setReviews(response.data.reviews);
      setSummary(response.data.summary);
    } catch (err) {
      console.error('Error fetching reviews', err);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!courseCode || !professorName || !semester || !rating || !comment) {
      toast.error('All fields are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosClient.post('/reviews', {
        courseCode,
        professorName,
        semester,
        rating: Number(rating),
        comment,
        isAnonymous
      });
      setCourseCode('');
      setProfessorName('');
      setSemester('');
      setRating('');
      setComment('');
      setIsAnonymous(false);
      toast.success('Review created successfully!');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async (reviewId) => {
    const reason = prompt('Why are you reporting this review?');
    if (!reason) return;
    try {
      await axiosClient.post(`/reviews/${reviewId}/report`, { reason });
      toast.success('Review reported successfully');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to report review');
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <h1>Course & Professor Reviews</h1>
        <p style={{ marginBottom: '2rem', fontSize: '1.1em' }}>Find and share reviews for courses and professors.</p>
        
        <SearchFilterBar 
          filters={filters} 
          setFilters={setFilters} 
          showType={false} 
          showDept={false} 
          showYear={false} 
          showCourse={true}
          showProfessor={true}
          showSemester={true}
        />

        {/* Aggregate Summary */}
        {(filters.courseCode || filters.professorName) && !loading && (
          <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--social-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Review Summary</h3>
            <p style={{ margin: 0 }}>
              <strong>Average Rating:</strong> {summary.averageRating > 0 ? summary.averageRating : 'N/A'} / 5.0 
              <span style={{ marginLeft: '15px' }}><strong>Total Reviews:</strong> {summary.totalReviews}</span>
            </p>
          </div>
        )}

        <Card style={{ marginTop: '2rem' }}>
          <form onSubmit={handleCreateReview}>
            <h3 style={{ marginTop: 0 }}>Write a Review</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <Input 
                placeholder="Course Code (e.g. CS101)" 
                value={courseCode} 
                onChange={(e) => setCourseCode(e.target.value)} 
              />
              <Input 
                placeholder="Professor Name" 
                value={professorName} 
                onChange={(e) => setProfessorName(e.target.value)} 
              />
              <select 
                value={semester} 
                onChange={(e) => setSemester(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="">Select Semester</option>
                <option value="Fall 2026">Fall 2026</option>
                <option value="Spring 2026">Spring 2026</option>
                <option value="Fall 2025">Fall 2025</option>
                <option value="Spring 2025">Spring 2025</option>
              </select>
              <select 
                value={rating} 
                onChange={(e) => setRating(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="">Select Rating (1-5)</option>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Terrible</option>
              </select>
            </div>
            
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review here..."
              style={{ width: '100%', minHeight: '80px', marginBottom: '15px', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                Post Anonymously
              </label>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Review'}
              </Button>
            </div>
          </form>
        </Card>

        <h2 style={{ marginTop: '3rem' }}>Reviews</h2>
        {loading ? <Spinner text="Loading reviews..." /> : reviews.length === 0 ? (
          <div className="empty-state">No reviews found matching your filters.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {reviews.map((review) => (
              <Card key={review._id} style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-h)' }}>
                      {review.courseCode} - {review.professorName}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                      <Badge variant="primary">Rating: {review.rating}/5</Badge>
                      <Badge variant="info">{review.semester}</Badge>
                    </div>
                  </div>
                </div>
                
                <p style={{ fontSize: '1.1em', marginBottom: '15px', color: 'var(--text-h)' }}>
                  {review.comment}
                </p>
                
                <div style={{ fontSize: '0.85em', color: 'var(--text)', marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    By: {review.isAnonymous ? 'Anonymous' : (
                      <>
                        <Link to={`/profile/${review.authorId?.username}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                          {review.authorId?.name || 'Unknown'} (@{review.authorId?.handle || 'unknown'})
                        </Link>
                        {review.authorId?.isVerifiedAlumni && <VerifiedAlumniBadge isVerifiedAlumni={review.authorId.isVerifiedAlumni} />}
                      </>
                    )}
                    {!review.isAnonymous && review.authorId && (
                      <Link to={`/chat/${review.authorId._id}`} style={{ textDecoration: 'none' }}>
                        <Badge variant="success">Message</Badge>
                      </Link>
                    )}
                  </span>
                  <span>• {new Date(review.createdAt).toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button variant="secondary" onClick={() => handleReport(review._id)} style={{ padding: '6px 12px', fontSize: '13px' }}>
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

export default Reviews;
