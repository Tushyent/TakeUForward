import {
  Home, BookOpen, Users, Megaphone, Cloud, Info,
  GraduationCap, Briefcase, MessageSquare, FileText, Map,
  Star, Lightbulb, UserCheck, Package, ShoppingBag, Bookmark, HelpCircle, ShieldAlert
} from 'lucide-react';

export const NAV_PRIMARY = [
  { to: '/home',          icon: Home,         label: 'Home' },
  { to: '/about',         icon: Info,         label: 'About TUF' },
  { to: '/resources',     icon: BookOpen,     label: 'Resources' },
  { to: '/clubs',         icon: Users,        label: 'Clubs' },
  { to: '/announcements', icon: Megaphone,    label: 'Announcements' },
  { to: '/drive',         icon: Cloud,        label: 'My Drive' },
  { to: '/support',       icon: HelpCircle,   label: 'Support' },
];

export const NAV_CAREERS = [
  { to: '/alumni',               icon: GraduationCap, label: 'Alumni' },
  { to: '/referrals',            icon: Briefcase,     label: 'Referrals' },
  { to: '/mock-interviews',      icon: MessageSquare, label: 'Mock Interviews' },
  { to: '/interview-experiences',icon: FileText,      label: 'Experiences' },
  { to: '/career-roadmaps',      icon: Map,           label: 'Roadmaps' },
  { to: '/reviews',              icon: Star,          label: 'Reviews' },
  { to: '/electives',            icon: Lightbulb,     label: 'Electives' },
];

export const NAV_COMMUNITY = [
  { to: '/team-finder',   icon: UserCheck,    label: 'Team Finder' },
  { to: '/lost-found',    icon: Package,      label: 'Lost & Found' },
  { to: '/marketplace',   icon: ShoppingBag,  label: 'Marketplace' },
  { to: '/bookmarks',     icon: Bookmark,     label: 'Saved' },
  { to: '/chats',         icon: MessageSquare,label: 'Inbox' },
];

export const NAV_ADMIN = [
  { to: '/admin', icon: ShieldAlert, label: 'Admin' },
  { to: '/moderation', icon: ShieldAlert, label: 'Moderation' },
];

export const ALL_NAV_ITEMS = [...NAV_PRIMARY, ...NAV_CAREERS, ...NAV_COMMUNITY];

export const BOTTOM_NAV = [
  { to: '/home',          icon: Home,         label: 'Home' },
  { to: '/resources',   icon: BookOpen,  label: 'Resources' },
  { to: '/clubs',         icon: Users,        label: 'Clubs' },
  { to: '/chats',         icon: MessageSquare,label: 'Chat' },
];
