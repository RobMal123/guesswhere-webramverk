import models
import schemas
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from fastapi import HTTPException, status

# ... (keep your existing crud functions) ...


def get_or_create_game_result(
    db: Session, user_id: int, category: str, total_score: int
) -> models.GameResult:
    # Try to find existing result
    game_result = (
        db.query(models.GameResult)
        .filter(
            models.GameResult.user_id == user_id, models.GameResult.category == category
        )
        .first()
    )

    if game_result:
        # Update existing result
        game_result.total_score += total_score
        game_result.games_played += 1
        db.commit()
        db.refresh(game_result)
    else:
        # Create new result
        game_result = models.GameResult(
            user_id=user_id, category=category, total_score=total_score, games_played=1
        )
        db.add(game_result)
        db.commit()
        db.refresh(game_result)

    return game_result


def get_leaderboard(db: Session, category: Optional[str] = None) -> List[dict]:
    query = db.query(models.GameResult, models.User.username).join(
        models.User, models.GameResult.user_id == models.User.id
    )

    if category and category != "all":
        query = query.filter(models.GameResult.category == category)

    results = query.all()

    leaderboard_data = []
    for result, username in results:
        average_score = (result.total_score / (result.games_played * 5)) * 100
        leaderboard_data.append(
            {
                "id": result.id,
                "username": username,
                "total_score": result.total_score,
                "games_played": result.games_played,
                "average_score": round(average_score, 2),
            }
        )

    # Sort by average score descending
    leaderboard_data.sort(key=lambda x: x["average_score"], reverse=True)
    return leaderboard_data


def create_pending_location(
    db: Session, location: schemas.PendingLocationCreate, user_id: int
) -> models.PendingLocation:
    """Create a new pending location submission."""
    location_dict = location.dict()
    location_dict["user_id"] = user_id
    db_location = models.PendingLocation(**location_dict)
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location


def get_pending_locations(db: Session) -> List[models.PendingLocation]:
    """Get all pending location submissions."""
    return (
        db.query(models.PendingLocation)
        .filter(models.PendingLocation.status == "pending")
        .all()
    )


def approve_pending_location(db: Session, location_id: int) -> models.Location:
    """Approve a pending location and move it to the main locations table."""
    # Get the pending location
    pending_location = (
        db.query(models.PendingLocation)
        .filter(
            models.PendingLocation.id == location_id,
            models.PendingLocation.status == "pending",
        )
        .first()
    )

    if not pending_location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pending location not found"
        )

    # Create new location from pending location data
    location_data = {
        "image_url": pending_location.image_url,
        "latitude": pending_location.latitude,
        "longitude": pending_location.longitude,
        "name": pending_location.name,
        "description": pending_location.description,
        "category_id": pending_location.category_id,
        "difficulty_level": pending_location.difficulty_level,
        "country": pending_location.country,
        "region": pending_location.region,
    }

    new_location = models.Location(**location_data)
    db.add(new_location)

    # Update pending location status
    pending_location.status = "approved"

    db.commit()
    db.refresh(new_location)
    return new_location


def reject_pending_location(db: Session, location_id: int) -> bool:
    """Reject and delete a pending location."""
    pending_location = (
        db.query(models.PendingLocation)
        .filter(
            models.PendingLocation.id == location_id,
            models.PendingLocation.status == "pending",
        )
        .first()
    )

    if not pending_location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pending location not found"
        )

    # Update status to rejected
    pending_location.status = "rejected"
    db.commit()
    return True
