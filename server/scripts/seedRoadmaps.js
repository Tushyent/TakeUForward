import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import CareerRoadmap from '../models/CareerRoadmap.js';
import { logger } from '../utils/logger.js';
import { SYSTEM_ADMIN_EMAIL } from '../utils/userIdentity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const roadmaps = [
  {
    careerPath: 'sde',
    title: 'Software Development Engineer (SDE) — Roadmap',
    steps: [
      { stepTitle: 'Pick a language, master the fundamentals', description: 'Choose one language (C++, Java, or Python) and learn variables, loops, functions, OOP, and memory management. Focus on depth over breadth.', order: 1 },
      { stepTitle: 'Data Structures & Algorithms', description: 'Study arrays, linked lists, stacks, queues, trees, graphs, hash maps, recursion, DP, and sorting. Practice daily on LeetCode (start with Easy, move to Medium).', order: 2 },
      { stepTitle: 'CS Fundamentals', description: 'Cover operating systems (process scheduling, memory mgmt), DBMS (SQL, normalization, indexes), computer networks (TCP/IP, HTTP, DNS), and OOP design patterns.', order: 3 },
      { stepTitle: 'Build projects', description: 'Build 2-3 full-stack projects. A REST API with auth, a real-time feature (e.g., chat), and a frontend consuming it. Deploy at least one. Use GitHub for version control.', order: 4 },
      { stepTitle: 'Interview preparation', description: 'Solve company-tagged LeetCode problems. Practice system design (HLD + LLD) for senior roles. Give mock interviews with seniors through the TakeUForward platform. The typical SDE interview structure: (1) Online Assessment (OA) — 2-3 coding problems on DSA, sometimes with MCQs on CS fundamentals, (2) Technical phone/video screen — 1-2 coding problems testing problem-solving and communication, (3) On-site (or virtual) loop — 3-4 rounds covering DSA, system design (at a level appropriate for freshers), and sometimes a project-deep-dive or debugging round, (4) HR/culture-fit round — discussing your resume, experience, and motivations.', order: 5 },
      { stepTitle: 'Resume & applications', description: 'Keep resume to 1 page. Quantify impact. Apply via CDC, LinkedIn, and TakeUForward referrals. Target 50+ applications before graduation.', order: 6 },
    ],
  },
  {
    careerPath: 'pm',
    title: 'Product Management (PM) — Roadmap',
    steps: [
      { stepTitle: 'Understand the PM role', description: 'Read "Inspired" by Marty Cagan and "Cracking the PM Interview". Understand the difference between a PM, program manager, and product owner.', order: 1 },
      { stepTitle: 'Build product sense', description: 'Practice writing PRDs, conducting competitive analysis, and defining success metrics. Analyze 2-3 products you use daily — why do they work?', order: 2 },
      { stepTitle: 'Learn data & analytics', description: 'Get comfortable with SQL and basic stats. Learn to define and track KPIs, run A/B tests, and use tools like Google Analytics, Mixpanel, or Amplitude.', order: 3 },
      { stepTitle: 'Develop UX & technical literacy', description: 'Understand wireframing (Figma), user research methods, and API basics. You do not need to code, but knowing technical trade-offs earns engineering trust.', order: 4 },
      { stepTitle: 'Get hands-on experience', description: 'Join a college club as a PM/lead. Organize a product sprint. Find a PM internship. Write case studies on TakeUForward as thought samples.', order: 5 },
      { stepTitle: 'Interview preparation', description: 'Prepare for product sense, execution, and behavioral rounds. Practice estimation and metric-tree questions. Build a portfolio of case studies. The typical PM interview structure: (1) Product sense round — design or improve a product, evaluate a feature trade-off, (2) Execution/analytics round — define success metrics for a given scenario, design an experiment or A/B test, interpret data, (3) Behavioral/leadership round — discuss past experiences using frameworks like STAR, (4) Case/presentation round (less common for entry-level) — present a product strategy or competitive analysis. Most PM interviews for freshers/college hires focus on product sense and behavioral rounds.', order: 6 },
    ],
  },
  {
    careerPath: 'core',
    title: 'Core Engineering — Roadmap',
    steps: [
      { stepTitle: 'Strengthen engineering fundamentals', description: 'Master core subjects relevant to your branch — thermodynamics, fluid mechanics, circuits, solid mechanics, signals, or materials science. Solve numerical problems until they feel intuitive.', order: 1 },
      { stepTitle: 'Get hands-on with labs and simulation', description: 'Excel in your lab courses. Learn industry-standard tools — MATLAB, Simulink, AutoCAD, SolidWorks, PSpice, or ANSYS depending on your domain. These tools are your coding interview.', order: 2 },
      { stepTitle: 'Work on real projects', description: 'Join a college team or club (SAE, IEEE RAS, Solar Car, BAJA). Design and build something physical. Project experience trumps GPA in core placements.', order: 3 },
      { stepTitle: 'Explore research', description: 'Write a review paper, assist a professor with research, or complete a summer internship at a lab or PSU. Publications at national conferences boost your profile significantly.', order: 4 },
      { stepTitle: 'Target core companies', description: 'Identify PSUs (through GATE), core R&D roles (GE, Siemens, Bosch, L&T, Honeywell), and technical consulting firms. Understand their selection process: (1) Online test — technical MCQs and numerical problems on core engineering subjects plus basic aptitude, (2) Technical interview — deep dive into your branch-specific fundamentals, lab experience, and project work, (3) HR round — fit, location preference, and general background. Core interviews value conceptual clarity and hands-on lab/project experience over memorized answers.', order: 5 },
      { stepTitle: 'GATE or higher studies prep', description: 'If aiming for PSUs or MTech, prepare for GATE alongside your degree. Core placements benefit heavily from a strong GATE score.', order: 6 },
    ],
  },
  {
    careerPath: 'higher_studies',
    title: 'Higher Studies (MS/PhD Abroad) — Roadmap',
    steps: [
      { stepTitle: 'Define your goals', description: 'Decide MS (thesis/non-thesis) vs PhD vs MEng vs direct PhD. Research universities by program strength, not just rank. Consider funding availability (RA/TA).', order: 1 },
      { stepTitle: 'Build a strong academic profile', description: 'Maintain a GPA of 8.5+ (top universities expect 9+). Build relationships with 3 professors for LoRs. Publish research if applying for PhD/thesis MS.', order: 2 },
      { stepTitle: 'Prepare for standardized tests', description: 'GRE: target 325+ (168+ quant). TOEFL (105+) or IELTS (7.5+). Finish tests by September of your final year.', order: 3 },
      { stepTitle: 'Research experience matters', description: 'Work on research projects under a professor. Present at conferences (national/international). Intern at a research lab (IITs, IISc, or industry R&D). A strong SOP backed by real research is critical.', order: 4 },
      { stepTitle: 'Craft your applications', description: 'Write a targeted SOP for each university — generic SOPs get rejected. Apply to 10-12 universities (2 ambitious, 6 moderate, 4 safe). Reach out to potential advisors via email.', order: 5 },
      { stepTitle: 'Funding and visa', description: 'Apply for external scholarships (Fulbright, Inlaks, AAUW). Secure visa documentation. Plan for funding beyond tuition — living costs vary widely by city.', order: 6 },
    ],
  },
];

const seedRoadmaps = async () => {
  try {
    const dbName = process.env.MONGODB_DB_NAME || (process.env.NODE_ENV === 'production' ? 'takeuforward' : 'takeuforward_dev');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev', { dbName });
    logger.info('Connected to MongoDB for seeding career roadmaps...');

    const admin = await User.findOne({ email: SYSTEM_ADMIN_EMAIL });
    if (!admin) {
      logger.error(`System admin (${SYSTEM_ADMIN_EMAIL}) not found in DB. Run ensureSystemAdmin first.`);
      process.exit(1);
    }

    let created = 0;
    for (const rm of roadmaps) {
      const exists = await CareerRoadmap.findOne({ careerPath: rm.careerPath, authorId: admin._id });
      if (!exists) {
        await CareerRoadmap.create({ ...rm, authorId: admin._id });
        logger.info(`Created roadmap: ${rm.careerPath}`);
        created++;
      } else {
        logger.info(`Roadmap ${rm.careerPath} already exists. Skipping.`);
      }
    }

    logger.info(`Seeding complete! Created ${created} new roadmaps.`);
    process.exit(0);
  } catch (err) {
    logger.error('Error seeding roadmaps:', err);
    process.exit(1);
  }
};

seedRoadmaps();
