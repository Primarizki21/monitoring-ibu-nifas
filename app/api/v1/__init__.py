from fastapi import APIRouter
from app.api.v1.faskes import router as faskes_router
from app.api.v1.mothers import router as mothers_router
from app.api.v1.triage import router as triage_router
from app.api.v1.webhook import router as webhook_router
from app.api.v1.prd_router import router as prd_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(faskes_router)
api_router.include_router(mothers_router)
api_router.include_router(triage_router)
api_router.include_router(webhook_router)
api_router.include_router(prd_router)

__all__ = ["api_router"]
