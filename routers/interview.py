from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
import shutil
import tempfile
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.resume_analysis import ResumeAnalysis
from app.models.Interview_session import InterviewSession
from app.models.interview_question import InterviewQuestion
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.ai.video_processor import extract_audio
from app.schemas.question_generator import QuesyionGenerationRequest
from app.schemas.interview_answer import AnswerSubmissionRequest
from app.ai.question_generator import generate_questions
from app.models.interview_answers import InterviewAnswer
from app.ai.answer_evaluator import evaluate_answer
from app.ai.interview_summary import generate_interview_summary
from app.utils.interview import determine_difficulty

from fastapi import UploadFile, File
import shutil
import os

from app.ai.speech_to_text import transcribe_audio
from app.utils.interview import determine_difficulty

router = APIRouter(
    prefix="/interview",
    tags=['Interview']
)

@router.post("/generate-question/{analysis_id}")
def generate_interview_questions(analysis_id:int,request:QuesyionGenerationRequest,current_user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    from app.models.resume import Resume

    # SECURITY: verify the analysis belongs to a resume owned by current_user
    analysis = (
        db.query(ResumeAnalysis)
        .join(Resume, ResumeAnalysis.resume_id == Resume.id)
        .filter(
            ResumeAnalysis.id == analysis_id,
            Resume.user_id == current_user.id
        )
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="analysis Not Found"
        )
    session=InterviewSession(
        user_id=current_user.id,
        analysis_id=analysis.id,
        target_role=request.target_role
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    difficulty="medium" if request.adaptive else None
    questions=generate_questions(
        skills=analysis.skills,
        projects=analysis.projects,
        target_role=request.target_role,
        difficulty=difficulty
    )
    if request.adaptive:
        first_question=questions["questions"][0]
        question=InterviewQuestion(
            session_id=session.id,
            question=first_question["question"],
            difficulty="medium"
        )
        db.add(question)
    else:
        for q in questions["questions"]:
            question = InterviewQuestion(
              session_id=session.id,
              question=q["question"],
              difficulty=q["difficulty"] 
            )
            db.add(question)
    
    if request.adaptive:
        db.commit()
        db.refresh(question)

        return{
            "session_id":session.id,
            "question_id":question.id,
            "question":question.question,
            "difficulty":question.difficulty
        }
    db.commit()

    return {
        "session_id":session.id,
        "questions":questions
    }
@router.post("/answer")
def submit_answer(
    request: AnswerSubmissionRequest,
    current_user: User = Depends(get_current_user),  # SECURITY: require auth
    db: Session = Depends(get_db)
):
    question = (db.query(InterviewQuestion).filter(InterviewQuestion.id == request.question_id).first())

    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    # SECURITY: verify the question belongs to a session owned by current_user
    session = db.query(InterviewSession).filter(
        InterviewSession.id == question.session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if session is None:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to answer this question."
        )

    evaluation = evaluate_answer(question=question.question, answer=request.answer)

    answer = InterviewAnswer(
        question_id=question.id,
        answer=request.answer,
        score=evaluation["score"],
        feedback=evaluation["feedback"]
    )

    db.add(answer)
    db.commit()
    db.refresh(answer)

    return {
    "answer_id": answer.id,
    "score": evaluation["score"],
    "feedback": evaluation["feedback"],
    "strengths": evaluation["strengths"],
    "improvements": evaluation["improvements"]
    }

@router.get("/report/{session_id}")
def get_interview_report(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found"
        )

    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    questions = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.session_id == session.id)
        .all()
    )

    question_ids = [question.id for question in questions]

    answers = (
        db.query(InterviewAnswer)
        .filter(InterviewAnswer.question_id.in_(question_ids))
        .all()
    )

    answer_map = {
        answer.question_id: answer
        for answer in answers
    }

    question_feedback = []
    scores = []

    # Merge each question with its evaluated answer
    for question in questions:
        answer = answer_map.get(question.id)

        if answer is None:
            continue

        question_feedback.append({
            "question": question.question,
            "difficulty": question.difficulty,
            "user_answer": answer.answer,
            "score": answer.score,
            "feedback": answer.feedback
            })

        scores.append(answer.score)

    overall_score = (
        sum(scores) / len(scores)
        if scores else 0
    )

    overall_feedback = generate_interview_summary(
        qa_data=question_feedback,
        average_score=overall_score
    )

    return {
        "session_id": session.id,
        "target_role": session.target_role,
        "overall_score": overall_score,
        "overall_feedback": overall_feedback,
        "question_feedback": question_feedback
    }

@router.get("/history")
def get_interview_history(current_user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    sessions=db.query(InterviewSession).filter(InterviewSession.user_id==current_user.id).order_by(InterviewSession.created_at.desc()).all()
    history=[]
    for session in sessions:
        questions=db.query(InterviewQuestion).filter(InterviewQuestion.session_id==session.id).all()

        score=[]
        for question in questions:
            answer=db.query(InterviewAnswer).filter(InterviewAnswer.question_id==question.id).first()

            if answer:
                score.append(answer.score)
        average_score = (
            sum(score) / len(score)
            if score
            else 0
        )
        history.append(
            {
                "session_id": session.id,
                "target_role": session.target_role,
                "created_at": session.created_at,
                "average_score": round(average_score,1)
            }
        )
    return{
        "history":history
        }
# @router.get("/history")
# def get_interview_history(current_user:User=Depends(get_current_user),db:Session=Depends(get_db)):
#     sessions=db.query(InterviewSession).filter(InterviewSession.user_id==current_user.id).order_by(InterviewSession.created_at.desc()).all()
#     history=[]
#     for session in sessions:
#         questions=db.query(InterviewQuestion).filter(InterviewQuestion.session_id==session.id).all()

#         score=[]
#         for question in questions:
#             answer=db.query(InterviewAnswer).filter(InterviewAnswer.question_id==question.id).first()

#             if answer:
#                 score.append(answer.score)
#         average_score = (
#             sum(score) / len(score)
#             if score
#             else 0
#         )
#         history.append(
#             {
#                 "session_id": session.id,
#                 "target_role": session.target_role,
#                 "created_at": session.created_at,
#                 "average_score": average_score
#             }
#         )
#     return {
#         "history": history
#     }

@router.post("/adaptive-answer")
def adaptive_answer(
    request:AnswerSubmissionRequest,
    current_user:User=Depends(get_current_user),
    db:Session=Depends(get_db)
):
    question = (
    db.query(InterviewQuestion)
    .filter(
        InterviewQuestion.id == request.question_id
    )
    .first()
)

    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )
    evaluation = evaluate_answer(
        question=question,
        answer=request.answer
    )
    answer=InterviewAnswer(
        question_id=question.id,
        answer=request.answer,
        score=evaluation["score"],
        feedback=evaluation["feedback"]
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)

    difficulty=determine_difficulty(
        evaluation["score"]
    )
    session=db.query(InterviewSession).filter(InterviewSession.id==question.session_id).first()
    analysis=db.query(ResumeAnalysis).filter(ResumeAnalysis.id==session.analysis_id).first()
    generated = generate_questions(
        skills=analysis.skills,
        projects=analysis.projects,
        target_role=session.target_role,
        difficulty=difficulty
    )
    next_question_data = generated["questions"][0]
    next_question = InterviewQuestion(
        session_id=session.id,
        question=next_question_data["question"],
        difficulty=difficulty
    )
    db.add(next_question)
    db.commit()
    db.refresh(next_question)
    return {
        "answer_id": answer.id,
        "score": evaluation["score"],
        "feedback": evaluation["feedback"],
        "strengths": evaluation["strengths"],
        "improvements": evaluation["improvements"],

        "next_question_id": next_question.id,
        "next_question": next_question.question,
        "difficulty": difficulty
    }

@router.post("/adaptive-voice-answer")
def adaptive_voice_answer(
    question_id: int,
    audio_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    question = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.id == question_id
        )
        .first()
    )

    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp:
        shutil.copyfileobj(audio_file.file, temp)
        temp_file = temp.name

    try:
       transcript = transcribe_audio(temp_file)
    finally:
       os.remove(temp_file)

    evaluation = evaluate_answer(
        question=question.question,
        answer=transcript
    )

    answer = InterviewAnswer(
        question_id=question.id,
        answer=transcript,
        score=evaluation["score"],
        feedback=evaluation["feedback"]
    )

    db.add(answer)
    db.commit()
    db.refresh(answer)

    difficulty = determine_difficulty(
        evaluation["score"]
    )

    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == question.session_id
        )
        .first()
    )

    analysis = (
        db.query(ResumeAnalysis)
        .filter(
            ResumeAnalysis.id == session.analysis_id
        )
        .first()
    )

    generated = generate_questions(
        skills=analysis.skills,
        projects=analysis.projects,
        target_role=session.target_role,
        difficulty=difficulty
    )

    next_question_data = generated["questions"][0]

    next_question = InterviewQuestion(
        session_id=session.id,
        question=next_question_data["question"],
        difficulty=difficulty
    )

    db.add(next_question)
    db.commit()
    db.refresh(next_question)

    return {
        "current_question": question.question,

        "transcript": transcript,

        "score": evaluation["score"],
        "feedback": evaluation["feedback"],
        "strengths": evaluation    ["strengths"],
        "improvements": evaluation    ["improvements"],

        "next_question": next_question.    question,
        "next_question_id": next_question.    id,

        "difficulty": difficulty
    }

@router.post("/adaptive-video-answer")
def adaptive_video_answer(
    question_id: int,
    video_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ── 1. Fetch question and verify ownership before touching any files ──
    question = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.id == question_id)
        .first()
    )
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.id == question.session_id)
        .first()
    )
    if session is None or session.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to answer this question"
        )

    # ── 2. Write uploaded video to a safe temp file ───────────────────────
    video_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
    video_path = video_tmp.name
    try:
        with video_tmp:
            shutil.copyfileobj(video_file.file, video_tmp)

        # ── 3. Extract audio into a second temp file ──────────────────────
        audio_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        audio_path = audio_tmp.name
        audio_tmp.close()
        try:
            extract_audio(video_path, audio_path)
            transcript = transcribe_audio(audio_path)
        finally:
            if os.path.exists(audio_path):
                os.remove(audio_path)
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)

    # ── 4. Evaluate transcript ────────────────────────────────────────────
    evaluation = evaluate_answer(
        question=question.question,
        answer=transcript
    )

    answer = InterviewAnswer(
        question_id=question.id,
        answer=transcript,
        score=evaluation["score"],
        feedback=evaluation["feedback"]
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)

    # ── 5. Generate next adaptive question ───────────────────────────────
    difficulty = determine_difficulty(evaluation["score"])

    analysis = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.id == session.analysis_id)
        .first()
    )

    generated = generate_questions(
        skills=analysis.skills,
        projects=analysis.projects,
        target_role=session.target_role,
        difficulty=difficulty
    )

    next_question_data = generated["questions"][0]
    next_question = InterviewQuestion(
        session_id=session.id,
        question=next_question_data["question"],
        difficulty=difficulty
    )
    db.add(next_question)
    db.commit()
    db.refresh(next_question)

    return {
        "transcript": transcript,
        "answer_id": answer.id,
        "score": evaluation["score"],
        "feedback": evaluation["feedback"],
        "strengths": evaluation["strengths"],
        "improvements": evaluation["improvements"],
        "next_question_id": next_question.id,
        "next_question": next_question.question,
        "difficulty": difficulty
    }

@router.get("/session/{session_id}")
def get_interview_session(
    session_id:int,
    db:Session=Depends(get_db),
    current_user:User=Depends(get_current_user)
):
    session=(db.query(InterviewSession).filter(InterviewSession.id==session_id,InterviewSession.user_id==current_user.id).first())
    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Interview Session Not Found"
        )
    questions = (db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.id
        )
    .all()
    )
    return {
        "session_id": session.id,
        "target_role": session.target_role,
        "questions": [
            {
                "id": q.id,
                "question": q.question,
                "difficulty": q.difficulty
            }
            for q in questions
        ]
    }
