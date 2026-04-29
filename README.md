# 🍽️ La Maison Dorée — System Rezerwacji Stolików

Aplikacja webowa do rezerwacji stolików w restauracji. Backend: FastAPI + PostgreSQL, Frontend: React + Vite, z obsługą trybu offline via IndexedDB.


## 📐 Architektura systemu

```
┌────────────────────────────────────────────────────────────────┐
│                        PRZEGLĄDARKA                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   React (Vite)                          │   │
│  │  Strony: Home / Logowanie / Rejestracja / Terminy /     │   │
│  │          Nowa rezerwacja / Moje rezerwacje              │   │
│  │                                                         │   │
│  │  axios ──► JWT Bearer Token ──► FastAPI                 │   │
│  │  IndexedDB (idb) ──► Tryb offline                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                              │ HTTP REST
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      FastAPI (Python)                          │
│  /auth/register  POST  – rejestracja użytkownika               │
│  /auth/login     POST  – logowanie → zwraca JWT                │
│  /auth/me        GET   – dane zalogowanego (wymaga JWT)        │
│  /restaurant     GET   – publiczne info o restauracji          │
│  /slots          GET   – wolne terminy (filtr: data, osoby)    │
│  /reservations   POST  – nowa rezerwacja (wymaga JWT)          │
│  /reservations/me GET  – moje rezerwacje (wymaga JWT)          │
│  /reservations/{id} DELETE – anuluj rezerwację (wymaga JWT)    │
└────────────────────────────────────────────────────────────────┘
                              │ SQLAlchemy ORM
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                PostgreSQL (baza centralna)                     │
│  users ──── reservations ──── slots ──── tables                │
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
