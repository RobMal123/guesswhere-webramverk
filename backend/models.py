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
    UniqueConstraint,
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
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String, unique=True, nullable=True)
    verification_token_expires = Column(DateTime(timezone=True), nullable=True)
    reset_token = Column(String, unique=True, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
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


class PendingLocation(Base):
    __tablename__ = "pending_locations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    image_url = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
    difficulty_level = Column(
        SQLAlchemyEnum(DifficultyLevel), nullable=False, default=DifficultyLevel.MEDIUM
    )
    country = Column(String(100))
    region = Column(String(100))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    status = Column(
        SQLAlchemyEnum(
            "pending", "approved", "rejected", name="pending_location_status"
        ),
        default="pending",
    )

    # Relationships
    user = relationship("User")
    category = relationship("Category")

    def get_full_image_url(self):
        """Return the full image URL path."""
        return f"images/{self.image_url}"


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

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


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True)
    challenger_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    challenged_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    status = Column(
        SQLAlchemyEnum(
            "pending", "accepted", "in_progress", "completed", name="challenge_status"
        ),
        default="pending",
    )
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    completed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    winner_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    current_round = Column(Integer, default=1)

    # Relationships
    challenger = relationship(
        "User", foreign_keys=[challenger_id], backref="sent_challenges"
    )
    challenged = relationship(
        "User", foreign_keys=[challenged_id], backref="received_challenges"
    )
    winner = relationship("User", foreign_keys=[winner_id])
    locations = relationship("ChallengeLocation", back_populates="challenge")
    scores = relationship("ChallengeScore", back_populates="challenge")


class ChallengeLocation(Base):
    __tablename__ = "challenge_locations"

    id = Column(Integer, primary_key=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"))
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"))
    order_index = Column(Integer, nullable=False)  # Position 1-5 in the challenge

    # Relationships
    challenge = relationship("Challenge", back_populates="locations")
    location = relationship("Location")

    # Unique constraint to ensure no duplicate locations in a challenge
    __table_args__ = (UniqueConstraint("challenge_id", "order_index"),)


class ChallengeScore(Base):
    __tablename__ = "challenge_scores"

    id = Column(Integer, primary_key=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"))
    score = Column(Integer, nullable=False)
    time_taken = Column(Integer, nullable=False)  # In seconds
    distance = Column(Float, nullable=False)  # Distance in km
    guess_latitude = Column(Float, nullable=False)
    guess_longitude = Column(Float, nullable=False)
    round_number = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    challenge = relationship("Challenge", back_populates="scores")
    user = relationship("User")
    location = relationship("Location")

    # Unique constraint to ensure one score per user per location in a challenge
    __table_args__ = (UniqueConstraint("challenge_id", "user_id", "location_id"),)


class GameResult(Base):
    __tablename__ = "game_results"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    category = Column(String(50), nullable=False)
    total_score = Column(Integer, nullable=False, default=0)
    games_played = Column(Integer, nullable=False, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationship
    user = relationship("User")
