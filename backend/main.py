from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from sqlalchemy import func, desc, and_, text, or_
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
from fastapi.responses import JSONResponse
from email_utils import send_verification_email, send_password_reset_email
import secrets

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Update the CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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

        # Convert difficulty_level to lowercase and validate
        difficulty_level = difficulty_level.lower()

        # Validate difficulty level
        if difficulty_level not in [e.value for e in models.DifficultyLevel]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid difficulty level. Must be one of: {', '.join([e.value for e in models.DifficultyLevel])}",
            )

        # Convert string to enum
        difficulty_enum = models.DifficultyLevel(difficulty_level)

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

        # Create location with the correct image path and enum value
        db_location = models.Location(
            image_url=file_name,  # Store just the filename
            latitude=float(latitude),
            longitude=float(longitude),
            name=name,
            description=description,
            category_id=category_id,
            difficulty_level=difficulty_enum,  # Use the enum value
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
def get_leaderboard(category: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        # Start with base query
        query = db.query(
            models.Leaderboard,
            models.User.username,
        ).join(models.User)

        if category and category.lower() != "all":
            # Get the category ID
            category_obj = (
                db.query(models.Category)
                .filter(func.lower(models.Category.name) == func.lower(category))
                .first()
            )

            if not category_obj:
                raise HTTPException(
                    status_code=404, detail=f"Category '{category}' not found"
                )

            # Subquery to get the highest score per user for the specific category
            category_scores = (
                db.query(
                    models.Score.user_id,
                    func.sum(models.Score.score).label("category_score"),
                )
                .join(models.Location)
                .filter(models.Location.category_id == category_obj.id)
                .group_by(models.Score.user_id)
                .subquery()
            )

            # Join with the category scores and order by category-specific scores
            query = query.join(
                category_scores, models.Leaderboard.user_id == category_scores.c.user_id
            ).order_by(category_scores.c.category_score.desc())
        else:
            # If no category specified, order by overall highest score
            query = query.order_by(models.Leaderboard.highest_score.desc())

        # Limit to top 10
        leaderboard = query.limit(10).all()

        return [
            {
                "id": entry.Leaderboard.id,
                "user_id": entry.Leaderboard.user_id,
                "username": entry.username,
                "highest_score": entry.Leaderboard.highest_score,
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
    try:
        # Check if user already exists
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Generate verification token
        verification_token = secrets.token_urlsafe(32)
        logger.info(f"Generated verification token for {user.email}")

        # Create new user with hashed password and verification token
        hashed_password = get_password_hash(user.password)
        db_user = models.User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            verification_token=verification_token,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"Created new user: {user.email}")

        # Send verification email
        logger.info(f"Attempting to send verification email to {user.email}")
        email_sent = send_verification_email(user.email, verification_token)
        if not email_sent:
            logger.error(f"Failed to send verification email to {user.email}")
            # We should still return the user, but log the error
            # The user can request a new verification email later

        return db_user
    except Exception as e:
        logger.error(f"Error in create_user: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while creating the user: {str(e)}",
        )


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

    # Check if email is verified
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please verify your email before logging in",
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

    # Calculate total score for this session
    total_session_score = (
        db.query(func.sum(models.Score.score))
        .filter(models.Score.game_session_id == session_id)
        .scalar()
        or 0
    )

    # Get or create leaderboard entry for the user
    leaderboard_entry = (
        db.query(models.Leaderboard)
        .filter(models.Leaderboard.user_id == current_user.id)
        .first()
    )

    if leaderboard_entry:
        # Update highest score if this session's score is higher
        if total_session_score > leaderboard_entry.highest_score:
            leaderboard_entry.highest_score = total_session_score
    else:
        # Create new leaderboard entry
        leaderboard_entry = models.Leaderboard(
            user_id=current_user.id, highest_score=total_session_score
        )
        db.add(leaderboard_entry)

    session.ended_at = func.now()
    db.commit()

    return {
        "message": "Game session ended",
        "total_score": total_session_score,
        "is_high_score": leaderboard_entry.highest_score == total_session_score,
    }


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
def list_categories(db: Session = Depends(get_db)):
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


# Create a new challenge
@app.post("/challenges/", response_model=schemas.Challenge)
async def create_challenge(
    friend_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Check if friend exists and is actually a friend
    friendship = (
        db.query(models.Friends)
        .filter(
            models.Friends.user_id == current_user.id,
            models.Friends.friend_id == friend_id,
        )
        .first()
    )

    if not friendship:
        raise HTTPException(status_code=404, detail="Friend not found")

    # Create a new challenge
    challenge = models.Challenge(challenger_id=current_user.id, challenged_id=friend_id)
    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    # Select 5 random locations
    locations = db.query(models.Location).order_by(func.random()).limit(5).all()

    # Add these locations to the challenge
    for i, location in enumerate(locations):
        challenge_location = models.ChallengeLocation(
            challenge_id=challenge.id,
            location_id=location.id,
            order_index=i + 1,  # 1-indexed
        )
        db.add(challenge_location)

    db.commit()

    return challenge


# Get challenges for current user
@app.get("/challenges/", response_model=List[schemas.ChallengeWithDetails])
async def get_challenges(
    status: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    query = db.query(models.Challenge).filter(
        or_(
            models.Challenge.challenger_id == current_user.id,
            models.Challenge.challenged_id == current_user.id,
        )
    )

    if status:
        query = query.filter(models.Challenge.status == status)

    challenges = query.order_by(models.Challenge.created_at.desc()).all()
    return challenges


# Accept or decline a challenge
@app.put("/challenges/{challenge_id}/respond", response_model=schemas.Challenge)
async def respond_to_challenge(
    challenge_id: int,
    accept: bool,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Log for debugging
    print(f"Responding to challenge {challenge_id}, accept={accept}")
    print(f"Current user: {current_user.id} ({current_user.username})")

    # First, check if the challenge exists at all
    challenge = (
        db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    )

    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    print(
        f"Challenge found: challenger_id={challenge.challenger_id}, challenged_id={challenge.challenged_id}, status={challenge.status}"
    )

    # Now check if this user is the one being challenged and if the challenge is pending
    if challenge.challenged_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the challenged user")

    if challenge.status != "pending":
        raise HTTPException(status_code=400, detail="Challenge is not pending")

    # Update the challenge status
    if accept:
        challenge.status = "accepted"
    else:
        challenge.status = "declined"

    db.commit()
    db.refresh(challenge)
    return challenge


# Get challenge details with locations
@app.get("/challenges/{challenge_id}", response_model=schemas.ChallengeDetail)
async def get_challenge_detail(
    challenge_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Get the challenge with challenger and challenged users
    challenge = (
        db.query(models.Challenge)
        .options(joinedload(models.Challenge.challenger))
        .options(joinedload(models.Challenge.challenged))
        .filter(
            models.Challenge.id == challenge_id,
            or_(
                models.Challenge.challenger_id == current_user.id,
                models.Challenge.challenged_id == current_user.id,
            ),
        )
        .first()
    )

    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Get the challenge locations with their associated location details
    challenge_locations = (
        db.query(models.ChallengeLocation, models.Location)
        .join(
            models.Location, models.ChallengeLocation.location_id == models.Location.id
        )
        .filter(models.ChallengeLocation.challenge_id == challenge_id)
        .order_by(models.ChallengeLocation.order_index)
        .all()
    )

    # Get all guesses made by the current user for this challenge
    user_guesses = (
        db.query(models.ChallengeScore)
        .filter(
            models.ChallengeScore.challenge_id == challenge_id,
            models.ChallengeScore.user_id == current_user.id,
        )
        .order_by(models.ChallengeScore.round_number.desc())
        .all()
    )

    # Calculate the next round based on the last guess made
    if user_guesses:
        next_round = user_guesses[0].round_number + 1
    else:
        next_round = 1

    # Update the challenge's current round
    if not challenge.current_round or challenge.current_round != next_round:
        challenge.current_round = next_round
        db.commit()

    # Create the response data structure
    response_data = {
        "id": challenge.id,
        "challenger_id": challenge.challenger_id,
        "challenged_id": challenge.challenged_id,
        "status": challenge.status,
        "created_at": challenge.created_at,
        "completed_at": challenge.completed_at,
        "winner_id": challenge.winner_id,
        "current_round": challenge.current_round,
        "challenger": {
            "id": challenge.challenger.id,
            "username": challenge.challenger.username,
            "email": challenge.challenger.email,
            "is_admin": challenge.challenger.is_admin,
            "created_at": challenge.challenger.created_at,
        },
        "challenged": {
            "id": challenge.challenged.id,
            "username": challenge.challenged.username,
            "email": challenge.challenged.email,
            "is_admin": challenge.challenged.is_admin,
            "created_at": challenge.challenged.created_at,
        },
        "locations": [
            {
                "id": cl.id,
                "challenge_id": cl.challenge_id,
                "location_id": cl.location_id,
                "order_index": cl.order_index,
                "location": {
                    "id": loc.id,
                    "name": loc.name,
                    "latitude": loc.latitude,
                    "longitude": loc.longitude,
                    "image_url": loc.image_url,
                    "category_id": loc.category_id,
                    "difficulty_level": loc.difficulty_level,
                    "country": loc.country,
                    "region": loc.region,
                    "description": loc.description,
                    "created_at": loc.created_at,
                    "updated_at": loc.updated_at,
                },
            }
            for cl, loc in challenge_locations
        ],
    }

    return response_data


# Start a challenge (set to in_progress)
@app.put("/challenges/{challenge_id}/start", response_model=schemas.Challenge)
async def start_challenge(
    challenge_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    challenge = (
        db.query(models.Challenge)
        .filter(
            models.Challenge.id == challenge_id,
            models.Challenge.status == "accepted",
            or_(
                models.Challenge.challenger_id == current_user.id,
                models.Challenge.challenged_id == current_user.id,
            ),
        )
        .first()
    )

    if not challenge:
        raise HTTPException(
            status_code=404, detail="Challenge not found or not accepted"
        )

    # Check if user has any existing guesses
    existing_guesses = (
        db.query(models.ChallengeScore)
        .filter(
            models.ChallengeScore.challenge_id == challenge_id,
            models.ChallengeScore.user_id == current_user.id,
        )
        .order_by(models.ChallengeScore.round_number.desc())
        .first()
    )

    challenge.status = "in_progress"
    challenge.current_round = (
        (existing_guesses.round_number + 1) if existing_guesses else 1
    )

    db.commit()
    db.refresh(challenge)
    return challenge


# Submit a guess for a challenge
@app.post(
    "/challenges/{challenge_id}/submit-guess", response_model=schemas.ChallengeScore
)
async def submit_challenge_guess(
    challenge_id: int,
    guess: schemas.ChallengeGuessCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Verify the challenge and ensure it's in progress
        challenge = (
            db.query(models.Challenge)
            .filter(
                models.Challenge.id == challenge_id,
                models.Challenge.status == "in_progress",
                or_(
                    models.Challenge.challenger_id == current_user.id,
                    models.Challenge.challenged_id == current_user.id,
                ),
            )
            .first()
        )

        if not challenge:
            raise HTTPException(
                status_code=404, detail="Challenge not found or not in progress"
            )

        # Verify the round number matches the challenge's current round
        if guess.round_number != challenge.current_round:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid round number. Expected {challenge.current_round}, got {guess.round_number}",
            )

        # Verify the location belongs to this challenge
        challenge_location = (
            db.query(models.ChallengeLocation)
            .filter(
                models.ChallengeLocation.challenge_id == challenge_id,
                models.ChallengeLocation.location_id == guess.location_id,
            )
            .first()
        )

        if not challenge_location:
            raise HTTPException(
                status_code=400, detail="Location is not part of this challenge"
            )

        # Check if this location has already been guessed by the user
        existing_guess = (
            db.query(models.ChallengeScore)
            .filter(
                models.ChallengeScore.challenge_id == challenge_id,
                models.ChallengeScore.user_id == current_user.id,
                models.ChallengeScore.location_id == guess.location_id,
            )
            .first()
        )

        if existing_guess:
            raise HTTPException(
                status_code=400,
                detail="You have already submitted a guess for this location",
            )

        # Calculate distance and score
        distance = calculate_distance(
            guess.guessed_latitude,
            guess.guessed_longitude,
            guess.actual_latitude,
            guess.actual_longitude,
        )

        # Base score uses existing calculation
        base_score = calculate_score(distance)

        # Time bonus (maximum 20% bonus for immediate answers)
        max_time_bonus = base_score * 0.2
        time_factor = max(0, 1 - (guess.time_taken / 60))
        time_bonus = int(max_time_bonus * time_factor)

        total_score = base_score + time_bonus

        # Create new guess
        challenge_score = models.ChallengeScore(
            challenge_id=challenge_id,
            user_id=current_user.id,
            location_id=guess.location_id,
            score=total_score,
            time_taken=guess.time_taken,
            distance=distance,
            guess_latitude=guess.guessed_latitude,
            guess_longitude=guess.guessed_longitude,
            round_number=guess.round_number,
        )

        db.add(challenge_score)

        # After saving the guess, check total guesses from both players
        total_locations = (
            db.query(models.ChallengeLocation)
            .filter(models.ChallengeLocation.challenge_id == challenge_id)
            .count()
        )

        # Count guesses for both players
        total_guesses = (
            db.query(models.ChallengeScore)
            .filter(models.ChallengeScore.challenge_id == challenge_id)
            .count()
        )

        # If we have all 10 guesses (5 from each player), mark as completed
        if (
            total_guesses == total_locations * 2
        ):  # 5 locations * 2 players = 10 total guesses
            # Calculate final scores
            challenger_total = (
                db.query(func.sum(models.ChallengeScore.score))
                .filter(
                    models.ChallengeScore.challenge_id == challenge_id,
                    models.ChallengeScore.user_id == challenge.challenger_id,
                )
                .scalar()
                or 0
            )

            challenged_total = (
                db.query(func.sum(models.ChallengeScore.score))
                .filter(
                    models.ChallengeScore.challenge_id == challenge_id,
                    models.ChallengeScore.user_id == challenge.challenged_id,
                )
                .scalar()
                or 0
            )

            # Update challenge status
            challenge.status = "completed"
            challenge.completed_at = func.now()
            challenge.winner_id = (
                challenge.challenger_id
                if challenger_total > challenged_total
                else challenge.challenged_id
                if challenged_total > challenger_total
                else None  # Draw
            )

        # Set current round for the player who just submitted
        if current_user.id == challenge.challenger_id:
            challenger_guesses = (
                db.query(models.ChallengeScore)
                .filter(
                    models.ChallengeScore.challenge_id == challenge_id,
                    models.ChallengeScore.user_id == challenge.challenger_id,
                )
                .count()
            )
            if challenger_guesses == total_locations:
                challenge.current_round = total_locations + 1
        else:
            challenged_guesses = (
                db.query(models.ChallengeScore)
                .filter(
                    models.ChallengeScore.challenge_id == challenge_id,
                    models.ChallengeScore.user_id == challenge.challenged_id,
                )
                .count()
            )
            if challenged_guesses == total_locations:
                challenge.current_round = total_locations + 1

        db.commit()
        db.refresh(challenge_score)
        return challenge_score

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in submit_challenge_guess: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while saving your guess: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Error in submit_challenge_guess: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Get challenge results
@app.get("/challenges/{challenge_id}/results", response_model=schemas.ChallengeResults)
async def get_challenge_results(
    challenge_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the results of a specific challenge.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Get the challenge with challenger and challenged info
    challenge = (
        db.query(models.Challenge)
        .options(joinedload(models.Challenge.challenger))
        .options(joinedload(models.Challenge.challenged))
        .filter(
            models.Challenge.id == challenge_id,
            or_(
                models.Challenge.challenger_id == current_user.id,
                models.Challenge.challenged_id == current_user.id,
            ),
        )
        .first()
    )

    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Get scores with user information
    scores = (
        db.query(models.ChallengeScore)
        .options(joinedload(models.ChallengeScore.user))
        .filter(models.ChallengeScore.challenge_id == challenge_id)
        .all()
    )

    # Check if we have all 10 guesses and challenge is still in progress
    if len(scores) == 10 and challenge.status == "in_progress":
        # Calculate final scores for both players
        challenger_total = sum(
            score.score for score in scores if score.user_id == challenge.challenger_id
        )

        challenged_total = sum(
            score.score for score in scores if score.user_id == challenge.challenged_id
        )

        # Update challenge status and determine winner
        challenge.status = "completed"
        challenge.completed_at = func.now()
        challenge.winner_id = (
            challenge.challenger_id
            if challenger_total > challenged_total
            else challenge.challenged_id
            if challenged_total > challenger_total
            else None  # Draw
        )
        db.commit()
        db.refresh(challenge)

    return schemas.ChallengeResults(
        challenge=challenge, scores=scores, is_complete=challenge.status == "completed"
    )


# Add this error handler
@app.exception_handler(Exception)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Credentials": "true",
        },
    )


@app.delete("/challenges/{challenge_id}")
async def delete_challenge(
    challenge_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    challenge = (
        db.query(models.Challenge)
        .filter(
            models.Challenge.id == challenge_id,
            or_(
                models.Challenge.challenger_id == current_user.id,
                models.Challenge.challenged_id == current_user.id,
            ),
        )
        .first()
    )

    if not challenge:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found or you don't have permission to delete it",
        )

    db.delete(challenge)
    db.commit()
    return {"message": "Challenge deleted successfully"}


@app.get("/verify-email/{token}")
async def verify_email(token: str, db: Session = Depends(get_db)):
    # Find user with matching verification token
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token",
        )

    # Check if token is expired
    if (
        user.verification_token_expires
        and user.verification_token_expires < datetime.now()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired",
        )

    # Mark email as verified and clear verification token
    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()

    return {"message": "Email verified successfully"}


@app.post("/forgot-password")
async def forgot_password(email: str = Form(...), db: Session = Depends(get_db)):
    """Request a password reset email"""
    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        # Return success even if user not found to prevent email enumeration
        return {
            "message": "If an account exists with this email, a password reset link will be sent."
        }

    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    # Send reset email
    email_sent = send_password_reset_email(email, reset_token)

    if not email_sent:
        # If email fails, clear the reset token
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        raise HTTPException(
            status_code=500, detail="Failed to send password reset email"
        )

    return {
        "message": "If an account exists with this email, a password reset link will be sent."
    }


@app.post("/reset-password/{token}")
async def reset_password(
    token: str, new_password: str = Form(...), db: Session = Depends(get_db)
):
    """Reset password using the reset token"""
    user = (
        db.query(models.User)
        .filter(
            models.User.reset_token == token,
            models.User.reset_token_expires > datetime.utcnow(),
        )
        .first()
    )

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    # Update password and clear reset token
    user.hashed_password = get_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Password has been reset successfully"}
