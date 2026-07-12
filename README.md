<div align="center">
  <img src="https://takeuforward-ssn.vercel.app/favicon.svg" alt="TakeUForward Logo" width="120" />
  <h1>TakeUForward</h1>
  <p><strong>The Ultimate SSN Campus Mentorship, Utility, & Networking Platform</strong></p>

  [![Vercel Deployment](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://takeuforward-ssn.vercel.app)
  [![Render Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://takeuforward-ssn.onrender.com)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](#)
</div>

---

TakeUForward is a highly secure, full-stack campus platform exclusively designed for SSN students and alumni. It bridges the gap between academics, placements, and campus utilities—combining an **Anonymity Engine** for safe discussions, an **Alumni Mentorship Board**, and **Real-Time Campus Utilities** (like Lost & Found and Marketplaces).

## ✨ Key Features

### 🔒 Privacy & Security First
- **SSN Domain Restriction**: Only `@ssn.edu.in` accounts can access the platform via Google OAuth.
- **Verified Alumni Gating**: External alumni accounts must be manually vetted and approved by System Admins before gaining platform access.
- **Server-Side Anonymity**: Unlike basic platforms that hide names on the frontend, our Anonymity Engine strictly strips user identities at the database level before data ever reaches the client.

### 📚 Academic Hub
- **Resource Repository**: Share notes, PYQs, and textbooks (AWS S3 integration).
- **Course & Professor Reviews**: Read and write anonymous feedback to make informed elective choices.
- **Department & Batch Feeds**: Find discussions specific to your year and branch instantly.

### 💼 Professional Networking
- **Alumni Directory**: Browse verified alumni, their current companies, and roles.
- **Referrals & Mock Interviews**: Directly request 1:1 mentorship, mock interviews, or job referrals from seniors.
- **Interview Experiences**: A dedicated repository of placement experiences.

### 🏫 Campus Utilities
- **Marketplace**: Buy, sell, or exchange items with peers.
- **Lost & Found**: Report missing items and find them securely.
- **Teammate Finder**: Discover partners for hackathons and academic projects.
- **Club Announcements**: Follow official SSN clubs for the latest events and updates.

---

## 🛠 Tech Stack & Architecture

- **Frontend**: React.js, Vite, React Router, Custom CSS Design System (Glassmorphism & Dark-Mode first).
- **Backend**: Node.js, Express.js (ES Modules).
- **Database**: MongoDB Atlas, Mongoose (with `connect-mongo` for persistent sessions).
- **Cloud & AI**: 
  - AWS S3 (Presigned URLs for direct uploads)
  - Twilio SendGrid (Email Notifications)
  - Google Gemini AI (PDF Summarizations)
- **Deployment**: Vercel (Frontend SPA) + Render (Node.js Backend).

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas URL)
- Google Cloud Console (OAuth Client ID)

### 1. Installation
Clone the repository and install dependencies for both the frontend and backend:
```bash
git clone https://github.com/your-username/TakeUForward.git
cd TakeUForward
npm install  # Concurrently installs client and server dependencies
```

### 2. Environment Variables
You must configure the `.env` files. **Never commit these files to version control.**

**Backend (`server/.env`)**
Copy the template:
```bash
cp server/.env.example server/.env
```
Fill in the required values: `MONGODB_URI`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `AWS_ACCESS_KEY_ID`.

**Frontend (`client/.env`)**
Copy the template:
```bash
cp client/.env.example client/.env
```
Set `VITE_VAPID_PUBLIC_KEY` if you wish to test push notifications.

### 3. Database Seeding (First Run Only)
Populate the database with the initial communities and clubs:
```bash
cd server
npm run seed:communities
npm run seed:clubs
```

### 4. Run the Development Servers
Start both the React frontend and Express backend concurrently:
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:5000`

---

## 🧪 Testing

We ensure platform stability through rigorous automated testing:
- **Unit & Integration Tests**: Run `npm test` inside the `/server` directory (powered by Jest).
- **Linting**: Run `npm run lint` at the root to check both client and server code.
- **E2E Testing**: Run `npx playwright test` to execute Critical Path E2E tests.

---

<div align="center">
  <sub>Built with ❤️ for the SSN Community by Tushyent N P</sub>
</div>
