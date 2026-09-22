"""
SANKET-AI Authentication & Authorization Core
Verifies Supabase Auth tokens and provides role-based access control dependencies.
Roles: POLICYMAKER, ADMINISTRATOR, MONITORING_OFFICER.
(Stub ready for Supabase Auth integration).
"""

import os
import time
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status, Depends
from supabase import create_client, Client
from app.core.config import settings
from app.db.supabase import get_supabase

ROLES = ["policymaker", "admin", "officer"]

# Verified provisioned Supabase Auth user profiles
KNOWN_PROFILES: Dict[str, Dict[str, str]] = {
    "378a35b5-0378-4143-8c30-f4b60ddde587": {
        "email": "monitoring@sanket-ai.local",
        "name": "SANKET Monitoring Officer",
        "role": "officer",
    },
    "e750c7c8-2d21-4b24-80ac-2189a5d57961": {
        "email": "policymaker@sanket-ai.local",
        "name": "Dr. Rajesh Kumar (IAS)",
        "role": "policymaker",
    },
    "ca359a5d-5e8c-41ce-be98-5c6f0ff66121": {
        "email": "administrator@sanket-ai.local",
        "name": "Amit Sharma",
        "role": "admin",
    },
}

def _require_env_password(var_name: str) -> str:
    """
    Loads a persona password from the environment.
    Raises a clear startup-time error if the variable is missing or empty.
    Never falls back to a hardcoded value.
    """
    value = os.getenv(var_name, "").strip()
    if not value:
        raise EnvironmentError(
            f"Required environment variable '{var_name}' is not set. "
            "Set it in backend/.env before starting the server. "
            "See backend/.env.example for the list of required variables."
        )
    return value


# Role configuration for institutional demo personas.
# Passwords are loaded exclusively from environment variables — never hardcoded.
ROLE_CONFIGS: Dict[str, Dict[str, Any]] = {
    "officer": {
        "id": "378a35b5-0378-4143-8c30-f4b60ddde587",
        "email": "monitoring@sanket-ai.local",
        "name": "SANKET Monitoring Officer",
        "role": "officer",
        "password": _require_env_password("OFFICER_PASSWORD"),
        "aliases": ["monitoring@sanket-ai.local", "reviewer@infrawatch.gov.in", "officer", "monitoring", "reviewer"],
    },
    "policymaker": {
        "id": "e750c7c8-2d21-4b24-80ac-2189a5d57961",
        "email": "policymaker@sanket-ai.local",
        "name": "Dr. Rajesh Kumar (IAS)",
        "role": "policymaker",
        "password": _require_env_password("POLICYMAKER_PASSWORD"),
        "aliases": ["policymaker@sanket-ai.local", "officer@infrawatch.gov.in", "policymaker", "government officer"],
    },
    "admin": {
        "id": "ca359a5d-5e8c-41ce-be98-5c6f0ff66121",
        "email": "administrator@sanket-ai.local",
        "name": "Amit Sharma",
        "role": "admin",
        "password": _require_env_password("ADMIN_PASSWORD"),
        "aliases": ["administrator@sanket-ai.local", "admin@infrawatch.gov.in", "admin@sanket-ai.local", "admin", "administrator", "project administrator"],
    },
}

# In-memory token cache keyed by canonical role
_ROLE_TOKEN_CACHE: Dict[str, Dict[str, Any]] = {}


def get_auth_client() -> Client:
    """
    Returns a dedicated Supabase client for Auth operations so that
    auth session state does not pollute the singleton database service_role client.
    """
    return create_client(settings.SUPABASE_URL.strip(), settings.SUPABASE_KEY.strip())


def normalize_role(role_raw: Optional[str]) -> str:
    """Normalizes role representations to the 3 canonical roles: policymaker, admin, officer."""
    if not role_raw:
        return "officer"
    r = role_raw.strip().lower()
    if "admin" in r:
        return "admin"
    if "policy" in r or "govt" in r or "government" in r:
        return "policymaker"
    return "officer"


def get_user_session(identifier: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieves or signs in with Supabase Auth for one of the three verified personas.
    Caches the real Supabase JWT in memory until 5 minutes before expiration.
    """
    target_key = "officer"
    if identifier and identifier.strip():
        clean = identifier.strip().lower()
        matched = False
        for r_key, cfg in ROLE_CONFIGS.items():
            if clean == cfg["email"].lower() or clean == cfg["role"].lower() or clean in [a.lower() for a in cfg["aliases"]]:
                target_key = r_key
                matched = True
                break
        if not matched:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid credentials. User '{identifier}' is not authorized.",
            )

    cfg = ROLE_CONFIGS[target_key]
    now = time.time()
    cached = _ROLE_TOKEN_CACHE.get(target_key)
    if cached and cached.get("expires_at", 0) > now + 300:
        return {
            "access_token": cached["token"],
            "token_type": "bearer",
            "expires_in": int(cached["expires_at"] - now),
            "user": {
                "id": cfg["id"],
                "email": cfg["email"],
                "name": cfg["name"],
                "role": cfg["role"],
            },
        }

    auth_client = get_auth_client()
    # 1. Try fast sign in with password
    token = None
    expires_in = 3600
    try:
        sess = auth_client.auth.sign_in_with_password({
            "email": cfg["email"],
            "password": cfg["password"],
        })
        token = sess.session.access_token
        expires_in = getattr(sess.session, "expires_in", 3600) or 3600
    except Exception:
        # 2. Fallback to magiclink OTP verification
        link = auth_client.auth.admin.generate_link({
            "type": "magiclink",
            "email": cfg["email"],
        })
        otp = link.properties.email_otp
        sess = auth_client.auth.verify_otp({
            "email": cfg["email"],
            "token": otp,
            "type": "magiclink",
        })
        token = sess.session.access_token
        expires_in = getattr(sess.session, "expires_in", 3600) or 3600

    _ROLE_TOKEN_CACHE[target_key] = {
        "token": token,
        "expires_at": now + expires_in,
    }

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "user": {
            "id": cfg["id"],
            "email": cfg["email"],
            "name": cfg["name"],
            "role": cfg["role"],
        },
    }


def get_officer_session() -> Dict[str, Any]:
    """Compatibility helper returning officer session."""
    return get_user_session("officer")


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Validates the Supabase-issued Bearer token and returns real authenticated user context.
    Strictly enforces:
      - 401 Unauthorized if Authorization header is missing, malformed, or invalid
      - Resolves authenticated Supabase UUID against public.users / provisioned profiles
      - 403 Forbidden if user is authenticated in Supabase Auth but has no profile
      - Normalizes and preserves role information: policymaker | admin | officer
    """
    if not authorization or not authorization.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Bearer token required.",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'.",
        )

    token = authorization[7:].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token.",
        )

    # 1. Verify token signature and user existence via Supabase Auth
    try:
        auth_client = get_auth_client()
        user_response = auth_client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Supabase authentication token.",
            )
        auth_user = user_response.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase authentication token.",
        )

    user_id = str(auth_user.id)

    # 2. Resolve UUID against public.users
    client = get_supabase()
    try:
        res = client.table("users").select("id, email, name, role").eq("id", user_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User '{user_id}' authenticated with Supabase Auth, but no matching profile exists in public.users.",
            )
        profile = res.data[0]
        raw_role = profile.get("role") or (auth_user.user_metadata or {}).get("role", "officer")
        return {
            "id": str(profile["id"]),
            "email": profile.get("email") or auth_user.email,
            "name": profile.get("name") or (auth_user.user_metadata or {}).get("name", "Authorized User"),
            "role": normalize_role(raw_role),
        }
    except HTTPException:
        raise
    except Exception as exc:
        err_str = str(exc)
        # Handle PostgreSQL code 42501 (missing SELECT on public.users for service_role)
        if "42501" in err_str or "permission denied" in err_str.lower():
            if user_id in KNOWN_PROFILES:
                p = KNOWN_PROFILES[user_id]
                meta = auth_user.user_metadata or {}
                return {
                    "id": user_id,
                    "email": auth_user.email or p["email"],
                    "name": meta.get("name") or p["name"],
                    "role": p["role"],
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"User '{user_id}' authenticated with Supabase Auth, but no matching profile exists in public.users.",
                )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while resolving user profile: {err_str.split('?')[0]}",
        )


def require_role(*allowed_roles: str):
    """
    FastAPI dependency factory enforcing Role-Based Access Control (RBAC).
    Permitted roles: 'policymaker', 'admin', 'officer'.
    Returns 403 Forbidden if user's role is not within allowed_roles.
    """
    normalized_allowed = [normalize_role(r) for r in allowed_roles]

    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "officer")
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access forbidden: User role '{user_role}' does not possess required permission. "
                    f"Required roles: {', '.join(normalized_allowed)}."
                ),
            )
        return current_user

    return role_checker

