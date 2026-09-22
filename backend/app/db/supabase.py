"""
SANKET-AI Supabase Client Foundation
Provides thread-safe singleton access to the Supabase client.
"""

import threading
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

_thread_local = threading.local()


def get_supabase() -> Client:
    """
    Returns the Supabase client instance using thread-local storage to prevent
    [WinError 10035] socket blocking issues across FastAPI sync threadpools on Windows.
    Raises RuntimeError if SUPABASE_URL or SUPABASE_KEY are not configured.
    """
    client = getattr(_thread_local, "client", None)
    if client is not None:
        return client

    if not settings.is_supabase_configured():
        raise RuntimeError(
            "Supabase client cannot be initialized: SUPABASE_URL and/or SUPABASE_KEY "
            "are not configured. Please supply them in backend/.env"
        )

    try:
        new_client = create_client(settings.SUPABASE_URL.strip(), settings.SUPABASE_KEY.strip())
        _thread_local.client = new_client
        return new_client
    except Exception as exc:
        raise RuntimeError(
            f"Failed to initialize Supabase client: {type(exc).__name__}: {str(exc).split('?')[0]}"
        ) from exc


def get_supabase_optional() -> Optional[Client]:
    """
    Returns the Supabase client if configured, otherwise None.
    Safe for non-blocking health checks.
    """
    try:
        return get_supabase()
    except Exception:
        return None
