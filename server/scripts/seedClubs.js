import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Club from '../models/Club.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const clubs = [
  { name: 'SSN ACM', description: 'ACM Student Chapter at SSN — advancing computing as a science and profession through hackathons, workshops, and tech talks.' },
  { name: 'SSN ACMW', description: 'ACM-W SSN — supporting women in computing via mentorship, coding events, and networking opportunities.' },
  { name: 'SSN IEEE CS', description: 'IEEE Computer Society SSN — exploring software engineering, AI, and emerging computer science technologies.' },
  { name: 'SSN Coding Club', description: 'The official coding club of SSN. Organizes hackathons, competitive programming contests, and peer coding sessions.' },
  { name: 'SSN IEEE WIE', description: 'IEEE Women in Engineering SSN — empowering women in engineering and technology through workshops, talks, and outreach.' },
  { name: 'SSN IEEE PELS', description: 'IEEE Power Electronics Society SSN — focused on power electronics, renewable energy systems, and industrial drives.' },
  { name: 'SSN CSI Society', description: 'Computer Society of India SSN — promoting IT awareness, research, and professional development among students.' },
  { name: 'SSN IEEE Student Branch', description: 'IEEE Student Branch SSN — the umbrella IEEE chapter coordinating technical, professional, and social activities.' },
  { name: 'Procode IT SSN', description: 'Procode IT Club — sharpening coding and software development skills through projects, workshops, and hackathons.' },
  { name: 'GDG OnCampus SSN', description: 'Google Developer Groups OnCampus SSN — learning Google technologies, building projects, and connecting with the developer community.' },
  { name: 'SSN Design Club', description: 'Design Club SSN — exploring UI/UX, graphic design, and visual communication through hands-on projects.' },
  { name: 'SSN IEEE RAS', description: 'IEEE Robotics and Automation Society SSN — building robots, drones, and automation projects for competitions and research.' },
  { name: 'Tech Club SSN', description: 'Tech Club SSN — a general technology club exploring emerging tech trends, organizing tech fests and innovation challenges.' },
  { name: 'SSN SNUC Instincts', description: 'SNUC Instincts SSN — the official nature and wildlife club promoting environmental awareness and eco-initiatives.' },
  { name: 'SSN Lakshya', description: 'Lakshya SSN — the entrepreneurship cell fostering innovation, startups, and an entrepreneurial mindset on campus.' },
  { name: 'SSN Music Club', description: 'Music Club SSN — for musicians and vocalists to jam, perform, and produce music together.' },
  { name: 'SSN GeeksforGeeks Campus Body', description: 'GFG SSN Campus Chapter — learning DSA, system design, and interview preparation through peer-led sessions.' },
  { name: 'Build Club SSN', description: 'Build Club SSN — a project-first club where teams build real products over a semester.' },
  { name: 'SSN IEEE Photonics Society', description: 'IEEE Photonics Society SSN — exploring optics, lasers, fiber communications, and photonics research.' },
  { name: 'SSN SNUC Invente', description: 'SNUC Invente SSN — the innovation and invention club focused on prototyping and product development.' },
  { name: 'SSN IEEE SPS', description: 'IEEE Signal Processing Society SSN — diving into audio, image, video, and biomedical signal processing.' },
  { name: 'SSN IEEE PES', description: 'IEEE Power & Energy Society SSN — focused on power systems, smart grids, and sustainable energy solutions.' },
  { name: 'SSN Gaming Club', description: 'Gaming Club SSN — for gamers to compete, stream, and build games together.' },
  { name: 'SSN EMBS', description: 'IEEE Engineering in Medicine & Biology Society SSN — bridging engineering and healthcare through biomedical projects.' },
  { name: 'SSN Eco Club', description: 'Eco Club SSN — driving sustainability, waste management, and green initiatives on campus.' },
  { name: 'SSN Gear Club', description: 'Gear Club SSN — for automotive enthusiasts to build, repair, and race vehicles.' },
  { name: 'SSN Cybersecurity Club', description: 'Cybersecurity Club SSN — ethical hacking, CTF competitions, and security research.' },
  { name: 'SSN YRC', description: 'Youth Red Cross SSN — volunteering for blood donation drives, first-aid training, and community service.' },
  { name: 'SSN NSS', description: 'National Service Scheme SSN — community service and social outreach programs.' },
  { name: 'Sportium Sports Club SSN', description: 'Sportium SSN — the multi-sport club organizing inter- and intra-college tournaments.' },
  { name: 'N2K SSN', description: 'N2K SSN — the official dance club. Hip-hop, contemporary, and fusion crews.' },
  { name: 'SSN Films Club', description: 'Films Club SSN — making short films, documentaries, and exploring cinematic storytelling.' },
  { name: 'SSN Lights Out Please', description: 'Lights Out Please SSN — the dramatics and theatre club staging plays and skits.' },
  { name: 'SSN Math Club', description: 'Math Club SSN — exploring mathematical modeling, puzzles, and competitive math.' },
  { name: 'Q Factorial Quiz Club SSN', description: 'Q Factorial SSN — the quizzing club organizing regular quizzes and representing SSN at national quizzing events.' },
  { name: 'SSN SNUC Sports Club', description: 'SNUC Sports Club SSN — promoting fitness and sports culture across campus.' },
  { name: 'SSN ELC English Literacy Club', description: 'English Literacy Club SSN — improving communication, public speaking, and creative writing skills.' },
  { name: 'SSN IEEE VTS', description: 'IEEE Vehicular Technology Society SSN — exploring connected vehicles, autonomous driving, and intelligent transport systems.' },
  { name: 'SSN SAE', description: 'SAE Collegiate Club SSN — designing and building formula-style race cars and BAJA off-road vehicles.' },
  { name: 'SSN IEEE ComSoc', description: 'IEEE Communications Society SSN — studying wireless communication, 5G/6G, and networking protocols.' },
  { name: 'SSN SNUC MUN', description: 'SNUC MUN SSN — Model United Nations club debating global affairs and diplomacy.' },
  { name: 'SSN Photography Club', description: 'Photography Club SSN — capturing campus life through the lens, with workshops and photo walks.' },
];

const seedClubs = async () => {
  try {
    const dbName = process.env.MONGODB_DB_NAME || (process.env.NODE_ENV === 'production' ? 'takeuforward' : 'takeuforward_dev');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev', { dbName });
    logger.info('Connected to MongoDB for seeding clubs...');

    let created = 0;
    for (const club of clubs) {
      const exists = await Club.findOne({ name: club.name });
      if (!exists) {
        await Club.create(club);
        logger.info(`Created club: ${club.name}`);
        created++;
      } else {
        logger.info(`Club ${club.name} already exists. Skipping.`);
      }
    }

    logger.info(`Seeding complete! Created ${created} new clubs.`);
    process.exit(0);
  } catch (err) {
    logger.error('Error seeding clubs:', err);
    process.exit(1);
  }
};

seedClubs();
