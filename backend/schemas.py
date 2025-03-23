from pydantic import BaseModel, constr
from typing import Optional, List
from enum import Enum
from datetime import datetime
from pydantic import validator


class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    is_admin: bool
    email_verified: bool = False
    verification_token: Optional[str] = None
    verification_token_expires: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LocationCategory(str, Enum):
    LANDMARK = "landmark"
    NATURE = "nature"
    CITY = "city"
    BUILDING = "building"
    PARK = "park"
    BEACH = "beach"
    MOUNTAIN = "mountain"
    CASTLE = "castle"
    BRIDGE = "bridge"
    OTHER = "other"


class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True


class LocationBase(BaseModel):
    latitude: float
    longitude: float
    name: str
    description: Optional[str] = None
    category_id: int
    difficulty_level: DifficultyLevel
    country: str
    region: str


class LocationCreate(LocationBase):
    pass


class Location(BaseModel):
    id: int
    image_url: str
    latitude: float
    longitude: float
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    difficulty_level: str
    country: Optional[str] = None
    region: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @validator("image_url", pre=True)
    def get_full_image_url(cls, v):
        if not v.startswith("images/"):
            return f"images/{v}"
        return v

    class Config:
        from_attributes = True


class PendingLocationBase(LocationBase):
    image_url: str


class PendingLocationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    category_id: int
    difficulty_level: str
    country: str
    region: str
    image_url: str
    status: str = "pending"


class PendingLocation(PendingLocationBase):
    id: int
    user_id: int
    image_url: str
    created_at: datetime
    status: str

    @validator("image_url", pre=True)
    def get_full_image_url(cls, v):
        if not v.startswith("images/"):
            return f"images/{v}"
        return v

    class Config:
        from_attributes = True


class GameSessionBase(BaseModel):
    user_id: int


class GameSessionCreate(GameSessionBase):
    pass


class GameSession(GameSessionBase):
    id: int
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    id: int
    user_id: int
    username: str
    highest_score: int
    last_updated: datetime

    class Config:
        from_attributes = True


class FriendBase(BaseModel):
    user_id: int
    friend_id: int


class FriendCreate(FriendBase):
    pass


class Friend(FriendBase):
    class Config:
        from_attributes = True


class GuessCreate(BaseModel):
    location_id: int
    guessed_latitude: float
    guessed_longitude: float
    actual_latitude: float
    actual_longitude: float
    game_session_id: Optional[int] = None


class ScoreCreate(BaseModel):
    user_id: int
    location_id: int
    score: int
    game_session_id: Optional[int] = None
    guess_latitude: float
    guess_longitude: float


class Score(ScoreCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AchievementBase(BaseModel):
    name: str
    description: str
    category_id: Optional[int] = None
    country: Optional[str] = None
    points_required: int


class AchievementCreate(AchievementBase):
    pass


class Achievement(AchievementBase):
    id: int

    class Config:
        from_attributes = True


class UserAchievementBase(BaseModel):
    user_id: int
    achievement_id: int
    earned_at: datetime


class UserAchievement(UserAchievementBase):
    achievement: Achievement

    class Config:
        from_attributes = True


class UserWithStats(User):
    total_games: int
    highest_score: Optional[int]
    average_score: Optional[float]
    achievements: List[Achievement]


class FriendDetail(BaseModel):
    user: User
    highest_score: Optional[int]
    last_played: Optional[datetime]


class UserFriends(BaseModel):
    friends: List[FriendDetail]


class GameSessionStats(BaseModel):
    session_id: int
    total_score: int
    locations_played: int
    average_score: float
    started_at: datetime
    ended_at: Optional[datetime]


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class ChallengeGuessCreate(BaseModel):
    location_id: int
    guessed_latitude: float
    guessed_longitude: float
    actual_latitude: float
    actual_longitude: float
    time_taken: int  # In seconds
    round_number: int


class ChallengeScoreBase(BaseModel):
    challenge_id: int
    user_id: int
    location_id: int
    score: int
    time_taken: int
    distance: float
    round_number: int


class ChallengeScore(ChallengeScoreBase):
    id: int
    guess_latitude: float
    guess_longitude: float
    created_at: datetime

    class Config:
        from_attributes = True


class ChallengeBase(BaseModel):
    challenger_id: int
    challenged_id: int
    status: str
    current_round: Optional[int] = 1


class Challenge(ChallengeBase):
    id: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    winner_id: Optional[int] = None

    class Config:
        from_attributes = True


class ChallengeWithDetails(Challenge):
    challenger: User
    challenged: User
    winner: Optional[User] = None


class ChallengeLocationBase(BaseModel):
    challenge_id: int
    location_id: int
    order: int


class ChallengeLocation(BaseModel):
    id: int
    challenge_id: int
    location_id: int
    order_index: int
    location: Optional[Location] = None

    class Config:
        from_attributes = True


class ChallengeDetail(BaseModel):
    id: int
    challenger_id: int
    challenged_id: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    winner_id: Optional[int]
    current_round: int
    locations: List[ChallengeLocation]
    challenger: Optional[User]
    challenged: Optional[User]

    class Config:
        from_attributes = True


class ChallengeResults(BaseModel):
    challenge: ChallengeWithDetails
    scores: List[ChallengeScore]
    is_complete: bool

    class Config:
        from_attributes = True
