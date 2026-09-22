# SANKET-AI — Backend Platform

Explainable AI-powered Infrastructure Project Risk Prediction & Monitoring Platform  
**Smart India Hackathon 2026** | Problem Statement: `SIH26103`

---

## 1. Overview

The SANKET-AI backend is a **modular monolith** built with FastAPI and Supabase PostgreSQL. It serves as the institutional gateway for infrastructure project monitoring, multi-target machine learning risk prediction, TreeSHAP feature attributions, early-warning signals, intervention tracking, and portfolio analytics.

---

## 2. Architecture & Data Flow

```
Frontend (React/Vite)
       │
       ▼  HTTP / REST
FastAPI App (backend/app/main.py)
       │
       ▼
Routes (app/routes/)
       │
       ▼
Services (app/services/)
       ├──► Supabase PostgreSQL & Auth (app/db/supabase.py)
       └──► AI/ML Engine Bridge (ai_engine/src/predict.py)
```

- **Routes (`app/routes/`)**: Pure HTTP transport layer, request parsing, and response status mapping.
- **Services (`app/services/`)**: Business orchestration, data retrieval, and AI model inference triggering.
- **Core (`app/core/`)**: Configuration settings and Supabase Auth token verification.
- **DB (`app/db/`)**: Thread-safe Supabase client singleton.

---

## 3. Directory Structure

```
backend/
├── README.md
├── requirements.txt
├── .env.example
├── run.py
└── app/
    ├── main.py
    ├── core/
    │   ├── config.py
    │   └── auth.py
    ├── db/
    │   └── supabase.py
    ├── routes/
    │   ├── auth.py
    │   ├── projects.py
    │   ├── predictions.py
    │   ├── warnings.py
    │   ├── actions.py
    │   └── analytics.py
    └── services/
        ├── projects.py
        ├── predictions.py
        ├── warnings.py
        ├── actions.py
        └── analytics.py
```

---

## 4. Technology Stack

- **Framework:** FastAPI (Python 3.10+)
- **Server:** Uvicorn (ASGI)
- **Database & Auth Authority:** Supabase (PostgreSQL + Supabase Auth)
- **Validation:** Pydantic v2
- **Data & ML Processing:** Pandas, NumPy, Scikit-learn, Joblib, SHAP

---

## 5. Environment Configuration

Copy `.env.example` to `backend/.env` and supply local credentials:

```bash
cp .env.example .env
```

Key variables:
- `SUPABASE_URL`: Supabase project URL (`https://<project-ref>.supabase.co`)
- `SUPABASE_KEY`: Supabase API key
- `ML_ENGINE_PATH`: Path to the AI engine directory (`../ai_engine`)
- `PORT`: Service port (default: `8000`)
- `HOST`: Service host (default: `0.0.0.0`)
- `ENVIRONMENT`: Runtime mode (`development` / `production`)
- `CORS_ORIGINS`: JSON array of allowed origins

> [!NOTE]
> Authentication is handled via **Supabase Auth**. FastAPI validates the Supabase-issued Bearer token without custom JWT signing keys.

---

## 6. Running Locally

1. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate      # Windows
   # source .venv/bin/activate  # Linux / macOS
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the development server:
   ```bash
   python run.py
   ```
   Or via Uvicorn directly:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. Interactive API Documentation:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

---

## 7. API Base Path & Endpoints

All application routes are prefixed under `/api/v1`:

- `GET /health` — Gateway status and database probe
- `GET /api/v1/auth/me` — Authenticated user context
- `GET /api/v1/projects/` — Project registry and filters
- `GET /api/v1/predictions/{project_id}` — ML risk inference and SHAP attributions
- `GET /api/v1/warnings/` — Early-warning signals and thresholds
- `GET /api/v1/actions/` — Administrative interventions and action log
- `GET /api/v1/analytics/overview` — Macro portfolio risk analytics

---

## 8. Supabase & AI Engine Boundaries

- **Database Authority:** The existing Supabase PostgreSQL instance is the sole source of truth. No local DDL or table migrations are run by the backend.
- **Authentication Authority:** Supabase Auth issues and manages user sessions; the backend enforces application-level roles (`POLICYMAKER`, `ADMINISTRATOR`, `MONITORING_OFFICER`).
- **AI/ML Engine Boundary:** `ai_engine/` contains trained Random Forest models and TreeSHAP explainer pipelines. The backend bridges to `ai_engine/src/predict.py` without modifying model files.

---

## 9. Development Status

- Structure: Refactored clean modular monolith.
- Auth / RBAC / Domain APIs: Pending progressive step-by-step implementation.
- Legacy Archive: Preserved at `legacy_backend/`.
