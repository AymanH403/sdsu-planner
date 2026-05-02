# SDSU Planner Starter

This project is a starter for an SDSU-first CPA planning tracker.

## What is included

- Next.js frontend refactored into components
- localStorage persistence
- SDSU course JSON loading
- draggable bucket board
- FastAPI backend starter
- Python catalog refresh and audit scripts

## Frontend setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at http://127.0.0.1:8000

## Refresh SDSU catalog JSON

From the project root:

```bash
python scripts/refresh_sdsu_catalog.py
```

## Notes

- Frontend currently reads `data/sdsu_courses.json`
- Backend is a starter scaffold and uses in-memory storage for routes
- Replace transfer examples with real data later
