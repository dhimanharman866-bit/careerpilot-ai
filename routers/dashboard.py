from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import get_current_user

from app.models.user import User
from app.models.resume import Resume
from app.models.resume_analysis import ResumeAnalysis
from app.models.Interview_session import InterviewSession
from app.models.interview_question import InterviewQuestion
from app.models.interview_answers import InterviewAnswer

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ── Resume data ───────────────────────────────────────────────────────
    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.id.desc())
        .first()
    )

    latest_analysis = None
    if latest_resume:
        latest_analysis = (
            db.query(ResumeAnalysis)
            .filter(ResumeAnalysis.resume_id == latest_resume.id)
            .first()
        )

    # ── Interview score: average of all answered questions for this user ──
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .all()
    )

    all_scores = []
    for session in sessions:
        questions = (
            db.query(InterviewQuestion)
            .filter(InterviewQuestion.session_id == session.id)
            .all()
        )
        for question in questions:
            answer = (
                db.query(InterviewAnswer)
                .filter(InterviewAnswer.question_id == question.id)
                .first()
            )
            if answer and answer.score is not None:
                all_scores.append(answer.score)

    has_interview = len(all_scores) > 0
    average_interview_score = (
        round(sum(all_scores) / len(all_scores), 1)
        if all_scores else None
    )

    # ── Placement readiness: same formula as /placement/readiness ─────────
    placement_readiness = None
    if latest_analysis and has_interview:
        skill_count   = len(latest_analysis.skills)   if latest_analysis.skills   else 0
        project_count = len(latest_analysis.projects) if latest_analysis.projects else 0
        avg = sum(all_scores) / len(all_scores)
        raw = (avg * 7) + (skill_count * 2) + (project_count * 3)
        placement_readiness = round(min(raw, 100), 1)

    # ── Build resume_score safely (JSON column may return int or dict) ────
    resume_score = None
    if latest_analysis and latest_analysis.score is not None:
        raw_score = latest_analysis.score
        # If LLM returned a dict like {"score": 92}, extract the int
        if isinstance(raw_score, dict):
            raw_score = raw_score.get("score") or raw_score.get("resume_score")
        try:
            resume_score = int(raw_score)
        except (TypeError, ValueError):
            resume_score = None

    return {
        "username": current_user.username,

        "resume_score": resume_score,

        "interview_score": average_interview_score,

        "placement_readiness": placement_readiness,

        "has_resume": latest_resume is not None,

        "has_interview": has_interview,
    }