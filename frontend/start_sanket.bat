@echo off
echo ===================================================
echo   Starting MoSPI SANKET-AI Full-Stack Platform
echo ===================================================
echo.
echo [1/2] Starting Python FastAPI Backend on port 8000...
start "SANKET Backend (FastAPI)" cmd /k "python backend/run.py"

echo [2/2] Starting React Vite Frontend on port 5173...
start "SANKET Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo  All Services Running:
echo  - Frontend: http://localhost:5173
echo  - Backend API: http://localhost:8000
echo  - Swagger Docs: http://localhost:8000/docs
echo  - Database: Supabase Cloud (Managed PostgreSQL)
echo ===================================================
pause
