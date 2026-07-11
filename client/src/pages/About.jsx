import React from 'react';
import Card from '../components/ui/Card';
import { Zap, MessageSquare, Users, GraduationCap, Shield, ArrowUpRight } from 'lucide-react';

function About() {
  return (
    <div className="page-transition">
      <div className="page-col page-col-wide" style={{ paddingBlock: 'var(--space-6) var(--space-8)' }}>

        {/* ── HERO ── */}
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8) var(--space-6)',
          marginBottom: 'var(--space-6)',
          background: 'linear-gradient(135deg, var(--bg-input) 0%, var(--bg-surface) 60%, var(--bg-base) 100%)',
          border: '1px solid rgba(124,106,247,0.2)',
          boxShadow: '0 0 40px rgba(124,106,247,0.08)',
          overflow: 'hidden',
        }}>
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

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px var(--primary-glow)',
              marginBottom: 'var(--space-4)',
            }}>
              <Zap size={28} color="white" fill="white" />
            </div>
            <h1 style={{ margin: '0 0 var(--space-2) 0' }}>About TakeUForward</h1>
            <p style={{
              fontSize: 'var(--text-base)', color: 'var(--text-secondary)',
              lineHeight: 1.7, margin: 0,
            }}>
              The single place a student needs to survive and thrive in college — connecting juniors with seniors
              and alumni for mentorship, centralizing academic and placement knowledge that would otherwise be lost
              year after year.
            </p>
          </div>
        </div>

        {/* ── WHY WE BUILT THIS ── */}
        <Card style={{
          marginBottom: 'var(--space-6)',
          borderLeft: '3px solid var(--primary)',
          padding: 'var(--space-5)',
        }}>
          <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} color="var(--primary)" />
            Why we built this
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
              At SSN, information flows through a fragmented mix of WhatsApp groups, Instagram DMs, and word of mouth.
              Notes and PYQs get passed down through Google Drive links that expire the moment a senior graduates.
              Interview experiences live in people's memories, undocumented. Asking a "dumb" question requires
              finding the right person to ask privately — and if you don't know who that is, you simply don't ask.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
              Every incoming batch re-discovers the same mistakes. Seniors who want to mentor have no structured
              way to give back — the same questions get asked in DMs, individually, over and over. Alumni who could
              offer referrals are invisible to the juniors who need them. And none of this knowledge survives
              beyond a 4-year cycle.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
              TakeUForward exists to fix that — by making knowledge persistent, searchable, and role-aware;
              by giving students a safe way to ask anonymously; and by building the single trusted place for
              everything campus-related.
            </p>
          </div>
        </Card>

        {/* ── WHAT WE OFFER ── */}
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
          <Zap size={18} color="var(--accent)" />
          What we offer
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}>
          {[
            { icon: MessageSquare, color: 'var(--primary)', bg: 'var(--primary-glow)', title: 'Knowledge that lasts',
              desc: 'Notes, PYQs, interview experiences, and career guidance stored persistently — not lost when a batch graduates. Searchable by course, company, or role.' },
            { icon: Users, color: 'var(--success)', bg: 'var(--success-bg)', title: 'Peer mentorship, structured',
              desc: 'Seniors and alumni become discoverable for referrals, mock interviews, and resume reviews — replacing cold DMs with a structured matching layer.' },
            { icon: GraduationCap, color: 'var(--accent)', bg: 'var(--accent-bg)', title: 'Community-driven',
              desc: 'Built by students, for students. Clubs get an owned publishing channel, batch communities auto-assign, and the platform only works because of what the community puts into it.' },
            { icon: Shield, color: 'var(--danger)', bg: 'var(--danger-bg)', title: 'Safe to ask',
              desc: 'Anonymity is a first-class option — ask anything without fear of judgment. Server-side identity stripping means even we cannot accidentally expose who you are.' },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <Card key={title} style={{
              padding: 'var(--space-5)',
              borderTop: `3px solid ${color}`,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                width: 40, height: 40,
                borderRadius: 'var(--radius-md)',
                background: `${bg}88`,
                border: `1px solid ${color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 'var(--space-4)',
              }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-base)' }}>{title}</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>
                {desc}
              </p>
            </Card>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <Card style={{
          textAlign: 'center',
          padding: 'var(--space-6)',
          borderStyle: 'dashed',
        }}>
          <ArrowUpRight size={20} color="var(--primary)" style={{ marginBottom: 'var(--space-3)' }} />
          <p style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            fontSize: 'var(--text-sm)',
            margin: 0,
          }}>
            TakeUForward is a student-built, community-driven platform for SSN College of Engineering.
            This is a community-driven platform — don't be shy to start. Let's grow this together.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default About;
