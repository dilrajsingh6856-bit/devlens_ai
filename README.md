# DevLens AI – Intelligent GitHub Mentor

DevLens AI is a modern full-stack developer portfolio mentoring and static analysis dashboard. It fetches repositories, commit profiles, pull requests, languages, and contribution details from the GitHub API, and leverages the Google Gemini API to analyze the developer's skill set, generate personalized roadmaps, evaluate internship readiness, identify codebase smells, and suggest refactoring diffs.

---

## 🌟 Key Features

* **Dual Authorization Lookup**: Log in via **GitHub OAuth** to audit your private/public repositories and save evaluations, or run a **Public Username query** to immediately audit any developer on the platform.
* **Aggregated Portfolio Evaluation**: Computes visual KPI scores representing **Portfolio Quality** and **Internship Readiness**, complete with detailed justifications.
* **AI Coding Mentor**: Uses Gemini to define a developer's core strengths, weaknesses, technical missing skills, coding habits, and recommended frameworks.
* **Personalized Timeline Roadmaps**: Generates custom multi-month study paths with focus topics and concrete learning objectives.
* **Repository Health Scorecard**: Run deep inspections on individual repositories to view project summaries, list code smells (with severity ratings), review side-by-side refactoring proposals, check complexity, and copy auto-generated README markdown.
* **Open Source Contribution Matcher**: Suggests active open-source projects matching the user's technology preferences, offering directions to beginner-friendly "good first issues."

---

## 🏗️ Technical Stack

* **Frontend**: React, TypeScript, Tailwind CSS, Recharts, Lucide React
* **Backend**: FastAPI (Python 3.12), SQLAlchemy, Uvicorn, HTTPX
* **Database**: PostgreSQL (with automated zero-config fallback to a local SQLite instance)
* **AI Layer**: Google Gemini API (`gemini-2.5-flash`)

---

## 🚀 Setup & Installation

### Prerequisites
* **Node.js** (v18+)
* **Python 3.12**
* *PostgreSQL (Optional - falls back to SQLite `devlens.db` automatically)*

### 1. Backend Configuration
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Define your environment parameters in `.env` (copying from `.env.example`):
   ```ini
   # API Keys
   GEMINI_API_KEY=your_gemini_key_here
   
   # GitHub OAuth Keys
   GITHUB_CLIENT_ID=your_oauth_client_id
   GITHUB_CLIENT_SECRET=your_oauth_client_secret
   ```
   *Note: If `GEMINI_API_KEY` is not provided, the server automatically starts in a sandbox mode returning mocked results so you can fully preview the dashboard.*

5. Start the backend:
   ```bash
   python run.py
   ```
   The API will boot on `http://localhost:8000`.

### 2. Frontend Configuration
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   The web portal will open on `http://localhost:3000` (or the next available port).

---

## 💻 API Specification

### Auth & User Session
* `GET /api/v1/auth/github`: Returns redirect OAuth URL.
* `POST /api/v1/auth/callback`: Exchanges OAuth authorization code for session JWT.
* `GET /api/v1/auth/me`: Retrieves current session profile.

### AI Portfolio Evaluation
* `POST /api/v1/profile/analyze`: Analyzes target username profile, contribution activity, and repo lists. Returns strengths, weaknesses, roadmaps, and internship scores (caches in database).
* `POST /api/v1/repository/analyze`: Run static inspection on repository files, returning code smells, before/after code refactor blocks, and README documentations.
* `GET /api/v1/opensource/recommend`: Returns language-matched beginner-friendly open source repositories.
