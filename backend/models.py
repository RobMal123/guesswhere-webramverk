from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
    Boolean,
    Text,
    TIMESTAMP,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    scores = relationship("Score", back_populates="user")


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, default="other")
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"))
    score = Column(Integer, nullable=False)
    guess_latitude = Column(Float, nullable=False)
    guess_longitude = Column(Float, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")

    user = relationship("User", back_populates="scores")
