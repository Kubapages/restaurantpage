from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Optional

from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/slots", tags=["Slots"])


@router.get("", response_model=List[schemas.SlotOut])
def get_available_slots(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    party_size: Optional[int] = Query(None, description="Minimum table capacity"),
    db: Session = Depends(get_db),
):
    """Get all available reservation slots, optionally filtered by date and party size."""
    query = db.query(models.Slot).join(models.Table).filter(
        models.Slot.is_available == True,
        models.Table.is_active == True,
        models.Slot.start_time >= datetime.utcnow()
    )

    if date:
        try:
            filter_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(
                models.Slot.start_time >= datetime.combine(filter_date, datetime.min.time()),
                models.Slot.start_time < datetime.combine(filter_date, datetime.max.time()),
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if party_size:
        query = query.filter(models.Table.capacity >= party_size)

    return query.order_by(models.Slot.start_time).all()


@router.get("/{slot_id}", response_model=schemas.SlotOut)
def get_slot(slot_id: int, db: Session = Depends(get_db)):
    """Get a single slot by ID."""
    slot = db.query(models.Slot).filter(models.Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    return slot
