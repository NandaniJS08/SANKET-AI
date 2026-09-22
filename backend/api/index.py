"""
Vercel ASGI entry point for SANKET-AI Backend.
Vercel requires the app object to be importable from this file.
"""
import sys
import os
from pathlib import Path

# Add backend/ to sys.path so 'app' package is importable
_backend_dir = Path(__file__).resolve().parent.parent  # backend/api/../ = backend/
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

# Import the FastAPI app
from app.main import app  # noqa: F401 — Vercel picks up 'app' from this module
