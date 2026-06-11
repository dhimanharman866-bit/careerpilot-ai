from sqlalchemy import Integer,Column,String,Text,ForeignKey,DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base

class Resume(Base):

    __tablename__='resumes'

    id=Column(Integer,primary_key=True,index=True)

    user_id=Column(Integer,ForeignKey("users.id"))

    filename=Column(String,nullable=False)

    resume_text=Column(Text,nullable=True)

    created_at=Column(DateTime,default=datetime.utcnow)

    user=relationship(
        "User",
        back_populates="resumes"
    )

    analyses=relationship(
        "ResumeAnalysis",
        back_populates="resume"
    )