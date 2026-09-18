# AI Interview Copilot

An advanced AI-powered career assistant that analyzes resumes, calculates job-placement readiness, and conducts adaptive mock interviews using voice, video, or text. The system leverages state-of-the-art LLMs (via Groq) to evaluate candidate responses, adjust question difficulty in real-time, and track career readiness.

---

## 🚀 Key Features

1. **Resume Analysis & ATS Scoring**:
   - Extracts text from uploaded PDF resumes using **PyMuPDF**.
   - Analyzes skills, projects, strengths, and weaknesses using **LangChain** and **Groq (`llama-3.3-70b-versatile`)**.
   - Generates an overall ATS score (0-100).

2. **Adaptive Mock Interviews**:
   - Tailors interview questions dynamically based on resume analysis and target roles.
   - **Adaptive Difficulty Routing**: Dynamically scales subsequent question difficulty (`Easy`, `Medium`, `Hard`) based on the evaluation scores of previous answers.
   - Supports three modes of input:
     - **Text-based** submissions.
     - **Voice-based** submissions (transcribed using **Groq Whisper-large-v3**).
     - **Video-based** submissions (extracts audio with **MoviePy** and transcribes with Whisper).

3. **Performance Evaluation**:
   - Assesses each answer's depth, correctness, and style.
   - Provides quantitative scores (1-10) and granular qualitative feedback (strengths and areas of improvement).
   - Generates a holistic interview session summary (average score, overall strengths, and career coach feedback).

4. **Placement Readiness Estimator**:
   - Calculates a combined placement readiness score (0-100) based on parsed skill count, project depth, and historical interview performance.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI
- **Database**: SQLite (SQLAlchemy ORM)
- **AI/LLM orchestration**: LangChain, Groq API (`llama-3.3-70b-versatile` & `whisper-large-v3`)
- **PDF Extraction**: PyMuPDF (`fitz`)
- **Multimedia Processing**: MoviePy (for video-to-audio extraction)
- **Security**: JWT Authentication (OAuth2, Passlib, Bcrypt)

### Frontend
- **Framework**: React (Vite setup)
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Styling**: Vanilla CSS

---

## 📂 Project Structure

```text
ai-interview-copilot/
├── app/
│   ├── ai/
│   │   ├── answer_evaluator.py      # Core logic for evaluating answers
│   │   ├── interview_summary.py     # Generates overall session summary
│   │   ├── question_generator.py    # LLM pipeline for question generation
│   │   ├── resume_analyzer.py       # LangChain + Groq PDF text analyzer
│   │   ├── skill_gap_analyzer.py    # Analyzes missing skills
│   │   ├── speech_to_text.py        # Whisper-large-v3 integration
│   │   └── video_processor.py       # Extracts audio from video clips using MoviePy
│   ├── database/
│   │   └── database.py              # SQLite connection & engine setup
│   ├── dependencies/
│   │   └── auth.py                  # JWT authentication middleware
│   ├── models/
│   │   ├── Interview_session.py     # DB model: Interview sessions
│   │   ├── interview_answers.py     # DB model: User's answers & scores
│   │   ├── interview_question.py    # DB model: Generated questions & difficulty
│   │   ├── resume.py                # DB model: Stored resumes (raw text)
│   │   ├── resume_analysis.py       # DB model: Extracted skills, projects, score
│   │   └── user.py                  # DB model: Users & hashed credentials
│   ├── schemas/                     # Pydantic schemas (User, Interview, etc.)
│   ├── utils/
│   │   ├── interview.py             # Difficulty threshold calculators
│   │   ├── jwt.py                   # Token encode/decode helpers
│   │   └── security.py              # Hashing & verification helpers
│   └── main.py                      # FastAPI application entrypoint
├── routers/
│   ├── interview.py                 # Endpoints: Mock interviews & adaptive flows
│   ├── placement.py                 # Endpoints: Placement readiness evaluation
│   ├── resume.py                    # Endpoints: PDF uploads & analysis
│   ├── user.py                      # Endpoints: Registration, login & profile
│   └── voice.py                     # Endpoints: Audio transcription service
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable UI cards, Navbar, Sidebar
│   │   ├── Layouts/                 # Main dashboard layouts
│   │   ├── pages/                   # Login, Register, Dashboard, Upload, Analysis pages
│   │   ├── services/                # Axios instance with baseURL config
│   │   ├── App.jsx                  # Route definitions
│   │   └── main.jsx                 # Vite application mountpoint
│   └── package.json
├── interview.db                     # SQLite Database file
├── requirements.txt                 # Backend python dependencies
└── README.md                        # Project documentation (this file)
```

---

## 🔌 API Endpoints Summary

### Authentication (`/`)
- `POST /register`: Registers a new user.
- `POST /login`: Log in to retrieve JWT access token.
- `GET /me`: Returns the currently authenticated user details.
- `GET /token-info`: Verifies JWT payload information.

### Resume Management (`/resume`)
- `POST /resume/upload`: Uploads a PDF resume, parses its text, and stores it.
- `POST /resume/analyze/{resume_id}`: Triggers LLM analysis to parse skills, projects, and score.
- `GET /resume/latest-analysis`: Retrieves the most recent analysis data for the authenticated user.

### Adaptive Mock Interviews (`/interview`)
- `POST /interview/generate-question/{analysis_id}`: Generates initial static or adaptive interview questions based on parsed skills.
- `POST /interview/answer`: Submits a text answer to a question and receives evaluations.
- `POST /interview/adaptive-answer`: Submits a text answer, evaluates it, and generates a new question at the adjusted difficulty in real-time.
- `POST /interview/adaptive-voice-answer`: Submits an audio file, transcribes it, evaluates it, and returns the next adaptive question.
- `POST /interview/adaptivr-video-answer`: Submits a video file, extracts audio, transcribes it, evaluates it, and returns the next adaptive question.
- `GET /interview/summary/{session_id}`: Generates an AI-compiled overview of the user's performance for the session.
- `GET /interview/history`: Retrieves list of previous interview sessions and average scores.

### Placement Readiness (`/placement`)
- `GET /placement/readiness`: Aggregates resume analysis and interview history to compute placement readiness status.

---

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js & npm
- A Groq API Key (Set up on [Groq Console](https://console.groq.com/))

### 1. Backend Setup
1. Navigate to the root directory.
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install required libraries:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   SECRET_KEY=your_jwt_secret_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will be running at `http://127.0.0.1:8000`.

### 2. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The frontend application will be running at `http://localhost:5173`.
