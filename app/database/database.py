import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Option 1: Full DATABASE_URL set directly (e.g. on Render/Railway)
# Option 2: Supabase-style individual vars (user, password, host, port, dbname)
# Option 3: Falls back to local SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DB_USER     = os.getenv("user")
    DB_PASSWORD = os.getenv("password")
    DB_HOST     = os.getenv("host")
    DB_PORT     = os.getenv("port", "5432")
    DB_NAME     = os.getenv("dbname")

    if all([DB_USER, DB_PASSWORD, DB_HOST, DB_NAME]):
        DATABASE_URL = (
            f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}"
            f"@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
        )
    else:
        DATABASE_URL = "sqlite:///./interview.db"

# SQLite needs check_same_thread=False; PostgreSQL does not
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(
    autoflush=False,
    autocommit=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()