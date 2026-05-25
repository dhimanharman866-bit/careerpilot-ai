from fastapi import APIRouter,Depends,HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.User import UserCreate,UserResponse,UserLogin
from app.models.user import User
from app.utils.security import hash_password,verify_password
from app.utils.jwt import create_access_token,verify_access_token
from app.dependencies.auth import get_current_user

router=APIRouter()

@router.post("/register")
def register_user(
    user:UserCreate,
    db:Session=Depends(get_db)
):
    new_user=User(
        username=user.username,
        password=hash_password(user.password),
        email=user.email
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {
        "message":"User Created Succesfully",
        "user_id":new_user.id
    }

@router.get("/users",response_model=list[UserResponse])
def get_users(
    db:Session=Depends(get_db)
):
    users=db.query(User).all()

    return users

@router.get("/users/{user_id}",response_model=UserResponse)
def get_user_by_id(user_id:int,db:Session=Depends(get_db)):
    user=db.query(User).filter(User.id==user_id).first()

    return user


@router.post("/login")
def login(user_data:OAuth2PasswordRequestForm = Depends(),db:Session=Depends(get_db)):
    user=db.query(User).filter(User.email==user_data.username).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    if not verify_password(
        user_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Credentials"
        )
    
    access_token=create_access_token(
        {
            "sub":str(user.id)
        }
    )
    return {
        "access_token":access_token,
        "token_type":"bearer"
    }

@router.get("/token-info")
def token_info(token:str,db:Session=Depends(get_db)):

    payload=verify_access_token(token)

    user_id=payload['sub']

    user=(
        db.query(User).filter(
            User.id==int(user_id)).first()
        )
    return {
        "id":user_id,
        "username":user.username,
        "email":user.email
    }

@router.get("/me")
def get_me(
    current_user:User=Depends(get_current_user)
):
    return {
        "id":current_user.id,
        "username":current_user.username,
        "email":current_user.email
    }