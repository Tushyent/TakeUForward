import { buildNotificationEmail } from '../config/mailer.js';

describe('notification email rendering', () => {
  const originalClientUrl = process.env.CLIENT_URL;

  beforeEach(() => {
    // process.env.CLIENT_URL = 'https://takeuforward.vercel.app/';
    process.env.CLIENT_URL = 'https://takeuforward.blastorz.fun/';
  });

  afterAll(() => {
    if (originalClientUrl === undefined) {
      delete process.env.CLIENT_URL;
    } else {
      process.env.CLIENT_URL = originalClientUrl;
    }
  });

  it('links mentions to the exact target path and escapes user content in HTML', () => {
    const email = buildNotificationEmail(
      { name: 'Recipient', email: 'recipient@ssn.edu.in' },
      'mention',
      false,
      '<script>alert("xss")</script> @recipient',
      {
        targetPath: '/community/abc123?post=post123&comment=comment123',
        actorName: '@sender',
        contextTitle: 'General',
        contextType: 'comment'
      }
    );

    expect(email.subject).toBe('You were mentioned on TakeUForward');
    // expect(email.html).toContain('href="https://takeuforward.vercel.app/community/abc123?post=post123&comment=comment123"');
    expect(email.html).toContain('href="https://takeuforward.blastorz.fun/community/abc123?post=post123&comment=comment123"');
    expect(email.html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; @recipient');
    expect(email.html).not.toContain('<script>');
  });

  it('links message notifications directly to the sender chat thread', () => {
    const email = buildNotificationEmail(
      { name: 'Recipient', email: 'recipient@ssn.edu.in' },
      'message',
      false,
      'Can we discuss the referral?',
      {
        targetPath: '/chat/user123',
        actorName: '@mentor',
        contextTitle: '1:1 chat',
        contextType: 'chat message'
      }
    );

    expect(email.subject).toBe('New message on TakeUForward');
    expect(email.html).toContain('Open the chat');
  });
});
