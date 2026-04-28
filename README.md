# 🍽️ La Maison Dorée — System Rezerwacji Stolików

Aplikacja webowa do rezerwacji stolików w restauracji. Backend: FastAPI + PostgreSQL, Frontend: React + Vite, z obsługą trybu offline via IndexedDB.

---

## 📐 Architektura systemu

```
┌────────────────────────────────────────────────────────────────┐
│                        PRZEGLĄDARKA                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   React (Vite)                          │  │
│  │  Strony: Home / Logowanie / Rejestracja / Terminy /    │  │
│  │          Nowa rezerwacja / Moje rezerwacje              │  │
│  │                                                         │  │
│  │  axios ──► JWT Bearer Token ──► FastAPI                │  │
│  │  IndexedDB (idb) ──► Tryb offline                      │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │ HTTP REST
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      FastAPI (Python)                          │
│  /auth/register  POST  – rejestracja użytkownika              │
│  /auth/login     POST  – logowanie → zwraca JWT               │
│  /auth/me        GET   – dane zalogowanego (wymaga JWT)        │
│  /restaurant     GET   – publiczne info o restauracji          │
│  /slots          GET   – wolne terminy (filtr: data, osoby)    │
│  /reservations   POST  – nowa rezerwacja (wymaga JWT)          │
│  /reservations/me GET  – moje rezerwacje (wymaga JWT)          │
│  /reservations/{id} DELETE – anuluj rezerwację (wymaga JWT)   │
└────────────────────────────────────────────────────────────────┘
                              │ SQLAlchemy ORM
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                PostgreSQL (baza centralna)                     │
│  users ──── reservations ──── slots ──── tables               │
└────────────────────────────────────────────────────────────────┘
```

## 🗄️ Schemat bazy danych

```
users
  id, email, full_name, hashed_password, google_id, is_active, created_at

tables
  id, number, capacity, location, is_active

slots
  id, table_id→tables, start_time, end_time, is_available

reservations
  id, user_id→users, table_id→tables, slot_id→slots,
  party_size, special_requests, status, created_at
```

---

## 🚀 Uruchomienie (Docker — zalecane)

### Wymagania
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

### Krok 1 — Sklonuj repozytorium
```bash
git clone https://github.com/TWOJ_USERNAME/restaurant-reservation.git
cd restaurant-reservation
```

### Krok 2 — Uruchom aplikację
```bash
docker compose up --build
```

Po chwili:
| Usługa | URL |
|--------|-----|
| **Frontend** | http://localhost |
| **Backend API** | http://localhost:8000 |
| **Dokumentacja API** | http://localhost:8000/docs |

---

## 💻 Uruchomienie lokalne (bez Dockera)

### Backend
```bash
cd backend

# Utwórz wirtualne środowisko
python -m venv venv
source venv/bin/activate       # Linux/Mac
venv\Scripts\activate          # Windows

# Zainstaluj zależności
pip install -r requirements.txt

# Ustaw zmienne środowiskowe
export DATABASE_URL="postgresql://restaurant_user:restaurant_pass@localhost:5432/restaurant_db"
export SECRET_KEY="moj-tajny-klucz"

# Uruchom serwer
uvicorn main:app --reload
# API dostępne na: http://localhost:8000
```

### Frontend
```bash
cd frontend

npm install

# Ustaw URL backendu
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev
# Frontend dostępny na: http://localhost:3000
```

---

## 📁 Struktura projektu

```
restaurant-reservation/
├── backend/
│   ├── main.py            # FastAPI app, startup, seeding
│   ├── database.py        # SQLAlchemy engine + session
│   ├── models.py          # ORM modele: User, Table, Slot, Reservation
│   ├── schemas.py         # Pydantic schemas (walidacja danych)
│   ├── auth.py            # JWT: tworzenie/weryfikacja tokenów, bcrypt
│   ├── routers/
│   │   ├── auth.py        # POST /auth/register, /auth/login, GET /auth/me
│   │   ├── slots.py       # GET /slots
│   │   └── reservations.py # POST/GET/DELETE /reservations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js  # axios z auto-JWT injection
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── offline/
│   │   │   └── db.js      # IndexedDB via idb (tryb offline)
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Slots.jsx
│   │   │   ├── NewReservation.jsx
│   │   │   └── Reservations.jsx  # sync online/offline
│   │   ├── store/
│   │   │   └── AuthContext.jsx   # React Context + JWT
│   │   ├── App.jsx        # Router + layout
│   │   ├── main.jsx
│   │   └── index.css      # Design system
│   ├── package.json
│   ├── vite.config.js
│   ├── nginx.conf         # Nginx dla produkcji
│   └── Dockerfile
│
├── docker-compose.yml      # Produkcja
├── docker-compose.dev.yml  # Development (hot reload)
└── README.md
```

---

## 🔐 Uwierzytelnianie JWT

1. Użytkownik wysyła `POST /auth/login` z email + hasło
2. Backend weryfikuje hasło (bcrypt) i zwraca **JWT token** (ważny 24h)
3. Frontend zapisuje token w `localStorage`
4. Każde zapytanie do chronionych endpointów zawiera nagłówek:
   ```
   Authorization: Bearer <token>
   ```
5. Backend dekoduje token, sprawdza `user_id` i autoryzuje dostęp

---

## 📴 Tryb offline

1. Po zalogowaniu, rezerwacje są pobierane z serwera i **zapisywane w IndexedDB** (lokalna baza przeglądarki)
2. Gdy użytkownik traci połączenie → dane wyświetlane z IndexedDB
3. Gdy połączenie wraca → automatyczna synchronizacja z serwerem
4. Widoczny baner "Tryb offline" informuje użytkownika o stanie połączenia

---

## 🔌 Przykłady zapytań API

### Rejestracja
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "full_name": "Jan Kowalski", "password": "haslo123"}'
```

### Logowanie
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "haslo123"}'
# Zwraca: {"access_token": "eyJ...", "token_type": "bearer"}
```

### Pobierz wolne terminy
```bash
curl "http://localhost:8000/slots?date=2025-05-01&party_size=2"
```

### Stwórz rezerwację (wymaga JWT)
```bash
curl -X POST http://localhost:8000/reservations \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"slot_id": 5, "party_size": 2, "special_requests": "Urodziny"}'
```

### Anuluj rezerwację
```bash
curl -X DELETE http://localhost:8000/reservations/1 \
  -H "Authorization: Bearer eyJ..."
```

---

## 📤 Wdrożenie na GitHub

```bash
# 1. Zainicjuj Git
git init
git add .
git commit -m "feat: initial restaurant reservation app"

# 2. Utwórz repo na github.com i skopiuj URL, np:
git remote add origin https://github.com/TWOJ_USERNAME/restaurant-reservation.git
git branch -M main
git push -u origin main
```

---

## 🛠️ Technologie

| Warstwa | Technologia |
|---------|-------------|
| Backend | Python 3.11, FastAPI, SQLAlchemy, Alembic |
| Uwierzytelnianie | JWT (python-jose), bcrypt (passlib) |
| Baza centralna | PostgreSQL 16 |
| Baza lokalna | IndexedDB (idb library) |
| Frontend | React 18, React Router 6, Vite 5 |
| HTTP | Axios z interceptorami JWT |
| Stylowanie | CSS Variables, własny design system |
| Infrastruktura | Docker, Docker Compose, Nginx |
