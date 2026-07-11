import React from 'react';
import Card from '../components/ui/Card';
import { Zap, BookOpen, Users, Map, Shield } from 'lucide-react';

function About() {
  return (
    <div className="page-transition">
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px var(--primary-glow)',
            marginBottom: 'var(--space-4)'
          }}>
            <Zap size={32} color="white" fill="white" />
          </div>
          <h1 style={{ marginBottom: 'var(--space-2)' }}>About TakeUForward</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            The single place a student needs to survive and thrive in college — connecting juniors with seniors and alumni for mentorship, and centralizing academic and placement knowledge.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ padding: '8px', background: 'var(--primary-bg)', borderRadius: '8px', color: 'var(--primary)' }}>
                <BookOpen size={20} />
              </div>
              <h3 style={{ margin: 0 }}>Academic Resources</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Access centralized notes, PYQs, and study materials sorted by course and semester. No more relying on finding the right Google Drive link in a noisy WhatsApp group.
            </p>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ padding: '8px', background: 'var(--success-bg)', borderRadius: '8px', color: 'var(--success)' }}>
                <Users size={20} />
              </div>
              <h3 style={{ margin: 0 }}>Peer Mentorship</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Connect with seniors and verified alumni for placement guidance, mock interviews, and referral requests. Get advice from people who have actually walked the path.
            </p>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ padding: '8px', background: 'var(--accent-bg)', borderRadius: '8px', color: 'var(--accent)' }}>
                <Map size={20} />
              </div>
              <h3 style={{ margin: 0 }}>Campus Life</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Stay updated with club announcements, find teammates for your next hackathon, or use the campus utilities like the Lost & Found and Secondhand Marketplace.
            </p>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ padding: '8px', background: 'var(--danger-bg)', borderRadius: '8px', color: 'var(--danger)' }}>
                <Shield size={20} />
              </div>
              <h3 style={{ margin: 0 }}>Safe & Anonymous</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Ask questions without fear of judgment using our strict server-side anonymity engine. The platform is restricted to institutional emails to ensure a high-trust environment.
            </p>
          </Card>
        </div>

        <Card style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
          <h2 style={{ marginTop: 0 }}>Built for SSN College of Engineering</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
            Designed to replace the fragmented mix of WhatsApp groups and Instagram DMs so that no student is structurally disadvantaged by not being in the "right" group.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default About;
