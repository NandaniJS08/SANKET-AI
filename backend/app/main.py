"""
SANKET-AI Platform Backend — FastAPI Application Root
"""

from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.supabase import get_supabase_optional

from app.routes.auth import router as auth_router
from app.routes.projects import router as projects_router
from app.routes.predictions import router as predictions_router
from app.routes.warnings import router as warnings_router
from app.routes.actions import router as actions_router
from app.routes.analytics import router as analytics_router
from app.routes.ai_assistant import router as ai_assistant_router

app = FastAPI(

    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Explainable AI-powered Infrastructure Project Risk Prediction & Monitoring Platform — SIH26103",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware (Supports local dev + production deployment domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/", tags=["System"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health", tags=["System"])
def health():
    db_status = "unconfigured"
    if settings.is_supabase_configured():
        client = get_supabase_optional()
        if client:
            try:
                res = client.table("projects").select("project_id").limit(1).execute()
                db_status = "connected" if res is not None else "degraded"
            except Exception:
                db_status = "unreachable"
        else:
            db_status = "initialization_failed"

    return {
        "status": "healthy" if db_status in ("connected", "unconfigured") else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status
    }


# Mount API Routers under /api/v1
API_V1 = "/api/v1"
app.include_router(auth_router, prefix=API_V1)
app.include_router(projects_router, prefix=API_V1)
app.include_router(predictions_router, prefix=API_V1)
app.include_router(warnings_router, prefix=API_V1)
app.include_router(actions_router, prefix=API_V1)
app.include_router(analytics_router, prefix=API_V1)
app.include_router(ai_assistant_router, prefix=API_V1)


# Frontend compatibility alias: /api/v1/early-warnings -> warning_service.get_active_warnings
@app.get(f"{API_V1}/early-warnings", tags=["Early Warnings"], summary="Frontend compatibility alias for early warnings")
def early_warnings_frontend_alias(
    severity: Optional[str] = None,
    warning_type: Optional[str] = None,
    project_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
):
    from app.services.warnings import warning_service
    return warning_service.get_active_warnings(
        severity=severity,
        warning_type=warning_type,
        project_id=project_id,
        page=page,
        page_size=page_size,
    )


@app.get("/debug/ml-status", tags=["System"], summary="ML Engine initialization diagnostic")
def ml_status():
    """Returns exact ML engine path resolution and predictor status for production diagnosis."""
    import sys
    import traceback
    from pathlib import Path
    from app.core.config import settings

    ml_path = Path(settings.ML_ENGINE_PATH)
    ai_src = ml_path / "src"
    models_dir = ml_path / "models"

    model_files = {}
    for name in ["high_risk_model.joblib", "deadline_slip_model.joblib", "cost_escalation_model.joblib", "model_meta.json"]:
        p = models_dir / name
        model_files[name] = {"exists": p.exists(), "size_bytes": p.stat().st_size if p.exists() else None}

    predictor_status = "uninitialized"
    predictor_error = None
    try:
        from app.services.predictions import _predictor, prediction_service
        if _predictor is not None:
            predictor_status = "loaded"
        else:
            # Try fresh load
            if str(ai_src) not in sys.path:
                sys.path.insert(0, str(ai_src))
            from predict import get_predictor
            test_p = get_predictor()
            predictor_status = "loaded_on_demand" if test_p else "failed"
    except Exception as e:
        predictor_status = "error"
        predictor_error = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"

    return {
        "ml_engine_path_config": settings.ML_ENGINE_PATH,
        "ml_engine_path_resolved": str(ml_path.resolve()),
        "ml_engine_path_exists": ml_path.exists(),
        "ai_src_exists": ai_src.exists(),
        "models_dir_exists": models_dir.exists(),
        "model_files": model_files,
        "sys_path_includes_ai_src": str(ai_src) in sys.path,
        "predictor_status": predictor_status,
        "predictor_error": predictor_error,
        "python_version": sys.version,
    }

