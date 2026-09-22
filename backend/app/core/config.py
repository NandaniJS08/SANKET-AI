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
    ML_ENGINE_PATH: str = os.getenv(
        "ML_ENGINE_PATH",
        str(ROOT_DIR / "ai_engine")
    )

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
