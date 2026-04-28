from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os

from database import engine, get_db, Base
import models, schemas
from routers import auth, slots, reservations

# ─── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Restaurant Reservation API",
    description="REST API for managing restaurant table reservations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Routers ──────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(slots.router)
app.include_router(reservations.router)


# ─── Root & Info ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {"message": "Restaurant Reservation API is running", "docs": "/docs"}


@app.get("/restaurant", response_model=schemas.RestaurantInfo, tags=["Restaurant"])
def get_restaurant_info():
    """Get general information about the restaurant (public endpoint)."""
    return {
        "name": "La Maison Dorée",
        "description": "A sophisticated dining experience where French culinary tradition meets modern innovation. Our chefs craft every dish with seasonal ingredients sourced from local farms.",
        "address": "ul. Świdnicka 22, 50-068 Wrocław",
        "phone": "+48 71 123 456 789",
        "email": "contact@lamaisondoree.pl",
        "opening_hours": {
            "Monday": "Closed",
            "Tuesday": "12:00 - 22:00",
            "Wednesday": "12:00 - 22:00",
            "Thursday": "12:00 - 22:00",
            "Friday": "12:00 - 23:00",
            "Saturday": "11:00 - 23:00",
            "Sunday": "11:00 - 21:00",
        },
        "cuisine": "French Bistro",
        "rating": 4.8,
    }


# ─── DB Init & Seed ───────────────────────────────────────────────────────────
def seed_database(db: Session):
    """Seed database with initial tables and slots if empty."""
    if db.query(models.Table).count() > 0:
        return  # Already seeded

    # Create tables
    tables_data = [
        {"number": 1, "capacity": 2, "location": "Window"},
        {"number": 2, "capacity": 2, "location": "Window"},
        {"number": 3, "capacity": 4, "location": "Main Hall"},
        {"number": 4, "capacity": 4, "location": "Main Hall"},
        {"number": 5, "capacity": 6, "location": "Main Hall"},
        {"number": 6, "capacity": 6, "location": "Terrace"},
        {"number": 7, "capacity": 8, "location": "Terrace"},
        {"number": 8, "capacity": 4, "location": "Private Room"},
    ]
    db_tables = []
    for t in tables_data:
        table = models.Table(**t)
        db.add(table)
        db_tables.append(table)
    db.flush()

    # Generate slots for next 14 days
    now = datetime.utcnow()
    slot_hours = [12, 13, 14, 15, 18, 19, 20, 21]  # Lunch: 12-15, Dinner: 18-21

    for day_offset in range(0, 14):
        slot_date = now + timedelta(days=day_offset)
        for table in db_tables:
            for hour in slot_hours:
                start = slot_date.replace(hour=hour, minute=0, second=0, microsecond=0)
                if start > now:  # Only future slots
                    slot = models.Slot(
                        table_id=table.id,
                        start_time=start,
                        end_time=start + timedelta(hours=1, minutes=30),
                        is_available=True,
                    )
                    db.add(slot)

    db.commit()
    print("✅ Database seeded successfully")


@app.on_event("startup")
def startup_event():
    """Create tables and seed data on startup."""
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()
    print("🚀 API Server started")
