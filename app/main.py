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

Base.metadata.create_all(bind=engine)


app=FastAPI()
app.include_router(user_router)
app.include_router(upload_resume)
app.include_router(interview_router)
app.include_router(placement_router)
app.include_router(transcribe_router)
@app.get("/")
def root():
    return {
        "message":"AI Interview Copilot backend running"
    }