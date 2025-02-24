from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int

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


class LocationBase(BaseModel):
    latitude: float
    longitude: float
    category: LocationCategory = LocationCategory.OTHER  # Default to 'other'


class LocationCreate(LocationBase):
    pass


class Location(LocationBase):
    id: int
    image_url: str
    latitude: float
    longitude: float
    category: LocationCategory
    created_at: datetime
    description: Optional[str] = None  # Add this if you have a description field

    class Config:
        from_attributes = True


class GuessCreate(BaseModel):
    location_id: int
    guessed_latitude: float
    guessed_longitude: float
    actual_latitude: float
    actual_longitude: float


class ScoreCreate(BaseModel):
    user_id: int
    location_id: int
    score: int


class Score(ScoreCreate):
    id: int

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    id: int
    username: str
    score: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
