from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
import crud
import models
import schemas
from dependencies import get_db, get_current_user, get_current_admin_user
from datetime import datetime
from pathlib import Path
import logging

# Setup directories
IMAGES_DIR = Path("images")
IMAGES_DIR.mkdir(exist_ok=True)

router = APIRouter(
    prefix="/api/locations/pending",
    tags=["pending_locations"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)


@router.post("/", response_model=schemas.PendingLocation)
async def create_pending_location(
    name: str = Form(...),
    description: str = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    category_id: int = Form(...),
    difficulty_level: str = Form(...),
    country: str = Form(...),
    region: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a new pending location submission."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    # Save the image
    file_name = f"{datetime.now().timestamp()}_{image.filename}"
    file_path = IMAGES_DIR / file_name

    with open(file_path, "wb") as buffer:
        buffer.write(await image.read())

    # Create location data
    location_data = schemas.PendingLocationCreate(
        name=name,
        description=description,
        latitude=latitude,
        longitude=longitude,
        category_id=category_id,
        difficulty_level=difficulty_level,
        country=country,
        region=region,
        image_url=file_name,
        status="pending",
    )

    return crud.create_pending_location(
        db=db, location=location_data, user_id=current_user.id
    )


@router.get("/", response_model=List[schemas.PendingLocation])
def get_pending_locations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user),
):
    """Get all pending location submissions (admin only)."""
    try:
        if not current_user or not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view pending locations",
            )
        return crud.get_pending_locations(db=db)
    except Exception as e:
        logger.error(f"Error fetching pending locations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching pending locations",
        )


@router.post("/{location_id}/approve", response_model=schemas.Location)
def approve_pending_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user),
):
    """Approve a pending location and move it to the main locations table (admin only)."""
    logger.info(f"Attempting to approve location {location_id}")
    try:
        result = crud.approve_pending_location(db=db, location_id=location_id)
        logger.info(f"Successfully approved location {location_id}")
        return result
    except Exception as e:
        logger.error(f"Error approving location {location_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error approving location: {str(e)}",
        )


@router.delete("/{location_id}")
def reject_pending_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user),
):
    """Reject and delete a pending location (admin only)."""
    logger.info(f"Attempting to reject location {location_id}")
    try:
        result = crud.reject_pending_location(db=db, location_id=location_id)
        logger.info(f"Successfully rejected location {location_id}")
        return {"message": "Location rejected successfully"}
    except Exception as e:
        logger.error(f"Error rejecting location {location_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error rejecting location: {str(e)}",
        )
