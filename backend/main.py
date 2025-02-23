from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func, desc
import models
import schemas
import database
from database import SessionLocal, engine
import os
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from utils import calculate_distance, calculate_score
from fastapi.staticfiles import StaticFiles


load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Security configurations
SECRET_KEY = "your-secret-key"  # Change this!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login",  # Changed to match the endpoint below
    auto_error=False,
)

# Update the CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create images directory if it doesn't exist
os.makedirs("images", exist_ok=True)

# Mount the images directory
app.mount("/images", StaticFiles(directory="images"), name="images")


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Authentication functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    if token is None:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    user = db.query(models.User).filter(models.User.username == username).first()
    return user


# Public endpoints (no authentication required)
@app.post("/locations/", response_model=schemas.Location)
async def create_location(
    latitude: float,
    longitude: float,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Save image to disk
    file_location = f"images/{image.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(await image.read())

    # Create location in database
    db_location = models.Location(
        image_url=file_location, latitude=latitude, longitude=longitude
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location


@app.get("/locations/random", response_model=schemas.Location)
async def get_random_location(db: Session = Depends(get_db)):
    locations = db.query(models.Location).all()
    if not locations:
        raise HTTPException(status_code=404, detail="No locations found")
    return random.choice(locations)


@app.get("/leaderboard/", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    top_scores = (
        db.query(
            models.Score,
            models.User.username,
            func.sum(models.Score.score).label("total_score"),
        )
        .join(models.User)
        .group_by(models.User.id)
        .order_by(desc("total_score"))
        .limit(10)
        .all()
    )

    return [
        {"username": score.username, "score": score.total_score, "id": score.Score.id}
        for score in top_scores
    ]


# Protected endpoints (authentication required)
@app.post("/submit-guess")
async def submit_guess(
    guess: schemas.GuessCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    # Calculate distance between guess and actual location
    distance = calculate_distance(
        guess.guessed_latitude,
        guess.guessed_longitude,
        guess.actual_latitude,
        guess.actual_longitude,
    )

    # Calculate score based on distance
    score = calculate_score(distance)

    # Save score to database with guess coordinates
    db_score = models.Score(
        user_id=current_user.id,
        location_id=guess.location_id,
        score=score,
        guess_latitude=guess.guessed_latitude,
        guess_longitude=guess.guessed_longitude,
    )
    db.add(db_score)
    db.commit()
    db.refresh(db_score)

    return {
        "score": score,
        "distance": round(distance, 2),
        "message": f"You were {round(distance, 2)} km away from the target!",
    }


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = (
        db.query(models.User).filter(models.User.username == user.username).first()
    )
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Create new user with hashed password
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username, email=user.email, hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/login", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = (
        db.query(models.User).filter(models.User.username == form_data.username).first()
    )
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/login")
async def login(
    username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not pwd_context.verify(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}


# Add these new admin endpoints


@app.get("/admin/stats")
async def get_admin_stats(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not current_user or not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    total_users = db.query(models.User).count()
    total_locations = db.query(models.Location).count()
    total_guesses = db.query(models.Score).count()

    average_score = db.query(func.avg(models.Score.score)).scalar() or 0

    return {
        "totalUsers": total_users,
        "totalLocations": total_locations,
        "totalGuesses": total_guesses,
        "averageScore": float(average_score),
    }


@app.get("/admin/users")
async def get_admin_users(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not current_user or not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    users = (
        db.query(models.User, func.sum(models.Score.score).label("total_score"))
        .outerjoin(models.Score)
        .group_by(models.User.id)
        .all()
    )

    return [
        {
            "id": user.User.id,
            "username": user.User.username,
            "email": user.User.email,
            "total_score": user.total_score or 0,
            "created_at": user.User.created_at,
        }
        for user in users
    ]


@app.get("/admin/locations")
async def get_admin_locations(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not current_user or not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    locations = db.query(models.Location).all()
    return locations
