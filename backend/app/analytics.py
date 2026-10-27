"""
Analytics engine: compute forecast accuracy metrics against actuals.
Supports MAE, RMSE, MAPE, bias, and per-day breakdowns.
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


def _to_df(records: List[Dict], time_col: str = "startTime") -> pd.DataFrame:
    df = pd.DataFrame(records)
    df[time_col] = pd.to_datetime(df[time_col], utc=True)
    return df


def select_day_ahead_forecast(forecasts_df: pd.DataFrame) -> pd.DataFrame:
    """
    For each target startTime in January 2026, select the most recent forecast
    that was published before 23:00 UTC the day before (i.e., the 'day-ahead' 
    gate closure time proxy). This represents the forecast available when making
    day-ahead market purchase decisions.
    """
    jan_targets = forecasts_df[
        (forecasts_df["startTime"].dt.month == 1) &
        (forecasts_df["startTime"].dt.year == 2026)
    ].copy()

    if jan_targets.empty:
        return pd.DataFrame()

    # Gate closure: day before the delivery date at 23:00 UTC
    jan_targets["deliveryDate"] = jan_targets["startTime"].dt.date
    jan_targets["gateClosure"] = pd.to_datetime(
        jan_targets["deliveryDate"]
    ).dt.tz_localize("UTC") - pd.Timedelta(hours=1)

    # Keep only forecasts published before gate closure
    valid = jan_targets[jan_targets["publishTime"] <= jan_targets["gateClosure"]]

    if valid.empty:
        return pd.DataFrame()

    # For each startTime, take the latest publishTime before gate closure
    idx = valid.groupby("startTime")["publishTime"].idxmax()
    day_ahead = valid.loc[idx].reset_index(drop=True)
    return day_ahead


def compute_accuracy_metrics(
    actuals: List[Dict],
    forecasts: List[Dict],
) -> Dict[str, Any]:
    """
    Compute comprehensive accuracy metrics for January 2026 wind forecasts.
    Returns overall metrics, per-day metrics, and matched series for charting.
    """
    act_df = _to_df(actuals)
    for_df = _to_df(forecasts)

    if act_df.empty or for_df.empty:
        return {"error": "Insufficient data"}

    for_df["publishTime"] = pd.to_datetime(for_df["publishTime"], utc=True)

    # Select day-ahead forecasts
    da_forecast = select_day_ahead_forecast(for_df)

    if da_forecast.empty:
        return {"error": "No day-ahead forecasts found"}

    # Merge on startTime — actuals are 30-min, forecasts are 1-hour
    # We match actuals to the nearest forecast hour
    act_df["startTime_hour"] = act_df["startTime"].dt.floor("h")
    act_df_hourly = act_df.groupby("startTime_hour", as_index=False)["generation"].mean()
    act_df_hourly.rename(columns={"startTime_hour": "startTime"}, inplace=True)

    da_forecast_clean = da_forecast[["startTime", "generation", "publishTime"]].copy()
    da_forecast_clean.rename(columns={"generation": "forecast"}, inplace=True)
    act_df_hourly.rename(columns={"generation": "actual"}, inplace=True)

    merged = pd.merge(act_df_hourly, da_forecast_clean, on="startTime", how="inner")

    if merged.empty:
        return {"error": "No matching actuals and forecasts"}

    merged["error"] = merged["forecast"] - merged["actual"]
    merged["abs_error"] = merged["error"].abs()
    merged["sq_error"] = merged["error"] ** 2
    merged["pct_error"] = (merged["abs_error"] / merged["actual"].replace(0, np.nan)) * 100

    # Overall metrics
    mae = float(merged["abs_error"].mean())
    rmse = float(np.sqrt(merged["sq_error"].mean()))
    mape = float(merged["pct_error"].mean())
    bias = float(merged["error"].mean())
    n_points = int(len(merged))
    corr = float(merged["actual"].corr(merged["forecast"]))

    # Skill score vs. persistence (naïve forecast = previous hour actual)
    act_df_hourly_sorted = act_df_hourly.sort_values("startTime").reset_index(drop=True)
    act_df_hourly_sorted["persistence"] = act_df_hourly_sorted["actual"].shift(1)
    persistence_merged = pd.merge(
        merged, act_df_hourly_sorted[["startTime", "persistence"]], on="startTime", how="left"
    ).dropna(subset=["persistence"])
    if not persistence_merged.empty:
        persistence_mae = float((persistence_merged["persistence"] - persistence_merged["actual"]).abs().mean())
        skill_score = float(1 - mae / persistence_mae) if persistence_mae > 0 else None
    else:
        skill_score = None

    # Per-day breakdown
    merged["date"] = merged["startTime"].dt.date.astype(str)
    per_day = merged.groupby("date").agg(
        mae=("abs_error", "mean"),
        rmse=("sq_error", lambda x: float(np.sqrt(x.mean()))),
        bias=("error", "mean"),
        mape=("pct_error", "mean"),
        n_points=("actual", "count"),
    ).reset_index()
    per_day["mae"] = per_day["mae"].round(1)
    per_day["rmse"] = per_day["rmse"].round(1)
    per_day["bias"] = per_day["bias"].round(1)
    per_day["mape"] = per_day["mape"].round(2)

    # Time series for charting
    merged_sorted = merged.sort_values("startTime")
    time_series = [
        {
            "startTime": row["startTime"].isoformat(),
            "actual": round(float(row["actual"]), 1),
            "forecast": round(float(row["forecast"]), 1),
            "error": round(float(row["error"]), 1),
            "absError": round(float(row["abs_error"]), 1),
            "publishTime": row["publishTime"].isoformat() if pd.notnull(row["publishTime"]) else None,
        }
        for _, row in merged_sorted.iterrows()
    ]

    return {
        "overall": {
            "mae": round(mae, 1),
            "rmse": round(rmse, 1),
            "mape": round(mape, 2),
            "bias": round(bias, 1),
            "correlation": round(corr, 4),
            "skillScore": round(skill_score, 4) if skill_score is not None else None,
            "nPoints": n_points,
        },
        "perDay": per_day.to_dict(orient="records"),
        "timeSeries": time_series,
    }


def get_latest_forecast_snapshot(forecasts: List[Dict]) -> Dict[str, Any]:
    """
    Get the most recent forecast run and its generation profile for 
    the next 48 hours (useful for the 'latest forecast' dashboard view).
    """
    if not forecasts:
        return {}

    df = pd.DataFrame(forecasts)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)

    # Latest publish time
    latest_pub = df["publishTime"].max()
    latest_run = df[df["publishTime"] == latest_pub].sort_values("startTime")

    return {
        "publishTime": latest_pub.isoformat(),
        "forecast": [
            {
                "startTime": row["startTime"].isoformat(),
                "generation": int(row["generation"]),
            }
            for _, row in latest_run.iterrows()
        ],
    }
