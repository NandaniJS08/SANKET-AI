"""
Predictions & AI Explainability Routes
Exposes ML multi-target risk predictions, TreeSHAP attributions, and plain-language dossiers.
All endpoints share the common feature resolution pipeline in prediction_service.
"""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Body

from app.services.predictions import prediction_service

router = APIRouter(prefix="/predictions", tags=["Predictions & AI Explainability"])


@router.post("/predict-risk", summary="Execute real-time ML risk prediction on custom telemetry (CUF)")
def predict_custom_risk(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Execute multi-target Random Forest inference and TreeSHAP on custom or what-if project parameters.
    Directly satisfies the frontend CUF simulator API contract.
    """
    try:
        return prediction_service.predict_custom(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute custom prediction: {str(exc).split('?')[0]}",
        )


@router.post("/simulate-what-if", summary="Simulate policy intervention and what-if risk mitigation")
def simulate_what_if(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Evaluate policy intervention impact on project timeline, cost savings, and risk score.
    Directly satisfies frontend ml.service.ts simulateWhatIf contract.
    """
    try:
        return prediction_service.simulate_what_if(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute what-if simulation: {str(exc).split('?')[0]}",
        )



@router.get("/shap/{project_id}", summary="Get TreeSHAP feature attributions for a project")
def get_shap_attributions(project_id: str) -> Dict[str, Any]:
    """
    Retrieve TreeSHAP feature contribution weights and evidence for the project.
    Uses the exact same verified feature row as the prediction endpoint.
    """
    try:
        res = prediction_service.get_shap_drivers(project_id)
        if res.get("error") == "NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=res.get("message", f"Project '{project_id}' not found."),
            )
        return res
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate SHAP attributions: {str(exc).split('?')[0]}",
        )


@router.get("/explain/{project_id}", summary="Get plain-language risk explanation and evidence dossier")
def get_plain_language_explanation(project_id: str) -> Dict[str, Any]:
    """
    Synthesize plain-language institutional dossier including risk flags,
    top SHAP drivers, and actionable recommendations.
    """
    try:
        res = prediction_service.get_explanation(project_id)
        if res.get("error") == "NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=res.get("message", f"Project '{project_id}' not found."),
            )
        return res
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate explanation: {str(exc).split('?')[0]}",
        )


@router.get("/{project_id}", summary="Get multi-target ML risk prediction for a project")
def get_prediction(project_id: str) -> Dict[str, Any]:
    """
    Execute multi-target Random Forest risk prediction and TreeSHAP on verified project features.
    If mapping is ambiguous or unmatched, returns structured status with prediction: null.
    """
    try:
        res = prediction_service.predict_for_project(project_id)
        if res.get("error") == "NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=res.get("message", f"Project '{project_id}' not found."),
            )
        return res
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute prediction: {str(exc).split('?')[0]}",
        )
