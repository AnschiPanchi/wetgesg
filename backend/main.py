"""
WindWatch UK - Energy Forecasting API
Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import actuals, forecasts, analytics

app = FastAPI(
    title="WindWatch UK API",
    description="UK Day-Ahead Wind Power Forecasting & Accuracy Analytics",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(actuals.router, prefix="/api/actuals", tags=["Actuals"])
app.include_router(forecasts.router, prefix="/api/forecasts", tags=["Forecasts"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "WindWatch UK API"}
