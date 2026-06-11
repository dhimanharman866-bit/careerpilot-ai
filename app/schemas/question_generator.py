from pydantic import BaseModel

class QuesyionGenerationRequest(BaseModel):
    target_role:str
    adaptive:bool=False