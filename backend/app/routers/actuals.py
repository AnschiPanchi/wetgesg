"""
Actuals router: endpoints for wind generation actuals (FUELHH).
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from app.elexon_client import fetch_wind_actuals, fetch_january_2026_actuals
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/january2026")
async def get_january_2026_actuals():
    """Return all wind actuals for January 2026 (FUELHH dataset)."""
    try:
        data = await fetch_january_2026_actuals()
        return {"count": len(data), "data": data}
    except Exception as e:
        logger.error("Error fetching actuals: %s", e)
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/range")
async def get_actuals_range(
    from_dt: str = Query(..., description="ISO datetime UTC e.g. 2026-01-01T00:00:00Z"),
    to_dt: str = Query(..., description="ISO datetime UTC e.g. 2026-01-15T00:00:00Z"),
):
    """Return wind actuals for a custom date range."""
    try:
        from_parsed = datetime.fromisoformat(from_dt.replace("Z", "+00:00"))
        to_parsed = datetime.fromisoformat(to_dt.replace("Z", "+00:00"))
        data = await fetch_wind_actuals(from_parsed, to_parsed)
        return {"count": len(data), "data": data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {e}")
    except Exception as e:
        logger.error("Error fetching actuals range: %s", e)
        raise HTTPException(status_code=502, detail=str(e))
