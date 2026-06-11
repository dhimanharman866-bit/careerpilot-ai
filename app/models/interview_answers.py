from sqlalchemy import (
    Column,
    Integer,
    Text,
    ForeignKey,
    DateTime
)

from sqlalchemy.orm import relationship

from datetime import datetime

from app.database.database import Base


class InterviewAnswer(Base):

    __tablename__ = "interview_answers"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    question_id = Column(
        Integer,
        ForeignKey("interview_questions.id")
    )

    answer = Column(
        Text
    )

    score = Column(
        Integer
    )

    feedback = Column(
        Text
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    question = relationship(
        "InterviewQuestion",
        back_populates="answers"
    )