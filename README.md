# GreadeIQ - AI-Assisted Student Retention & College Portal

GreadeIQ is a comprehensive, AI-assisted academic management platform designed to identify students at risk of dropping out, facilitate timely interventions, and run secure online assessments. By leveraging a rule-based Risk Engine for academic profiling and Generative AI (Gemini) for qualitative analysis, the system empowers educational institutions to improve student retention, support counseling workflows, and maintain exam integrity.

---

## 🚀 Key Features & Detailed UI Functionality

The platform is designed with role-based access control, providing tailored experiences for **Administrators**, **Counselors**, **Mentors**, and **Students**.

### 1. Administrator Dashboard (Command Center)
The Command Center provides a system-wide overview and administrative controls.
* **Global Filters & Actions**:
  * **Semester Filter**: Dropdown to filter all insights by specific semesters (1-8).
  * **Data Controls**: "Refresh Data" action button to fetch updated student logs.
  * **Export Options**: "Export to CSV" (for student lists) and "Export to PDF" (for admin reports).
* **Key Performance Indicators (KPIs)**:
  * **Total Students**: Count of all enrolled students.
  * **Departments**: Total number of academic departments.
  * **High Risk**: Count of students identified by the Risk Engine as high risk.
  * **Interventions**: Total number of active intervention tasks.
  * **Avg CGPA & Avg Attendance**: System-wide average academic metrics.
* **Visual Analytics**:
  * **Risk Profile Chart**: Interactive Pie Chart displaying the distribution of High, Medium, and Low-risk students.
  * **Risk Analysis by Department**: A detailed table listing departments, total students, risk breakdown (High/Medium), and the percentage of high-risk students per department.
* **User Management & Provisioning**:
  * **Create User Form**: Allows admins to provision new Mentors or Counselors with fields for Full Name, Email, Role, and Specialization (e.g., Academic Support, Mental Health, Financial Guidance).
  * **User Management Section**: View, edit, and manage system access for all staff members.

### 2. Counselor Dashboard
Designed for head counselors to oversee assigned student cohorts, log sessions, and manage assessment integrity.
* **Dual-Tab Interface**: Toggle between "Overview" and "My Students".
* **Overview Tab**:
  * **Group Stats**: KPI cards showing Total Assigned Students, High Risk count, Average Attendance, and Average CGPA for their assigned cohort.
  * **Quick Actions**: Shortcuts to "Schedule New Session" and "Find Student".
  * **Today's Sessions**: A list of upcoming scheduled sessions with student names, time, risk level, and actions to "Complete" or "Cancel" the session.
* **My Students Tab**:
  * **Search & Filter**: Search bar to quickly locate students by name or ID.
  * **Student Roster Table**: Displays Student Info, Risk Badge (High/Med/Low), Academic Performance metrics (Attendance %, CGPA), and a "View Profile" action button.

### 3. Mentor Dashboard (Mentorship Workspace)
Tailored for direct student interaction and group tracking.
* **Mentor Profile Header**: Displays the mentor's name and assigned specialization (e.g., General, Academic Support).
* **Group Progress KPIs**:
  * **My Group**: Total number of assigned mentees.
  * **Attention Needed**: Count of high-risk students requiring immediate intervention.
  * **Group Avg Attendance**: A visual progress bar depicting the average attendance of the assigned block.
* **Assigned Students Grid**: Visual cards representing each assigned student, allowing quick access to their individual profiles.

### 4. Detailed Student Profile View
An exhaustive 360-degree view of an individual student's academic and behavioral profile.
* **Profile Header**: Quick summary of the student, with actions to "Edit Student" (opens modal) or "Delete Student".
* **Risk Analysis Card**: Detailed breakdown of the student's Risk Engine-calculated dropout risk, risk score, and primary risk factors (e.g., low attendance, critical CGPA, or active backlogs).
* **Mentorship Card**: Displays the currently assigned Mentor/Counselor. Includes an "Auto-Assign Mentor" button powered by AI to match the student with the best-fit mentor based on their specific problems (via the Gemini AI API).
* **Academic Charts**: Interactive visual graphs depicting historical CGPA, attendance trends, and assessment scores.
* **AI Guidance Card**: Features a "Generate AI Plan" button. Uses Google's Gemini AI to analyze all student data points and output qualitative, actionable improvement plans and personalized advice.
* **Counseling Timeline**: A historical log of all past counseling sessions, notes, actions taken, and risk status before/after sessions.

### 5. Secure Assessment & Anti-Cheating System
* **Quiz Creator**: Allows counselors/admins to create topics, set duration, negative marking, difficulty, and quiz questions.
* **Anti-Cheat Dashboard**: Tracks exam integrity dynamically:
  * **Tab Switch Detection**: Auto-logs tab switches.
  * **Blur/Focus Tracking**: Logs user leaving the quiz viewport.
  * **Auto-Submit & Abort**: Triggers submission/aborts when violation thresholds are breached.
  * Detailed violation logs for review by counselors/admins.

### 6. Advanced Analytics, Reports, & Data Management
* **Advanced Analytics Page**: Deep-dive charts for institutional data analysis (accessible via the "Full Report" link on the Admin Dashboard).
* **Data Management (Bulk Upload)**: Admins can upload CSV files containing legacy student data for batch processing.
* **Reporting**: Generate and download customized PDF reports for institutional record-keeping.

---

## 💻 Tech Stack

### Frontend
* **Framework**: React + Vite (Type: Module)
* **Styling & UI**: Tailwind CSS, Vanilla CSS, Lucide React (Icons)
* **Routing**: React Router
* **Data Visualization**: Recharts
* **HTTP Client**: Axios

### Backend
* **Runtime**: Node.js (Type: Module)
* **Framework**: Express.js
* **Database ORM**: Prisma
* **Database**: PostgreSQL
* **Authentication**: JSON Web Tokens (JWT), bcryptjs
* **AI Integration**: `@google/generative-ai` (Gemini API)
* **File Handling & Reports**: Multer, CSV-Parser, Fast-CSV, PDFKit
* **Logging**: Winston

---

## 🗄️ Core Data Models (Prisma Schema)

* **User**: Staff credentials & system roles (`ADMIN`, `MENTOR`, `COUNSELOR`).
* **Student**: Core profiles with academic, socioeconomic, and behavioral metrics.
* **Attendance / Assessment / CourseAttempt / FeeRecord**: Academic and financial tracking.
* **Counselor / Mentor**: Staff profiles and assignments.
* **InterventionTask / CounselingLog**: Action tracking and qualitative records.
* **Quiz / QuizQuestion / QuizAttempt / ViolationLog**: Assessment engine and security logging.
* **Alert**: System-generated notifications based on risk assessments.

---

## 🛠️ Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.x or higher)
* [PostgreSQL](https://www.postgresql.org/) (v14.x or higher)
* Google Gemini API Key

### 1. Clone the repository
```bash
git clone https://github.com/ManvarSmit/GreadeIQ.git
cd GreadeIQ
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Set the environment variables in `.env`:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://username:password@localhost:5432/greadeiq?schema=public"
   JWT_SECRET="your_jwt_secret_key"
   GEMINI_API_KEY="your_gemini_api_key"
   ```
5. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
6. Seed the database with sample data:
   ```bash
   npm run seed
   ```
7. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 📄 License
ISC License
