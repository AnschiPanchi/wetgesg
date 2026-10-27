"""
Forecasts router: endpoints for wind generation forecasts (WINDFOR).
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from app.elexon_client import fetch_wind_forecasts, fetch_january_2026_forecasts
from app.analytics import get_latest_forecast_snapshot, select_day_ahead_forecast, _to_df
import logging
import pandas as pd

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/january2026")
async def get_january_2026_forecasts():
    """Return all wind forecasts relevant for January 2026 day-ahead decisions."""
    try:
        data = await fetch_january_2026_forecasts()
        return {"count": len(data), "data": data}
    except Exception as e:
        logger.error("Error fetching forecasts: %s", e)
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/latest-snapshot")
async def get_latest_forecast_snapshot_endpoint():
    """
    Return the most recent forecast run and its generation profile.
    Useful for the day-ahead dashboard view.
    """
    try:
        data = await fetch_january_2026_forecasts()
        snapshot = get_latest_forecast_snapshot(data)
        return snapshot
    except Exception as e:
        logger.error("Error getting latest snapshot: %s", e)
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/day-ahead")
async def get_day_ahead_forecasts():
    """
    Return the day-ahead forecast for each hour of January 2026.
    These are the forecasts that were available when decisions were made
    (latest forecast published before gate closure on the previous day).
    """
    try:
        data = await fetch_january_2026_forecasts()
        df = _to_df(data)
        df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
        da = select_day_ahead_forecast(df)
        if da.empty:
            return {"count": 0, "data": []}
        result = [
            {
                "startTime": row["startTime"].isoformat(),
                "publishTime": row["publishTime"].isoformat(),
                "generation": int(row["generation"]),
            }
            for _, row in da.sort_values("startTime").iterrows()
        ]
        return {"count": len(result), "data": result}
    except Exception as e:
        logger.error("Error getting day-ahead forecasts: %s", e)
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/by-date")
async def get_forecasts_for_date(
    target_date: str = Query(..., description="Date YYYY-MM-DD to get all forecast versions for"),
):
    """
    Return all forecast versions for a specific delivery date,
    showing how the forecast evolved over time.
    """
    try:
        data = await fetch_january_2026_forecasts()
        df = pd.DataFrame(data)
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
        df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)

        target = pd.to_datetime(target_date).date()
        filtered = df[df["startTime"].dt.date == target].copy()

        if filtered.empty:
            return {"count": 0, "data": [], "publishVersions": []}

        pub_versions = sorted(filtered["publishTime"].unique().tolist())

        result = []
        for pub_time in pub_versions:
            subset = filtered[filtered["publishTime"] == pub_time].sort_values("startTime")
            result.append({
                "publishTime": pub_time.isoformat(),
                "forecasts": [
                    {"startTime": r["startTime"].isoformat(), "generation": int(r["generation"])}
                    for _, r in subset.iterrows()
                ]
            })

        return {
            "count": len(pub_versions),
            "targetDate": target_date,
            "data": result,
        }
    except Exception as e:
        logger.error("Error getting forecasts by date: %s", e)
        raise HTTPException(status_code=502, detail=str(e))
