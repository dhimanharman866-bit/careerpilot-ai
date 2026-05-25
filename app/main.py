from fastapi import FastAPI
from app.database.database import engine,Base
from app.models.user import User
from routers.user import router as user_router

Base.metadata.create_all(bind=engine)


app=FastAPI()
app.include_router(user_router)

@app.get("/")
def root():
    return {
        "message":"AI Interview Copilot backend running"
    }