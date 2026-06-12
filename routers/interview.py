from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
import shutil

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
    analysis=db.query(ResumeAnalysis).filter(analysis_id==ResumeAnalysis.id).first()

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
    request:AnswerSubmissionRequest,
    db:Session=Depends(get_db)
):
    question=(db.query(InterviewQuestion).filter(InterviewQuestion.id==request.question_id).first())

    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )
    evaluation=evaluate_answer(question=question.question,answer=request.answer)

    answer=InterviewAnswer(
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

@router.get("/summary/{session_id}")
def get_interview_summary(session_id:int,current_user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    session=(db.query(InterviewSession).filter(InterviewSession.id==session_id).first())
    if session.user_id!=current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )
    if session is None:
        raise HTTPException(
            status_code=404,
            detail="session not found"
        )
    questions=db.query(InterviewSession).filter(InterviewSession.id==session.id).all()

    qa_data=[]
    score=[]
    for question in questions:
        answer=(db.query(InterviewAnswer).filter(InterviewAnswer.question_id==question.id).first())
        if answer is None:
            continue

        qa_data.append(
            {
                "question":question.question,
                "answer":answer.answer,
                "score":answer.score,
                "feedback":answer.feedback
            }
        )

        score.append(
            answer.score
        )
    
    average_score=(
        sum(score)/len(score)
        if score
        else 0
    )
    summary = generate_interview_summary(
        qa_data=qa_data,
        average_score=average_score
    )
    return {
        "session_id":session.id,
        "average_score":average_score,
        "summary":summary
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
                "average_score": average_score
            }
        )
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
                "average_score": average_score
            }
        )
    return {
        "history": history
    }

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

    temp_file = f"temp_{audio_file.filename}"

    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(
            audio_file.file,
            buffer
        )

    transcript = transcribe_audio(
        temp_file
    )

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

@router.post("/adaptivr-video-answer")
def adaptive_video_answer(
    question_id:int,
    video_file:UploadFile=File(...),
    current_user:User=Depends(get_current_user),
    db:Session=Depends(get_db)
):
    video_path = f"temp_{video_file.filename}"
    
    with open(
    video_path,
    "wb"
    ) as buffer:
        shutil.copyfileobj(
            video_file.file,
            buffer
        )
    audio_path = "temp_audio.wav"
    extract_audio(video_path,audio_path)
    transcript=transcribe_audio(audio_path)
    os.remove(video_path)
    os.remove(audio_path)
    question = db.query(InterviewQuestion).filter(InterviewQuestion.id==question_id).first()
    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )
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
