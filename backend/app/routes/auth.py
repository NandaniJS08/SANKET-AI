"""
Authentication Routes
Endpoints for user session context and Supabase Auth integration.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Body, status

from app.core.auth import get_current_user, get_user_session, require_role

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", summary="Get current authenticated user profile")
def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Returns the authenticated Supabase user context and resolved public.users profile.
    Requires a valid Bearer token.
    """
    return {
        "message": "User session authenticated.",
        "user": current_user,
    }


@router.post("/login", summary="Sign in and obtain Supabase Auth token")
def login(payload: Optional[Dict[str, Any]] = Body(None)) -> Dict[str, Any]:
    """
    Issues a valid Supabase Auth Bearer token and resolved user context
    for the verified personas: Policymaker, Administrator, or Monitoring Officer.
    """
    identifier = None
    if payload:
        identifier = payload.get("email") or payload.get("role") or payload.get("username")
    session = get_user_session(identifier)
    return session


@router.get("/rbac/policymaker", summary="Policymaker-only RBAC endpoint")
def rbac_policymaker(current_user: Dict[str, Any] = Depends(require_role("policymaker"))) -> Dict[str, Any]:
    """Protected endpoint only accessible to Policymakers."""
    return {"message": "Access granted: Policymaker verified.", "user": current_user}


@router.get("/rbac/admin", summary="Administrator-only RBAC endpoint")
def rbac_admin(current_user: Dict[str, Any] = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Protected endpoint only accessible to Administrators."""
    return {"message": "Access granted: Administrator verified.", "user": current_user}


@router.get("/rbac/officer", summary="Monitoring Officer-only RBAC endpoint")
def rbac_officer(current_user: Dict[str, Any] = Depends(require_role("officer"))) -> Dict[str, Any]:
    """Protected endpoint only accessible to Monitoring Officers."""
    return {"message": "Access granted: Monitoring Officer verified.", "user": current_user}

