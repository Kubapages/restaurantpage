from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


# ─── Auth Schemas ────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Table Schemas ────────────────────────────────────────────────────────────
class TableOut(BaseModel):
    id: int
    number: int
    capacity: int
    location: str

    class Config:
        from_attributes = True


# ─── Slot Schemas ─────────────────────────────────────────────────────────────
class SlotOut(BaseModel):
    id: int
    table_id: int
    start_time: datetime
    end_time: datetime
    is_available: bool
    table: TableOut

    class Config:
        from_attributes = True


# ─── Reservation Schemas ──────────────────────────────────────────────────────
class ReservationCreate(BaseModel):
    slot_id: int
    party_size: int
    special_requests: Optional[str] = None

class ReservationOut(BaseModel):
    id: int
    user_id: int
    table_id: int
    slot_id: int
    party_size: int
    special_requests: Optional[str]
    status: str
    created_at: datetime
    slot: SlotOut
    table: TableOut

    class Config:
        from_attributes = True


# ─── Restaurant Info Schema ───────────────────────────────────────────────────
class RestaurantInfo(BaseModel):
    name: str
    description: str
    address: str
    phone: str
    email: str
    opening_hours: dict
    cuisine: str
    rating: float
