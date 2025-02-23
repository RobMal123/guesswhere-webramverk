from pydantic import BaseModel
from typing import Optional


class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int

    class Config:
        from_attributes = True


class LocationBase(BaseModel):
    latitude: float
    longitude: float
    image_url: str


class Location(LocationBase):
    id: int

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
