"""
Early Warnings Routes
Endpoints for risk signals, trigger thresholds, and early-warning alerts.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status

from app.services.warnings import warning_service

router = APIRouter(prefix="/warnings", tags=["Early Warnings"])


@router.get("", summary="List early-warning risk signals across infrastructure projects")
@router.get("/", summary="List early-warning risk signals across infrastructure projects", include_in_schema=False)
def list_warnings(
    severity: Optional[str] = Query(None, description="Filter by severity level: Critical, High, Moderate, all"),
    warning_type: Optional[str] = Query(None, description="Filter by warning signal type"),
    project_id: Optional[str] = Query(None, description="Filter by specific project ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=1000, description="Items per page"),
) -> Dict[str, Any]:
    """
    Retrieve active early-warning signals across Central Sector projects.
    Sourced strictly from verified database records in `projects` and `project_features`.
    """
    try:
        return warning_service.get_active_warnings(
            severity=severity,
            warning_type=warning_type,
            project_id=project_id,
            page=page,
            page_size=page_size,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch early warnings: {str(exc).split('?')[0]}",
        )


@router.get("/{project_id}", summary="Get active early-warning signals for a specific project")
def get_project_warnings(project_id: str) -> Dict[str, Any]:
    """
    Evaluate and retrieve active early-warning signals for a specific project ID.
    Returns 404 if project is not found in the master registry.
    """
    try:
        res = warning_service.get_project_warnings(project_id)
        if res is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with ID '{project_id}' not found.",
            )
        return res
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate warnings for project '{project_id}': {str(exc).split('?')[0]}",
        )
