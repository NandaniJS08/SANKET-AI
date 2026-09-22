"""
Projects Routes
Endpoints for infrastructure project registries, details, dossiers, and time-series.
All endpoints map directly to verified Supabase PostgreSQL schema.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status

from app.services.projects import project_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", summary="List projects with pagination, search, and filters")
@router.get("/", include_in_schema=False)
def list_projects(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=1000, description="Items per page (max 100)"),
    search: Optional[str] = Query(None, description="Search term for project ID or Name"),
    ministry: Optional[str] = Query(None, description="Filter by Ministry"),
    sector: Optional[str] = Query(None, description="Filter by Sector"),
    state: Optional[str] = Query(None, description="Filter by State"),
    implementing_agency: Optional[str] = Query(None, description="Filter by Implementing Agency"),
    project_status: Optional[str] = Query(None, description="Filter by Project Status"),
    risk_level: Optional[str] = Query(None, description="Filter by Risk Level"),
    reporting_month: Optional[str] = Query(None, description="Filter by Reporting Month (YYYY-MM-DD)"),
    sort_by: str = Query("project_id", description="Field to sort by"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort direction (asc or desc)"),
) -> Dict[str, Any]:
    """
    Retrieve paginated infrastructure projects with multi-criteria filtering and text search.
    """
    try:
        return project_service.get_projects(
            page=page,
            page_size=page_size,
            search=search,
            ministry=ministry,
            sector=sector,
            state=state,
            implementing_agency=implementing_agency,
            project_status=project_status,
            risk_level=risk_level,
            reporting_month=reporting_month,
            sort_by=sort_by,
            sort_order=sort_order,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects: {str(exc).split('?')[0]}",
        )


@router.get("/filters-meta", summary="Get distinct filter metadata values")
@router.get("/filters/meta", include_in_schema=False)
def get_filters_meta() -> Dict[str, Any]:
    """
    Retrieve dynamically populated distinct values for sector, state, ministry,
    agency, status, and reporting month from the database.
    """
    try:
        return project_service.get_filters_meta()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch filter metadata: {str(exc).split('?')[0]}",
        )


@router.get("/stats/overview", summary="Get portfolio monitoring statistics overview")
def get_stats_overview() -> Dict[str, Any]:
    """
    Retrieve portfolio-wide monitoring statistics including total projects,
    status distribution, and risk-level counts derived from actual database records.
    """
    try:
        return project_service.get_stats_overview()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate statistics overview: {str(exc).split('?')[0]}",
        )


@router.get("/{project_id}/history", summary="Get chronological monthly snapshots history for a project")
def get_project_history(project_id: str) -> Dict[str, Any]:
    """
    Retrieve all historical monthly snapshots for a specific project ID in ascending chronological order.
    Sourced directly from verified database records in `project_monthly_snapshots`.
    """
    try:
        history = project_service.get_project_history(project_id)
        if not history:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with ID '{project_id}' not found.",
            )
        return history
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch history for project '{project_id}': {str(exc).split('?')[0]}",
        )


@router.get("/{project_id}", summary="Get project detail dossier by project ID")
def get_project_detail(project_id: str) -> Dict[str, Any]:
    """
    Retrieve project metadata and latest monthly snapshot for a specific project ID.
    """
    try:
        project = project_service.get_project_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with ID '{project_id}' not found.",
            )
        return project
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project '{project_id}': {str(exc).split('?')[0]}",
        )
