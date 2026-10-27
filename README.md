# WindWatch UK 🌬️

**Day-Ahead Wind Power Forecasting & Accuracy Analytics Dashboard**

A full-stack web application for a UK energy utility to monitor national wind generation forecasts and evaluate forecast accuracy — supporting procurement decisions in the UK day-ahead electricity market.

> **Built with AI tools assistance** (Google Gemini / Antigravity AI coding assistant) — all code reviewed and validated.

---

## 🚀 Live Application

- **Deployed App**: https://wetgesg.vercel.app/
- **Data Source**: [Elexon BMRS](https://data.elexon.co.uk)

---

## 📁 Project Structure

```
GridBricks Assignment/
├── backend/                    # Python FastAPI backend
│   ├── main.py                 # FastAPI app entry point + CORS config
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile              # Backend Docker image
│   └── app/
│       ├── elexon_client.py    # Elexon BMRS API client with TTL caching
│       ├── analytics.py        # Forecast accuracy metrics engine
│       └── routers/
│           ├── actuals.py      # /api/actuals endpoints (FUELHH dataset)
│           ├── forecasts.py    # /api/forecasts endpoints (WINDFOR dataset)
│           └── analytics.py    # /api/analytics accuracy + summary endpoints
│
├── frontend/                   # React (Vite) frontend
│   ├── src/
│   │   ├── App.jsx             # Root app with page routing
│   │   ├── index.css           # Design system (CSS custom properties, components)
│   │   ├── main.jsx            # React entry point
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Sticky navigation bar
│   │   │   └── Shared.jsx      # Reusable components (MetricCard, LoadingState, etc.)
│   │   ├── hooks/
│   │   │   └── useApiData.js   # Custom hook for API data fetching
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Overview with KPIs + latest forecast chart
│   │   │   ├── ForecastsPage.jsx # Day-ahead forecast explorer + version comparison
│   │   │   ├── ActualsPage.jsx   # Wind actuals charts + stats table
│   │   │   └── AccuracyPage.jsx  # Full accuracy analysis with all metrics
│   │   └── services/
│   │       └── api.js          # Axios API service layer
│   ├── Dockerfile              # Multi-stage build (Node → nginx)
│   ├── nginx.conf              # Nginx config with API proxy
│   └── vite.config.js          # Vite config with dev proxy
│
├── docker-compose.yml          # Orchestrates backend + frontend
└── README.md                   # This file
```

---

## ✨ Features

### 1. Dashboard

- Real-time KPI cards: **MAE, RMSE, MAPE, Forecast Bias**
- Day-ahead wind forecast area chart for January 2026
- Key insights panel (correlation, skill score, gate closure info)
- Quick navigation to all sections

### 2. Forecasts Explorer

- Full January 2026 day-ahead forecast profile (scrollable)
- **Forecast version comparison**: see how predictions evolved for any delivery date
- Gate closure logic explanation with date picker navigation

### 3. Actuals Viewer

- 30-minute resolution wind actuals (FUELHH dataset)
- Daily average & peak bar chart
- Summary stats: total energy, peak, average, data point count
- Tabular view of recent records

### 4. Accuracy Analysis

- **MAE, RMSE, MAPE, Bias** with contextual interpretation
- **Pearson correlation coefficient** between forecast and actual
- **Skill Score vs. persistence** baseline
- Actual vs. forecast overlay chart
- Forecast error time series with zero-reference line
- Daily MAE/RMSE bar chart
- Sortable per-day breakdown table
- Procurement decision interpretation guide

---

## 🔧 How to Start the Application

### Option 1: Docker Compose (Recommended)

```bash
# From project root
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Local Development

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173 (proxies /api to backend)
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                   │
│  Dashboard | Forecasts | Actuals | Accuracy               │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP /api/*
┌────────────────────▼─────────────────────────────────────┐
│             FastAPI Backend (Python 3.12)                  │
│  /api/actuals   /api/forecasts   /api/analytics           │
│  ┌─────────────────────────────────────────────────┐     │
│  │  elexon_client.py  (TTL cached API calls)        │     │
│  │  analytics.py      (pandas/numpy metrics)        │     │
│  └──────────────────────┬──────────────────────────┘     │
└─────────────────────────┼────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼────────────────────────────────┐
│           Elexon BMRS API (data.elexon.co.uk)            │
│  FUELHH stream (Wind Actuals, 30-min)                    │
│  WINDFOR stream (Wind Forecasts, hourly)                  │
└──────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**

- **TTL Caching**: Actuals cached 5 min, forecasts 15 min — avoids hammering Elexon API
- **Day-ahead gate closure**: For each delivery hour in Jan 2026, we select the most recent forecast published before 23:00 UTC on the prior day
- **Hourly matching**: FUELHH actuals (30-min) are averaged to hourly to align with WINDFOR (1-hr) before computing metrics
- **CORS + Proxy**: Dev uses Vite proxy; production uses nginx reverse proxy

---

## 📊 Data Sources

| Dataset | Endpoint                                | Resolution | Period                              |
| ------- | --------------------------------------- | ---------- | ----------------------------------- |
| FUELHH  | `/datasets/FUELHH/stream?fuelType=WIND` | 30-minute  | Jan 2026 actuals                    |
| WINDFOR | `/datasets/WINDFOR/stream`              | 1-hour     | Dec 31 2025 – Jan 31 2026 forecasts |

### Key Finding

The WINDFOR dataset shows a **systematic positive bias of ~1,714 MW** over January 2026. This likely reflects:

- WINDFOR forecasts are based on installed capacity (potential generation)
- FUELHH WIND records metered/settled MW including any curtailment or non-delivery
- This gap is a real operational insight: procurement teams should apply a **bias correction of ~1.7 GW** when using WINDFOR forecasts

---

## 🛠️ Technology Stack

| Layer            | Technology                                          |
| ---------------- | --------------------------------------------------- |
| Frontend         | React 18, Vite, Recharts, Axios, Lucide React       |
| Backend          | Python 3.12, FastAPI, Uvicorn, pandas, numpy, httpx |
| Caching          | cachetools TTLCache                                 |
| Containerisation | Docker, Docker Compose                              |
| Nginx            | Reverse proxy + SPA serving                         |
| Data             | Elexon BMRS REST API                                |

---

## 🤖 AI Tools Used

This project was developed with assistance from **Google Antigravity (Gemini AI coding assistant)**:

- Scaffolding of project structure
- Backend API client and analytics engine code generation
- Frontend React component development
- CSS design system creation
- Docker and deployment configuration

All generated code was reviewed, validated against the Elexon API, and tested end-to-end.

---

## 📋 API Reference

| Endpoint                                  | Description                                |
| ----------------------------------------- | ------------------------------------------ |
| `GET /api/health`                         | Health check                               |
| `GET /api/actuals/january2026`            | All wind actuals for Jan 2026              |
| `GET /api/actuals/range?from_dt=&to_dt=`  | Custom date range actuals                  |
| `GET /api/forecasts/january2026`          | All WINDFOR forecasts for Jan 2026         |
| `GET /api/forecasts/day-ahead`            | Gate-closure-selected day-ahead forecasts  |
| `GET /api/forecasts/latest-snapshot`      | Most recent forecast run                   |
| `GET /api/forecasts/by-date?target_date=` | All forecast versions for a date           |
| `GET /api/analytics/accuracy`             | Full metrics (MAE, RMSE, MAPE, bias, etc.) |
| `GET /api/analytics/summary`              | Summary metrics                            |

Full interactive docs: `/docs` (Swagger UI)
