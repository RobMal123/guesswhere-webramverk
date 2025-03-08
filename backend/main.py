from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func, desc, and_, text
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
from schemas import LocationCategory
from sqlalchemy.exc import SQLAlchemyError
import logging
from pathlib import Path
import re
from urllib.parse import unquote


load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Update the CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],  # Add any other frontend URLs you're using
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login",  # Changed to match the endpoint below
    auto_error=False,
)

# Setup directories
IMAGES_DIR = Path("images")
IMAGES_DIR.mkdir(exist_ok=True)

# Mount the images directory directly
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
    latitude: float = Form(...),
    longitude: float = Form(...),
    name: str = Form(...),
    description: str = Form(None),
    category_id: int = Form(...),
    difficulty_level: str = Form(...),
    country: str = Form(...),
    region: str = Form(...),
    image: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
            )

        # Validate difficulty level
        if difficulty_level not in ["easy", "medium", "hard"]:
            raise HTTPException(status_code=400, detail="Invalid difficulty level")

        # Verify category exists
        category = (
            db.query(models.Category).filter(models.Category.id == category_id).first()
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        # Sanitize the filename and save directly to images directory
        safe_filename = sanitize_filename(image.filename)
        file_name = f"{datetime.now().timestamp()}_{safe_filename}"
        file_path = IMAGES_DIR / file_name

        with open(file_path, "wb") as buffer:
            buffer.write(await image.read())

        # Create location with the correct image path
        db_location = models.Location(
            image_url=file_name,  # Store just the filename
            latitude=float(latitude),
            longitude=float(longitude),
            name=name,
            description=description,
            category_id=category_id,
            difficulty_level=difficulty_level,
            country=country,
            region=region,
        )

        db.add(db_location)
        db.commit()
        db.refresh(db_location)

        return db_location

    except Exception as e:
        print(f"Error creating location: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@app.get("/locations/random", response_model=schemas.Location)
async def get_random_location(
    exclude: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get a random location from any category"""
    try:
        # Start with base query that excludes NULL category_id
        query = db.query(models.Location).filter(
            models.Location.category_id.isnot(None)
        )

        # Handle multiple excluded IDs
        if exclude:
            excluded_ids = [int(id) for id in exclude.split(",")]
            query = query.filter(~models.Location.id.in_(excluded_ids))

        locations = query.all()
        if not locations:
            raise HTTPException(
                status_code=404,
                detail="No locations available",
            )

        return random.choice(locations)
    except Exception as e:
        logger.error(f"Error fetching random location: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching random location: {str(e)}",
        )


@app.get("/locations/category/{category_name}", response_model=schemas.Location)
async def get_location_by_category(
    category_name: str,
    exclude: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get a random location from a specific category"""
    try:
        # First, verify the category exists
        category = (
            db.query(models.Category)
            .filter(func.lower(models.Category.name) == func.lower(category_name))
            .first()
        )

        if not category:
            raise HTTPException(
                status_code=404, detail=f"Category '{category_name}' not found"
            )

        # Query locations for this category, ensuring category_id is not NULL
        query = db.query(models.Location).filter(
            models.Location.category_id == category.id,
            models.Location.category_id.isnot(None),
        )

        # Handle multiple excluded IDs
        if exclude:
            excluded_ids = [int(id) for id in exclude.split(",")]
            query = query.filter(~models.Location.id.in_(excluded_ids))

        locations = query.all()
        if not locations:
            raise HTTPException(
                status_code=404,
                detail=f"No locations found for category: {category_name}",
            )

        return random.choice(locations)
    except Exception as e:
        logger.error(f"Error fetching location for category {category_name}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching location: {str(e)}",
        )


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.get("/leaderboard/", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    try:
        leaderboard = (
            db.query(
                models.Leaderboard,
                models.User.username,
            )
            .join(models.User)
            .order_by(models.Leaderboard.highest_score.desc())
            .limit(10)
            .all()
        )

        return [
            {
                "id": entry.Leaderboard.user_id,
                "username": entry.username,
                "score": entry.Leaderboard.highest_score,
                "last_updated": entry.Leaderboard.last_updated,
            }
            for entry in leaderboard
        ]
    except SQLAlchemyError as e:
        logger.error(f"Database error in leaderboard: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Database error while fetching leaderboard",
        )


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

    # Calculate distance and score
    distance = calculate_distance(
        guess.guessed_latitude,
        guess.guessed_longitude,
        guess.actual_latitude,
        guess.actual_longitude,
    )
    score = calculate_score(distance)

    # Save score
    db_score = models.Score(
        user_id=current_user.id,
        location_id=guess.location_id,
        score=score,
        guess_latitude=guess.guessed_latitude,
        guess_longitude=guess.guessed_longitude,
        game_session_id=guess.game_session_id,
    )
    db.add(db_score)

    # Get previous achievements count
    previous_achievements = (
        db.query(models.UserAchievement)
        .filter(models.UserAchievement.user_id == current_user.id)
        .count()
    )

    # Check and award achievements using text()
    db.execute(
        text("SELECT check_and_award_achievements(:user_id, :location_id, :score)"),
        {"user_id": current_user.id, "location_id": guess.location_id, "score": score},
    )

    db.commit()
    db.refresh(db_score)

    # Get new achievements count
    new_achievements_count = (
        db.query(models.UserAchievement)
        .filter(models.UserAchievement.user_id == current_user.id)
        .count()
    )

    # Check if new achievements were earned
    has_new_achievements = new_achievements_count > previous_achievements

    return {
        "score": score,
        "distance": round(distance, 2),
        "message": f"You were {round(distance, 2)} km away from the target!",
        "has_new_achievements": has_new_achievements,
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


@app.get("/check-admin")
async def check_admin_status(current_user: models.User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    return {"is_admin": current_user.is_admin}


@app.delete("/admin/locations/{location_id}")
async def delete_location(
    location_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user or not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    location = (
        db.query(models.Location).filter(models.Location.id == location_id).first()
    )
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Location not found"
        )

    # Delete the image file
    if os.path.exists(location.image_url):
        os.remove(location.image_url)

    # Delete the database record
    db.delete(location)
    db.commit()

    return {"message": "Location deleted successfully"}


@app.put("/admin/locations/{location_id}", response_model=schemas.Location)
async def update_location(
    location_id: int,
    latitude: float = Form(...),
    longitude: float = Form(...),
    category: str = Form(...),
    name: str = Form(...),
    image: Optional[UploadFile] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check admin permission
    if not current_user or not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    try:
        location = (
            db.query(models.Location).filter(models.Location.id == location_id).first()
        )
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

        # Update location details
        location.latitude = latitude
        location.longitude = longitude
        location.category = category
        location.name = name

        if image:
            # Handle image upload
            file_name = f"{datetime.now().timestamp()}_{image.filename}"
            file_path = IMAGES_DIR / file_name
            with open(file_path, "wb") as buffer:
                buffer.write(await image.read())
            location.image_url = file_name

        # Commit changes
        db.commit()
        db.refresh(location)

        logger.info(f"Location {location_id} updated with name: {name}")
        return location

    except Exception as e:
        logger.error(f"Error updating location {location_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating location: {str(e)}",
        )


@app.post("/game-sessions/start", response_model=schemas.GameSession)
async def start_game_session(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    game_session = models.GameSession(user_id=current_user.id)
    db.add(game_session)
    db.commit()
    db.refresh(game_session)
    return game_session


@app.put("/game-sessions/{session_id}/end")
async def end_game_session(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = (
        db.query(models.GameSession)
        .filter(
            models.GameSession.id == session_id,
            models.GameSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Game session not found")

    session.ended_at = func.now()
    db.commit()
    return {"message": "Game session ended"}


@app.post("/friends/add/{friend_id}")
async def add_friend(
    friend_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if current_user.id == friend_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")

    friend = db.query(models.User).filter(models.User.id == friend_id).first()
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already friends
    existing = (
        db.query(models.Friends)
        .filter(
            (
                (models.Friends.user_id == current_user.id)
                & (models.Friends.friend_id == friend_id)
            )
        )
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="Already friends")

    friendship = models.Friends(user_id=current_user.id, friend_id=friend_id)
    db.add(friendship)
    db.commit()
    return {"message": "Friend added successfully"}


@app.get("/friends/list", response_model=List[schemas.User])
async def list_friends(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    friends = (
        db.query(models.User)
        .join(models.Friends, models.Friends.friend_id == models.User.id)
        .filter(models.Friends.user_id == current_user.id)
        .all()
    )
    return friends


@app.delete("/friends/remove/{friend_id}")
async def remove_friend(
    friend_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    friendship = (
        db.query(models.Friends)
        .filter(
            models.Friends.user_id == current_user.id,
            models.Friends.friend_id == friend_id,
        )
        .first()
    )

    if not friendship:
        raise HTTPException(status_code=404, detail="Friend relationship not found")

    db.delete(friendship)
    db.commit()
    return {"message": "Friend removed successfully"}


@app.post("/categories/", response_model=schemas.Category)
async def create_category(
    category: schemas.CategoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_category = models.Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@app.get("/categories/", response_model=List[schemas.Category])
async def list_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


@app.post("/achievements/", response_model=schemas.Achievement)
async def create_achievement(
    achievement: schemas.AchievementCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_achievement = models.Achievement(**achievement.dict())
    db.add(db_achievement)
    db.commit()
    db.refresh(db_achievement)
    return db_achievement


@app.get("/achievements/", response_model=List[schemas.Achievement])
async def list_achievements(db: Session = Depends(get_db)):
    return db.query(models.Achievement).all()


@app.get("/users/achievements/", response_model=List[schemas.UserAchievement])
async def get_user_achievements(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return (
        db.query(models.UserAchievement)
        .filter(models.UserAchievement.user_id == current_user.id)
        .all()
    )


def sanitize_filename(filename):
    """Remove spaces and special characters from filename."""
    # Decode URL-encoded characters
    filename = unquote(filename)
    # Replace spaces and special characters with underscores
    filename = re.sub(r"[^\w.-]", "_", filename)
    return filename


@app.get("/admin/locations/uncategorized")
async def get_uncategorized_locations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all locations that have no category assigned"""
    if not current_user or not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    locations = (
        db.query(models.Location).filter(models.Location.category_id.is_(None)).all()
    )

    return locations


@app.get("/users/search", response_model=List[schemas.User])
async def search_users(
    username: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Search for users whose usernames contain the search term (case-insensitive)
    # Exclude the current user and users who are already friends
    users = (
        db.query(models.User)
        .filter(
            models.User.id != current_user.id,  # Exclude current user
            func.lower(models.User.username).contains(
                func.lower(username)
            ),  # Case-insensitive search
            ~models.User.id.in_(  # Exclude existing friends
                db.query(models.Friends.friend_id).filter(
                    models.Friends.user_id == current_user.id
                )
            ),
        )
        .limit(10)  # Limit results for performance
        .all()
    )

    return users


@app.get("/users/{user_id}", response_model=schemas.User)
async def get_user(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@app.get("/users/{user_id}/achievements/", response_model=List[schemas.UserAchievement])
async def get_user_achievements_by_id(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    achievements = (
        db.query(models.UserAchievement)
        .filter(models.UserAchievement.user_id == user_id)
        .all()
    )

    return achievements
