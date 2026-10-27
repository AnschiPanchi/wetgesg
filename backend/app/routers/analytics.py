"""
Analytics router: forecast accuracy metrics endpoints.
"""
from fastapi import APIRouter, HTTPException
from app.elexon_client import fetch_january_2026_actuals, fetch_january_2026_forecasts
from app.analytics import compute_accuracy_metrics
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/accuracy")
async def get_forecast_accuracy():
    """
    Compute and return comprehensive forecast accuracy metrics for January 2026.
    Includes MAE, RMSE, MAPE, bias, correlation, skill score,
    per-day breakdown, and matched time series for charting.
    """
    try:
        actuals, forecasts = await _fetch_both()
        metrics = compute_accuracy_metrics(actuals, forecasts)
        if "error" in metrics:
            raise HTTPException(status_code=404, detail=metrics["error"])
        return metrics
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error computing accuracy: %s", e)
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/summary")
async def get_summary():
    """
    Return a combined summary including latest forecast snapshot info
    and quick accuracy headline numbers.
    """
    try:
        actuals, forecasts = await _fetch_both()
        metrics = compute_accuracy_metrics(actuals, forecasts)
        if "error" in metrics:
            return {"status": "no_data", "message": metrics["error"]}

        overall = metrics["overall"]
        return {
            "status": "ok",
            "period": "January 2026",
            "headline": {
                "mae_mw": overall["mae"],
                "rmse_mw": overall["rmse"],
                "mape_pct": overall["mape"],
                "bias_mw": overall["bias"],
                "correlation": overall["correlation"],
                "skillScore": overall["skillScore"],
                "nDataPoints": overall["nPoints"],
            },
        }
    except Exception as e:
        logger.error("Error getting summary: %s", e)
        raise HTTPException(status_code=502, detail=str(e))


async def _fetch_both():
    import asyncio
    return await asyncio.gather(
        fetch_january_2026_actuals(),
        fetch_january_2026_forecasts(),
    )
