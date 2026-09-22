"""
SANKET-AI Backend Configuration
Loads settings from local environment / .env file.
"""

import json
import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
ROOT_DIR = BASE_DIR.parent

backend_env = BASE_DIR / ".env"
root_env = ROOT_DIR / ".env"

if backend_env.is_file():
    load_dotenv(dotenv_path=backend_env)
elif root_env.is_file():
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()


class Settings:
    PROJECT_NAME: str = "SANKET-AI Platform Backend"
    VERSION: str = "2.0.0"
    
    # Server Settings
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Supabase Connection & Auth
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    # AI/ML Engine Integration Path
    # Checks multiple candidate locations so it works on:
    # - Local dev (ROOT_DIR/Ai_engine)
    # - Vercel monorepo root deployment (/var/task/Ai_engine)
    # - Any path set explicitly via ML_ENGINE_PATH env var
    @property
    def ML_ENGINE_PATH(self) -> str:
        env_val = os.getenv("ML_ENGINE_PATH", "")
        if env_val:
            return env_val
        # Try candidates in priority order
        candidates = [
            ROOT_DIR / "Ai_engine",          # monorepo root/Ai_engine  (local + Vercel root deploy)
            ROOT_DIR / "ai_engine",          # lowercase fallback
            BASE_DIR / "Ai_engine",          # backend/Ai_engine (unlikely but safe)
            Path("/var/task/Ai_engine"),     # Vercel absolute path
        ]
        for c in candidates:
            if c.exists():
                return str(c)
        # Return the most likely path even if it doesn't exist yet; the init log will show the error
        return str(ROOT_DIR / "Ai_engine")

    # Gemini LLM Integration for AI Assistant
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")


    # CORS Origins
    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "")
        if raw:
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [origin.strip() for origin in raw.split(",") if origin.strip()]
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000"
        ]

    def is_supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL.strip() and self.SUPABASE_KEY.strip())


settings = Settings()
