from fastapi import APIRouter,HTTPException
from fastapi import UploadFile,File
from fastapi import Depends
import fitz
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.database.database import get_db
from app.models.resume import Resume
from app.ai.resume_analyzer import analyze_resume_text
from app.models.resume_analysis import ResumeAnalysis

router=APIRouter(
    prefix="/resume",
    tags=["Resume"]
)

MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = {"application/pdf"}

@router.post("/upload")
def upload_resume(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # SECURITY: validate MIME type — only PDF files accepted
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Only PDF files are accepted. Received content-type: '{file.content_type}'"
        )

    pdf_bytes = file.file.read(MAX_RESUME_SIZE_BYTES + 1)

    # SECURITY: enforce file size limit to prevent DoS via oversized uploads
    if len(pdf_bytes) > MAX_RESUME_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum allowed size is 5 MB."
        )

    pdf_document = fitz.open(
        stream=pdf_bytes,
        filetype="pdf"
    )    
    
    extracted_text = ""

    for page in pdf_document:
        extracted_text += page.get_text()

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        resume_text=extracted_text
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {
        "message": "Resume uploaded successfully",
        "resume_id": resume.id,
        "filename": resume.filename,
        "user_id": resume.user_id,
        "text_preview": extracted_text[:500]
    }

@router.post("/analyze/{resume_id}")
def analyze_resume(
    resume_id:int,current_user:User=Depends(get_current_user),db:Session=Depends(get_db)
):
    resume=(
        db.query(Resume).filter(
            Resume.id==resume_id,
            Resume.user_id==current_user.id
        ).first()
    )
    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume Not Found"
        )
    
    analysis=analyze_resume_text(resume.resume_text)
    
    analysis_db=ResumeAnalysis(
        resume_id=resume.id,
        skills=analysis['skills'],
        projects=analysis['projects'],
        strengths=analysis['strengths'],
        weaknesses=analysis['weaknesses'],
        score=analysis['score']
    )

    db.add(analysis_db)

    db.commit()

    db.refresh(analysis_db)

    return {
        "analysis_id": analysis_db.id,
        "resume_id": resume.id,
        "analysis": analysis
    }
@router.get("/latest-analysis")
def get_latest_analysis(current_user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    resume=db.query(Resume).filter(Resume.user_id==current_user.id).order_by(Resume.id.desc()).first()
    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="No Resume found"
        )
    analysis = (
    db.query(ResumeAnalysis)
    .filter(ResumeAnalysis.resume_id == resume.id)
    .order_by(ResumeAnalysis.created_at.desc())
    .first()
    )
    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Resume is not analyzed yet"
        )
    return {
        "analysis_id": analysis.id,
        "resume_id": resume.id,
        "skills": analysis.skills,
        "projects": analysis.projects,
        "strengths": analysis.strengths,
        "weaknesses": analysis.weaknesses,
        "score": analysis.score,
        "created_at": analysis.created_at
        }