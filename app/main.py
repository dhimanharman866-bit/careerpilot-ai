import os
from fastapi import FastAPI
from app.database.database import engine,Base
from app.models.user import User
from routers.user import router as user_router
from app.models.resume import Resume
from routers.resume import router as upload_resume
from app.models.resume_analysis import ResumeAnalysis
from routers.interview import router as interview_router
from app.models.Interview_session import InterviewSession
from app.models.interview_question import InterviewQuestion
from app.models.interview_answers import InterviewAnswer
from routers.placement import router as placement_router
from routers.voice import router as transcribe_router
from fastapi.middleware.cors import CORSMiddleware
from routers.dashboard import router as Dashboard_router
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Read allowed frontend URL(s) from environment variable (comma-separated if multiple)
raw_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [url.strip() for url in raw_frontend_url.split(",") if url.strip()]

# Always include localhost for local development
if "http://localhost:5173" not in allowed_origins:
    allowed_origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(upload_resume)
app.include_router(interview_router)
app.include_router(placement_router)
app.include_router(transcribe_router)
app.include_router(Dashboard_router)
@app.get("/")
def root():
    return {
        "message":"AI Interview Copilot backend running"
    }