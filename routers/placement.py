from fastapi import (
    APIRouter,
    Depends,HTTPException
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.dependencies.auth import get_current_user

from app.models.user import User

from app.models.resume_analysis import (
    ResumeAnalysis
)

from app.models.Interview_session import (
    InterviewSession
)
from app.models.resume import Resume
from app.models.interview_question import (
    InterviewQuestion
)

from app.models.interview_answers import (
    InterviewAnswer
)
from app.ai.PlacementReadiness import generate_placement_report

router = APIRouter(
    prefix="/placement",
    tags=["Placement"]
)
@router.get("/readiness")
def placement_readiness(
    current_user:User=Depends(get_current_user),
    db:Session=Depends(get_db)
):
    analysis = (
    db.query(ResumeAnalysis)
    .join(Resume, ResumeAnalysis.resume_id == Resume.id)
    .filter(Resume.user_id == current_user.id)
    .order_by(ResumeAnalysis.created_at.desc())
    .first()
    )
    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="No resume analysis found"
        )
    skill_count=len(analysis.skills) if analysis.skills else 0
    project_count=len(analysis.projects) if analysis.projects else 0

    sessions=db.query(InterviewSession).filter(InterviewSession.user_id==current_user.id).all()
    scores=[]
    for session in sessions:
        questions=db.query(InterviewQuestion).filter(InterviewQuestion.session_id==session.id).all()
        for question in questions:
            answer=db.query(InterviewAnswer).filter(InterviewAnswer.question_id==question.id).first()
            if answer:
                scores.append(
                    answer.score
                )
    average_score=sum(scores)/len(scores) if scores else 0
    readiness_score = (
        average_score * 7
    ) + (
        skill_count * 2
    ) + (
        project_count * 3
    )

    readiness_score=min(readiness_score,100)
    if readiness_score>=80:
        status="Placement Ready"
    elif readiness_score>=60:
        status="almost ready"
    else:
        status="needs Improvement"

    ai_report = generate_placement_report(
        skills=analysis.skills,
        projects=analysis.projects,
        resume_strengths=analysis.strengths,
        resume_weaknesses=analysis.weaknesses,
        average_score=round(average_score, 2),
        readiness_score=round(readiness_score, 2),
        status=status
    )
    return {
        "readiness_score":round(readiness_score,2),
        "status":status,
        "average_interview_score":round(average_score,2),
        "skill_count":skill_count,
        "project_count":project_count,
        "ai_report":ai_report
    }
