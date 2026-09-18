from sqlalchemy import Integer,Column,ForeignKey,DateTime,JSON

from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base

class ResumeAnalysis(Base):

    __tablename__="resume_analyses"

    id=Column(Integer,primary_key=True,index=True)

    resume_id=Column(Integer,ForeignKey("resumes.id"))

    skills=Column(JSON)
    projects=Column(JSON)
    strengths=Column(JSON)
    weaknesses=Column(JSON)
    score=Column(JSON)

    created_at=Column(DateTime,default=datetime.utcnow)

    resume=relationship(
        "Resume",
        back_populates="analyses"
    )