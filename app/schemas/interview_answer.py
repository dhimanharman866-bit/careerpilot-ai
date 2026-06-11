from pydantic import BaseModel

class AnswerSubmissionRequest(BaseModel):
    question_id:int
    answer:str