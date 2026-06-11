from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime
)

from sqlalchemy.orm import relationship

from datetime import datetime

from app.database.database import Base


class InterviewQuestion(Base):

    __tablename__ = "interview_questions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    session_id = Column(
        Integer,
        ForeignKey("interview_session.id")
    )

    question = Column(
        String
    )

    difficulty = Column(
        String
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    session = relationship(
        "InterviewSession",
        back_populates="question"
    )
    answers = relationship(
    "InterviewAnswer",
    back_populates="question"
    )