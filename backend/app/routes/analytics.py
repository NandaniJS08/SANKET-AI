"""
Portfolio Analytics Routes
Endpoints for macro portfolio metrics, ministry/sector aggregations, and empirical monthly trends.
"""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Query, status

from app.services.analytics import analytics_service

router = APIRouter(prefix="/analytics", tags=["Portfolio Analytics"])


@router.get("/overview", summary="Get portfolio-wide macro analytics overview")
def get_portfolio_overview(
    force_refresh: bool = Query(False, description="Force cache refresh from database"),
) -> Dict[str, Any]:
    """
    Retrieve macro portfolio analytics, cross-ministry performance, sector breakdown,
    and empirical monthly trajectories derived directly from `projects` and `project_monthly_snapshots`.
    """
    try:
        return analytics_service.get_overview(force_refresh=force_refresh)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate portfolio analytics overview: {str(exc).split('?')[0]}",
        )


@router.get("", summary="Get portfolio analytics overview", include_in_schema=False)
@router.get("/", summary="Get portfolio analytics overview", include_in_schema=False)
def get_analytics_root(
    force_refresh: bool = Query(False, description="Force cache refresh from database"),
) -> Dict[str, Any]:
    """
    Root alias for portfolio analytics overview.
    """
    return get_portfolio_overview(force_refresh=force_refresh)
