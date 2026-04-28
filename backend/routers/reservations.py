from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/reservations", tags=["Reservations"])
def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.post("", response_model=schemas.ReservationOut, status_code=201)
def create_reservation(
    data: schemas.ReservationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a new reservation for the authenticated user."""
    # Verify slot exists and is available
    slot = db.query(models.Slot).filter(models.Slot.id == data.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if not slot.is_available:
        raise HTTPException(status_code=409, detail="This slot is no longer available")
    if _as_utc(slot.start_time) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cannot reserve a past slot")

    # Verify party size fits at table
    table = db.query(models.Table).filter(models.Table.id == slot.table_id).first()
    if data.party_size > table.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Party size {data.party_size} exceeds table capacity {table.capacity}"
        )

    # Create reservation and mark slot unavailable
    reservation = models.Reservation(
        user_id=current_user.id,
        table_id=slot.table_id,
        slot_id=slot.id,
        party_size=data.party_size,
        special_requests=data.special_requests,
        status="active",
    )
    slot.is_available = False

    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


@router.get("/me", response_model=List[schemas.ReservationOut])
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get all reservations for the authenticated user."""
    return (
        db.query(models.Reservation)
        .filter(models.Reservation.user_id == current_user.id)
        .order_by(models.Reservation.created_at.desc())
        .all()
    )


@router.get("/{reservation_id}", response_model=schemas.ReservationOut)
def get_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get a specific reservation (only owner can access)."""
    reservation = db.query(models.Reservation).filter(
        models.Reservation.id == reservation_id,
        models.Reservation.user_id == current_user.id,
    ).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return reservation


@router.delete("/{reservation_id}", status_code=204)
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Cancel a reservation. Frees the slot back for booking."""
    reservation = db.query(models.Reservation).filter(
        models.Reservation.id == reservation_id,
        models.Reservation.user_id == current_user.id,
    ).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if reservation.status != "active":
        raise HTTPException(status_code=400, detail="Only active reservations can be cancelled")

    # Check if cancellation is allowed (not in the past)
    slot = db.query(models.Slot).filter(models.Slot.id == reservation.slot_id).first()
    if slot and _as_utc(slot.start_time) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cannot cancel a past reservation")

    reservation.status = "cancelled"
    if slot:
        slot.is_available = True  # Free slot back up

    db.commit()
    return None
