import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Users, Shield, Search, Heart, Sparkles, BookOpen, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useSEO } from '../hooks/useSEO';

function About() {
  const { user } = useAuth();

  useSEO({
    title: 'About | TakeUForward SSN - One-Stop Campus Mate',
    description: 'TakeUForward SSN (TUF SSN) is the official one-stop campus mate and mentorship platform for SSN College of Engineering. Learn why we built this centralized portal.',
    keywords: 'TakeUForward SSN, TUF SSN, One Stop Campus Mate, SSN Mentorship Platform, Campus Mate SSN, SSN College of Engineering, Mentorship, Placements',
    canonical: 'https://takeuforward.blastorz.fun/about'
  });
  const features = [
    {
      icon: Shield,
      color: 'var(--danger)',
      bg: 'var(--danger-bg)',
      feature: 'Server-Side Anonymity Engine',
      why: 'Students were afraid to ask "dumb" questions or share sensitive confessions because their identities were tied to their profiles. We built an anonymity engine that strips your identity at the database level so you can ask anything without fear of judgment.'
    },
    {
      icon: Users,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      feature: 'Verified Alumni Directory & Mentorship',
      why: 'Juniors had no structured way to find seniors for mock interviews, career guidance, or referrals. They relied on blind LinkedIn connections. We built a vetted directory to seamlessly bridge the gap between students and working professionals.'
    },
    {
      icon: BookOpen,
      color: 'var(--primary)',
      bg: 'var(--primary-glow)',
      feature: 'Centralized Academic Repository & AI Summaries',
      why: 'Crucial study materials, PYQs, and notes were scattered across fragmented WhatsApp groups and expiring Google Drive links. We centralized all academic resources and integrated Gemini AI to summarize complex PDFs instantly.'
    },
    {
      icon: Search,
      color: 'var(--accent)',
      bg: 'var(--accent-bg)',
      feature: 'Campus Marketplace & Lost/Found',
      why: 'Students had to spam official batch WhatsApp groups to sell second-hand textbooks or find lost ID cards, which cluttered academic channels. We created dedicated, peer-to-peer utility boards to handle campus life efficiently.'
    }
  ];

  return (
    <div className="page-transition">
      {/* ── TOP PUBLIC NAV BAR ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(13, 14, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: 'var(--space-3) var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link to={user ? "/home" : "/login"} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textDecoration: 'none' }}>
          <img src="/favicon.svg" alt="TakeUForward Logo" style={{ width: 36, height: 36 }} />
          <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#fff', letterSpacing: '-0.02em' }}>
            TakeUForward <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>SSN</span>
          </span>
        </Link>

        <div>
          {user ? (
            <Link to="/home" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">
                <LayoutDashboard size={16} /> Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">
                <LogIn size={16} /> Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-6) var(--space-8)' }}>

        {/* ── HERO ── */}
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8) var(--space-6)',
          marginBottom: 'var(--space-8)',
          background: 'linear-gradient(135deg, var(--bg-input) 0%, var(--bg-surface) 60%, var(--bg-base) 100%)',
          border: '1px solid rgba(124,106,247,0.2)',
          boxShadow: '0 0 40px rgba(124,106,247,0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          {/* Decorative Gradients */}
          <div style={{
            position: 'absolute', top: -50, right: -50,
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,106,247,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -30, left: 60,
            width: 140, height: 140, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Logo & Heading */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <img 
              src="/favicon.svg" 
              alt="TakeUForward Logo" 
              style={{ width: 80, height: 80, marginBottom: 'var(--space-4)', filter: 'drop-shadow(0 0 20px var(--primary-glow))' }} 
            />
            <h1 style={{ margin: '0 0 var(--space-3) 0', fontSize: '2.5rem', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              TakeUForward SSN — One-Stop Campus Mate
            </h1>
            
            <p style={{
              fontSize: 'var(--text-lg)', color: 'var(--text-secondary)',
              lineHeight: 1.7, margin: '0 auto', maxWidth: '700px'
            }}>
              TUF SSN is the premier one-stop campus mate and mentorship platform connecting juniors, seniors, and alumni. 
              We are centralizing academic knowledge, standardizing mentorship, and building a secure, thriving campus community for SSN College of Engineering.
            </p>
          </div>
        </div>

        {/* ── FEATURES & WHY ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-6)' }}>
          <Sparkles size={24} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Why We Built This</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
          {features.map((item, idx) => (
            <Card key={idx} style={{
              padding: 'var(--space-6)',
              borderLeft: `4px solid ${item.color}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              background: 'var(--bg-surface)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{
                  width: 48, height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: `${item.bg}88`,
                  border: `1px solid ${item.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <item.icon size={24} color={item.color} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  <span style={{ color: item.color, fontWeight: 700 }}>Feature:</span> {item.feature}
                </h3>
              </div>
              
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                padding: 'var(--space-4)', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 'var(--text-base)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Why:</strong> {item.why}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* ── FREQUENTLY ASKED QUESTIONS (SEO & AEO OPTIMIZED) ── */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-6)' }}>
            <BookOpen size={24} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Frequently Asked Questions</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[
              {
                q: "What is TakeUForward?",
                a: "TakeUForward SSN is an all-in-one campus community, placement preparation, and alumni mentorship platform created exclusively for SSN College of Engineering students and alumni."
              },
              {
                q: "How does alumni mentorship work?",
                a: "Enrolled SSN students can search verified alumni profiles by company or engineering domain and request 1:1 mock interviews, career guidance, and corporate job referrals."
              },
              {
                q: "Is TakeUForward free to use?",
                a: "Yes, TakeUForward is 100% free for all verified SSN College of Engineering students, faculty, and alumni."
              },
              {
                q: "Who can join the platform?",
                a: "Currently, enrolled SSN students using official @ssn.edu.in Google Workspace accounts and verified alumni are eligible to join."
              },
              {
                q: "Can students request job referrals?",
                a: "Yes, students can browse active alumni working at top tech firms (e.g. Google, Amazon, Microsoft, PayPal) and submit structured referral requests."
              },
              {
                q: "Is my privacy protected when discussing sensitive topics?",
                a: "Absolutely. TakeUForward features a server-side anonymity engine that strips author metadata at the database controller level before sending API responses."
              }
            ].map((faq, index) => (
              <Card key={index} style={{ padding: 'var(--space-5)', background: 'var(--bg-surface)' }}>
                <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                  {faq.q}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {faq.a}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* ── FAQ SCHEMAS FOR SEARCH ENGINES & LLM OVERVIEWS ── */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is TakeUForward?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "TakeUForward SSN is an all-in-one campus community, placement preparation, and alumni mentorship platform created exclusively for SSN College of Engineering students and alumni."
              }
            },
            {
              "@type": "Question",
              "name": "How does alumni mentorship work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Enrolled SSN students can search verified alumni profiles by company or engineering domain and request 1:1 mock interviews, career guidance, and corporate job referrals."
              }
            },
            {
              "@type": "Question",
              "name": "Is TakeUForward free to use?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, TakeUForward is 100% free for all verified SSN College of Engineering students, faculty, and alumni."
              }
            },
            {
              "@type": "Question",
              "name": "Is my privacy protected when discussing sensitive topics?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Absolutely. TakeUForward features a server-side anonymity engine that strips author metadata at the database controller level before sending API responses."
              }
            }
          ]
        })}
        </script>

        {/* ── FOOTER ── */}
        <Card style={{
          textAlign: 'center',
          padding: 'var(--space-8) var(--space-6)',
          borderStyle: 'dashed',
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'transparent'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
            <Heart size={24} color="var(--danger)" fill="var(--danger)" className="animate-pulse" />
          </div>
          <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            Built with <span style={{ color: 'var(--danger)' }}>&lt;3</span> for SSN
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
            by <strong>Tushyent N P</strong>
          </p>
        </Card>

      </div>
    </div>
  );
}

export default About;
