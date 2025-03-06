import models
import schemas
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

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
