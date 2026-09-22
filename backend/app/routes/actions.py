"""
Intervention & Action Tracking Routes
Endpoints for logging, updating, and auditing administrative interventions.
Uses real project validation and real user tracking.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Body, status

from app.core.auth import get_current_user, require_role
from app.services.actions import action_service

router = APIRouter(prefix="/actions", tags=["Interventions & Actions"])


@router.get("", summary="List logged interventions and action plans")
@router.get("/", summary="List logged interventions and action plans", include_in_schema=False)
def list_actions(
    project_id: Optional[str] = Query(None, description="Filter actions by project ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=200, description="Items per page"),
) -> Dict[str, Any]:
    """
    Retrieve logged statutory action directives from `actions_log` (paginated).
    If project_id is provided, validates that the project exists in master registry.
    Reports exact database permission restrictions (e.g. code 42501).
    Returns: { total, page, page_size, total_pages, actions: [...] }
    """
    return action_service.get_actions(project_id=project_id, page=page, page_size=page_size)


@router.post("", summary="Log and dispatch a new administrative action directive", status_code=status.HTTP_201_CREATED)
@router.post("/", summary="Log and dispatch a new administrative action directive", include_in_schema=False, status_code=status.HTTP_201_CREATED)
def create_action(
    payload: Dict[str, Any] = Body(..., description="Action directive payload"),
    current_user: Dict[str, Any] = Depends(require_role("officer", "admin", "policymaker")),
) -> Dict[str, Any]:
    """
    Log and dispatch a new statutory action directive.
    Validates project existence (404) and canonical action categories (422).
    Binds the authenticated officer context and reports exact database permission status.
    """
    created = action_service.create_action(payload=payload, current_user=current_user)
    return {
        "message": "Action directive successfully registered.",
        "action": created,
    }


@router.patch("/{action_id}/status", summary="Update the status of an existing action directive")
def update_action_status(
    action_id: str,
    payload: Dict[str, Any] = Body(..., description="Status update payload, e.g. {'status': 'Completed'}"),
    current_user: Dict[str, Any] = Depends(require_role("officer", "admin", "policymaker")),
) -> Dict[str, Any]:
    """
    Update the status of an action directive (e.g. mark 'Completed').
    Validates permitted status values and reports exact database permission status.
    """
    new_status = payload.get("status")
    updated = action_service.update_action_status(action_id=action_id, new_status=new_status, current_user=current_user)
    return {
        "message": f"Action {action_id} status updated to '{new_status}'.",
        "action": updated,
    }
