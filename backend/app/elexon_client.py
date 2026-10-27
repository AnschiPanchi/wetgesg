"""
Elexon BMRS API Client
Handles data fetching from the Elexon data portal with caching.
"""
import httpx
import asyncio
from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any, Optional
from cachetools import TTLCache
import logging

logger = logging.getLogger(__name__)

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"

# TTL cache: 5 minutes for actuals, 15 minutes for forecasts
_actuals_cache: TTLCache = TTLCache(maxsize=128, ttl=300)
_forecast_cache: TTLCache = TTLCache(maxsize=128, ttl=900)


def _cache_key(*args) -> str:
    return "|".join(str(a) for a in args)


async def fetch_wind_actuals(
    from_dt: datetime,
    to_dt: datetime,
) -> List[Dict[str, Any]]:
    """Fetch FUELHH wind actuals from Elexon API."""
    key = _cache_key("actuals", from_dt.isoformat(), to_dt.isoformat())
    if key in _actuals_cache:
        logger.info("Cache hit for actuals %s", key)
        return _actuals_cache[key]

    params = {
        "publishDateTimeFrom": from_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "publishDateTimeTo": to_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "fuelType": "WIND",
        "format": "json",
    }
    url = f"{BASE_URL}/datasets/FUELHH/stream"

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    # Normalize
    result = [
        {
            "startTime": item["startTime"],
            "publishTime": item.get("publishTime"),
            "settlementDate": item.get("settlementDate"),
            "settlementPeriod": item.get("settlementPeriod"),
            "generation": item["generation"],
        }
        for item in data
        if item.get("fuelType") == "WIND"
    ]
    result.sort(key=lambda x: x["startTime"])
    _actuals_cache[key] = result
    return result


async def fetch_wind_forecasts(
    publish_from: datetime,
    publish_to: datetime,
) -> List[Dict[str, Any]]:
    """Fetch WINDFOR wind forecasts from Elexon API."""
    key = _cache_key("forecasts", publish_from.isoformat(), publish_to.isoformat())
    if key in _forecast_cache:
        logger.info("Cache hit for forecasts %s", key)
        return _forecast_cache[key]

    params = {
        "publishDateTimeFrom": publish_from.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "publishDateTimeTo": publish_to.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "format": "json",
    }
    url = f"{BASE_URL}/datasets/WINDFOR/stream"

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    result = [
        {
            "startTime": item["startTime"],
            "publishTime": item["publishTime"],
            "generation": item["generation"],
        }
        for item in data
    ]
    result.sort(key=lambda x: (x["publishTime"], x["startTime"]))
    _forecast_cache[key] = result
    return result


async def fetch_january_2026_actuals() -> List[Dict[str, Any]]:
    """Fetch all wind actuals for January 2026."""
    from_dt = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    to_dt = datetime(2026, 2, 1, 0, 0, 0, tzinfo=timezone.utc)
    return await fetch_wind_actuals(from_dt, to_dt)


async def fetch_january_2026_forecasts() -> List[Dict[str, Any]]:
    """
    Fetch day-ahead forecasts relevant for January 2026.
    Day-ahead decisions are made on Dec 31 for Jan 1, ... Jan 30 for Jan 31.
    publishTime window: Dec 31 2025 to Jan 31 2026.
    """
    from_dt = datetime(2025, 12, 31, 0, 0, 0, tzinfo=timezone.utc)
    to_dt = datetime(2026, 1, 31, 23, 59, 59, tzinfo=timezone.utc)
    return await fetch_wind_forecasts(from_dt, to_dt)
