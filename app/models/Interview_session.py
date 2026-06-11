from sqlalchemy import Column,Integer,String,ForeignKey,DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class InterviewSession(Base):
    __tablename__="interview_session"


    id=Column(Integer,primary_key=True,index=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    analysis_id=Column(Integer,ForeignKey("resume_analyses.id"))
    target_role=Column(String)
    created_at=Column(DateTime,default=datetime.utcnow)
    question=relationship(
        "InterviewQuestion",
        back_populates="session"
    )