import React from 'react';
import { useLocation } from 'react-router-dom';
import useSEO from '../hooks/useSEO';

// Static SEO metadata for TakeUForward SSN routes
const routeMetadata = {
  '/home': {
    title: 'Dashboard | TakeUForward SSN - One-Stop Campus Mate',
    description: 'Access your TUF SSN dashboard. Check centralized announcements, batch communities, saved bookmarks, mock interview requests, and placement assistance.',
    keywords: 'TakeUForward SSN, TUF SSN, Tushyent, One Stop Campus Mate, SSN Mentorship Platform, Campus Mate SSN, SSN Dashboard',
  },
  '/tech': {
    title: 'Technical Architecture & Engineering Reference | TakeUForward SSN',
    description: 'Deep-dive technical system architecture, software design patterns, engineering tradeoffs, security models, and interview preparation guide for TakeUForward SSN, architected by Tushyent.',
    keywords: 'Tushyent, Tushyent Portfolio, System Architecture, Full Stack Engineering, Software Design Patterns, TakeUForward Technical Specs, Node.js Express Architecture, React Vite Design System, Anonymity Engine',
  },
  '/community': {
    title: 'Communities - TakeUForward SSN',
    description: 'Browse all department and batch communities. Connect with classmates, share placement resources, and participate in anonymous academic Q&A.',
    keywords: 'SSN Communities, Batch Discussions, Department Forums, SSN Social',
  },
  '/resources': {
    title: 'Academic Resources - TakeUForward SSN',
    description: 'Download department notes, study guides, previous year question papers (PYQs), and utilize Gemini AI to instantly summarize academic PDFs.',
    keywords: 'SSN Resources, Academic Notes, PYQ Papers, PDF Summarizer, Gemini AI Study',
  },
  '/clubs': {
    title: 'SSN Student Clubs - TakeUForward SSN',
    description: 'Explore the 42 official SSN student clubs. Find technical societies, cultural clubs, ACM/IEEE chapters, and check active contact information.',
    keywords: 'SSN Clubs, Student Societies, ACM SSN, IEEE SSN, Lakshya SSN, Cultural Clubs',
  },
  '/announcements': {
    title: 'Campus Announcements - TakeUForward SSN',
    description: 'Stay updated with verified announcements, event notices, workshops, and official updates posted by SSN student clubs and admins.',
    keywords: 'SSN Announcements, Club Events, Campus Workshops, Official SSN Notices',
  },
  '/alumni': {
    title: 'Verified Alumni Directory - TakeUForward SSN',
    description: 'Vetted SSN alumni directory. Find graduates working across top tech companies, research institutions, and request industry referrals.',
    keywords: 'SSN Alumni, Alumni Directory, SSN Networking, Referral Networks',
  },
  '/referrals': {
    title: 'Referral Request Board - TakeUForward SSN',
    description: 'Request corporate job referrals directly from verified SSN alumni working at top companies. View requirements and submit your resume.',
    keywords: 'SSN Referral Board, Job Referrals, Alumni Referrals, Placement Assistance',
  },
  '/mock-interviews': {
    title: 'Mock Interview Prep - TakeUForward SSN',
    description: 'Prepare for placements with 1:1 mock interview sessions and resume reviews hosted by experienced SSN seniors and alumni.',
    keywords: 'Mock Interviews, Resume Reviews, Interview Prep, Placement Training SSN',
  },
  '/interview-experiences': {
    title: 'Interview Experiences - TakeUForward SSN',
    description: 'Read detailed interview reviews, coding rounds, online assessment patterns, and HR questions shared by SSN seniors who placed at top companies.',
    keywords: 'Interview Experiences, SSN Placement Reviews, OA Questions, Coding Rounds',
  },
  '/team-finder': {
    title: 'Teammate Finder - TakeUForward SSN',
    description: 'Form teams for hackathons, college projects, electives, or startup ideas. Find classmates with matching skills and interests.',
    keywords: 'Hackathon Teams, Project Partners, SSN Collaboration, Team Finder',
  },
  '/electives': {
    title: 'Electives & NPTEL Aggregator - TakeUForward SSN',
    description: 'Review and suggest SSN professional electives, open electives, and NPTEL courses. Read feedback from previous batches on grade distributions.',
    keywords: 'SSN Electives, NPTEL Reviews, Syllabus Guides, Grade Distribution',
  },
  '/career-roadmaps': {
    title: 'Structured Career Roadmaps - TakeUForward SSN',
    description: 'Explore structured, step-by-step career guides for software engineering (SDE), product management, core engineering, and higher studies.',
    keywords: 'SDE Roadmap, PM Guide, Core Engineering, Higher Studies SSN, Career Guides',
  },
  '/lost-found': {
    title: 'Lost & Found Board - TakeUForward SSN',
    description: 'Lost or found something on the SSN campus? Report lost items or submit found belongings (IDs, water bottles, umbrellas) to return them.',
    keywords: 'SSN Lost and Found, Campus Lost Items, Return Belongings SSN',
  },
  '/marketplace': {
    title: 'Secondhand Marketplace - TakeUForward SSN',
    description: 'Peer-to-peer campus marketplace. Buy or sell secondhand engineering textbooks, lab coats, calculators, and bicycle gear within SSN.',
    keywords: 'SSN Secondhand, Textbook Marketplace, Student Buy Sell, SSN Utility',
  },
  '/drive': {
    title: 'Personal Study Drive - TakeUForward SSN',
    description: 'Upload, manage, and store your personal study files, notes, and academic references in a secure cloud storage space.',
    keywords: 'Study Drive, Secure Uploads, Academic PDF Storage, SSN Personal Files',
  },
  '/reviews': {
    title: 'Course & Professor Reviews - TakeUForward SSN',
    description: 'Read student feedback, teaching methodologies, and course insights for SSN professors and core curriculum paths.',
    keywords: 'Professor Reviews, Course Ratings, SSN Academic Feedback',
  },
  '/bookmarks': {
    title: 'Bookmarks & Saved - TakeUForward SSN',
    description: 'Your saved bookmarks. Revisit pinned notes, resources, placement posts, roadmaps, and marketplace listings in one list.',
    keywords: 'Saved Bookmarks, Pinned Notes, Pinned Resources, Study Archive',
  },
  '/notifications': {
    title: 'Inbox Notifications - TakeUForward SSN',
    description: 'View your notifications history. Mentions in posts, replies to comments, support ticket resolutions, and chat message alerts.',
    keywords: 'Notifications, SSN Platform Alerts, User Mentions, Inbox History',
  },
  '/support': {
    title: 'Helpdesk & Support - TakeUForward SSN',
    description: 'Submit bug reports, feature requests, or questions to platform administrators. Track ticket status and receive in-app replies.',
    keywords: 'SSN Helpdesk, Support Tickets, Bug Reporting, TUF Feedback',
  },
  '/settings/profile': {
    title: 'Profile Settings - TakeUForward SSN',
    description: 'Update your profile information, change department or graduating batch settings, manage notification preferences, and account privacy.',
    keywords: 'Account Settings, Update Profile, Notification Toggles, Batch Settings',
  },
  '/complete-profile': {
    title: 'Complete Profile - TakeUForward SSN',
    description: 'Complete your registration. Verify your academic department and graduating batch year to access department forums and feeds.',
    keywords: 'Profile Verification, Batch Registration, SSN Department Sync',
  },
  '/pending-approval': {
    title: 'Pending Approval - TakeUForward SSN',
    description: 'Alumni registration pending system approval. Platform administrators verify proof links to confirm alumni credentials.',
    keywords: 'Verification Pending, Alumni Verification, Admin Approval Portal',
  },
  '/admin': {
    title: 'Admin Dashboard - TakeUForward SSN',
    description: 'Platform management overview. Review user signups, manage clubs/communities, and search or delete abusive content.',
    keywords: 'Admin Dashboard, Platform Management, SSN Admin Overview',
  },
  '/moderation': {
    title: 'Moderation Queue - TakeUForward SSN',
    description: 'System admin moderation queue. Approve verified alumni requests and review reported posts or comments for policy violations.',
    keywords: 'Moderation Queue, Reported Content, Alumni Verification Requests',
  },
  '/admin/support': {
    title: 'Support Queue - TakeUForward SSN',
    description: 'System admin support queue. Review user bug reports, feature requests, and respond directly with helpful updates.',
    keywords: 'Admin Support Tickets, Helpdesk Review, User Feedback Responses',
  },
  '/activity': {
    title: 'Platform Activity Audit Log - TakeUForward SSN',
    description: 'System audit logs. View structured trace logs of mutations, creations, deletions, and administrative actions on the platform.',
    keywords: 'Audit Log, Activity Logs, Platform Mutations History',
  },
  '/chats': {
    title: 'Direct Messages - TakeUForward SSN',
    description: '1:1 messaging console. Chat with seniors, peers, and verified alumni about referrals, mock interviews, and academic doubts.',
    keywords: 'SSN Direct Messages, Chat Console, 1:1 Student Chat',
  },
  '/login': {
    title: 'Login | TakeUForward SSN - One-Stop Campus Mate',
    description: 'Sign in to TakeUForward SSN, the premier one-stop campus mate and mentorship platform for SSN College of Engineering. Connect for placement prep, electives reviews, and alumni referrals.',
    keywords: 'TakeUForward SSN, TUF SSN, One Stop Campus Mate, SSN Mentorship Platform, Campus Mate SSN, SSN Login',
  },
  '/about': {
    title: 'About | TakeUForward SSN - One-Stop Campus Mate',
    description: 'TakeUForward SSN (TUF SSN) is the official one-stop campus mate for SSN students, providing placement preparation, study notes, student club portals, and verified alumni referral networking.',
    keywords: 'TakeUForward SSN, TUF SSN, One Stop Campus Mate, SSN Mentorship Platform, Campus Mate SSN, SSN Placements, SSN Alumni',
  }
};

const SEOManager = () => {
  const location = useLocation();

  // Match static routes
  let currentMeta = routeMetadata[location.pathname];

  // If there is no exact static match, check dynamic paths
  if (!currentMeta) {
    if (location.pathname.startsWith('/community/')) {
      currentMeta = {
        title: 'Community Feed - TakeUForward SSN',
        description: 'Read discussions, ask questions, and share information inside your department or batch community feed.',
        keywords: 'Community Feed, Class Discussion, Department Posts',
      };
    } else if (location.pathname.startsWith('/clubs/')) {
      currentMeta = {
        title: 'Club Profile - TakeUForward SSN',
        description: 'View active club information, upcoming workshop events, and official announcements posted by the club coordinators.',
        keywords: 'Club Profile, Student Club SSN, Club Announcements',
      };
    } else if (location.pathname.startsWith('/profile/')) {
      currentMeta = {
        title: 'Public Profile - TakeUForward SSN',
        description: 'View public academic profile, student achievements, and contributions shared on the TakeUForward SSN network.',
        keywords: 'Public Profile, Student Resume, Alumni Bio SSN',
      };
    } else if (location.pathname.startsWith('/chat/')) {
      currentMeta = {
        title: 'Private Conversation - TakeUForward SSN',
        description: '1:1 direct messaging window. Send and receive messages, prepare mock interviews, and request referrals.',
        keywords: 'Direct Message, Private Chat, Student Chat Room',
      };
    } else if (location.pathname.startsWith('/alumni-invite/')) {
      currentMeta = {
        title: 'Alumni Invite Verification - TakeUForward SSN',
        description: 'Verify your alumni invite token to complete registration and gain access to the alumni directory and referral board.',
        keywords: 'Alumni Token, Verify Invite, Registration Validation',
      };
    } else {
      // Fallback metadata for default/catch-all
      currentMeta = {
        title: 'TakeUForward SSN - One-Stop Campus Mate & Mentorship Platform',
        description: 'TakeUForward SSN (TUF SSN) is the premier one-stop campus mate and exclusive community portal for SSN College of Engineering.',
        keywords: 'TakeUForward SSN, TUF SSN, One Stop Campus Mate, SSN Mentorship Platform, Campus Mate SSN, SSN College of Engineering',
      };
    }
  }

  // Derive canonical link dynamically (no trailing slash)
  const canonicalUrl = `https://takeuforward.blastorz.fun${location.pathname.replace(/\/+$/, '')}`;

  // Structured Data (JSON-LD Breadcrumbs)
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbElements = [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': 'https://takeuforward.blastorz.fun/home',
    }
  ];

  let currentLink = 'https://takeuforward.blastorz.fun';
  pathSegments.forEach((segment) => {
    // Avoid appending segment if it matches dynamic ID to prevent indexing arbitrary URLs
    const isId = /^[0-9a-fA-F]{24}$/.test(segment);
    if (!isId) {
      currentLink += `/${segment}`;
      breadcrumbElements.push({
        '@type': 'ListItem',
        'position': breadcrumbElements.length + 1,
        'name': segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' '),
        'item': currentLink,
      });
    }
  });

  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl}#breadcrumb`,
    'itemListElement': breadcrumbElements,
  };

  // Call the useSEO hook with metadata
  useSEO({
    title: currentMeta.title,
    description: currentMeta.description,
    keywords: currentMeta.keywords,
    canonical: canonicalUrl,
    structuredData: breadcrumbStructuredData,
  });

  return null;
};

export default SEOManager;
export { SEOManager };
