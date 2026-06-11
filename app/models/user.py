from app.database.database import Base
from sqlalchemy import Integer,Column,String
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__="users"

    id=Column(Integer,primary_key=True,index=True)

    username=Column(String,unique=True,nullable=False)

    email=Column(String,unique=True,nullable=False)

    password=Column(String,nullable=False)

    resumes=relationship(
        "Resume",
        back_populates="user"
    )