"""
AI Assistant Routes
Exposes `/api/v1/ai-assistant/chat` for the SANKET-AI Conversational Copilot.
Directly powers AIAssistant.jsx and ai.service.ts.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.ai_assistant import ai_assistant_service

router = APIRouter(prefix="/ai-assistant", tags=["AI Copilot Assistant"])


class ChatRequest(BaseModel):
    message: str = Field(..., description="User query / prompt for the Copilot")


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Institutional response text formatted in markdown")
    sources: List[str] = Field(default_factory=list, description="Verified data/model sources")


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with MoSPI SANKET-AI Intelligence Copilot",
    status_code=status.HTTP_200_OK
)
def chat_with_copilot(payload: ChatRequest) -> Dict[str, Any]:
    """
    Query the SANKET-AI intelligence copilot.
    Utilizes Google Gemini 1.5 Flash (when configured) or domain-grounded RAG
    aggregating real data across 2,098 monitored projects.
    """
    try:
        return ai_assistant_service.chat(payload.message)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Copilot processing error: {str(exc).split('?')[0]}"
        )
