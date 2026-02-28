"""Health check endpoint."""
from fastapi import APIRouter
from xrpl_service import is_connected
from config import TOKENS

router = APIRouter()


@router.get("/health")
async def health_check():
    connected = await is_connected()
    return {
        "status": "healthy" if connected else "degraded",
        "xrpl_connected": connected,
        "pools": len(TOKENS),
    }
