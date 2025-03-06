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
    func,
    Enum as SQLAlchemyEnum,
)
from sqlalchemy.orm import relationship
from database import Base
import enum


class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200))
    is_admin = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    scores = relationship("Score", back_populates="user")
    game_sessions = relationship("GameSession", back_populates="user")
    leaderboard_entry = relationship(
        "Leaderboard", back_populates="user", uselist=False
    )
    # Friend relationships
    friends = relationship(
        "Friends", foreign_keys="[Friends.user_id]", back_populates="user"
    )
    friended_by = relationship(
        "Friends", foreign_keys="[Friends.friend_id]", back_populates="friend"
    )
    achievements = relationship("UserAchievement", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)

    # Relationship
    locations = relationship("Location", back_populates="category")


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    name = Column(String(100))
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
    difficulty_level = Column(
        SQLAlchemyEnum(DifficultyLevel), nullable=False, default=DifficultyLevel.MEDIUM
    )
    country = Column(String(100))
    region = Column(String(100))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    category = relationship("Category", back_populates="locations")
    scores = relationship("Score", back_populates="location")

    def get_full_image_url(self):
        """Return the full image URL path."""
        return f"images/{self.image_url}"


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    started_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    ended_at = Column(TIMESTAMP(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="game_sessions")
    scores = relationship("Score", back_populates="game_session")


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"))
    game_session_id = Column(
        Integer, ForeignKey("game_sessions.id", ondelete="CASCADE"), nullable=True
    )
    score = Column(Integer, nullable=False)
    guess_latitude = Column(Float, nullable=False)
    guess_longitude = Column(Float, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="scores")
    location = relationship("Location", back_populates="scores")
    game_session = relationship("GameSession", back_populates="scores")


class Leaderboard(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    highest_score = Column(Integer, nullable=False, default=0)
    last_updated = Column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationship
    user = relationship("User", back_populates="leaderboard_entry")


class Friends(Base):
    __tablename__ = "friends"

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    friend_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="friends")
    friend = relationship(
        "User", foreign_keys=[friend_id], back_populates="friended_by"
    )


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
    country = Column(String(100))
    points_required = Column(Integer, nullable=False)

    # Relationships
    category = relationship("Category", backref="achievements")
    users = relationship("UserAchievement", back_populates="achievement")


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    achievement_id = Column(
        Integer, ForeignKey("achievements.id", ondelete="CASCADE"), primary_key=True
    )
    earned_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="users")
