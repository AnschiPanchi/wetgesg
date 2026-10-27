# WindWatch UK — Presentation & Pitch Video Script (10 Minutes Total)

> **Format Guidelines:**
> - Total length: **~10 minutes**
> - **Part 1 (0:00 - 5:00)**: Product Pitch to the Client (UK Utility Day-Ahead Procurement Team)
> - **Part 2 (5:00 - 10:00)**: Technical Architecture & Code Walkthrough for Internal Tech Lead Review
> - Keep tone confident, practical, and data-backed.

---

# 🎙️ PART 1: Client Pitch (5 Minutes)
**Audience:** Trading Desk Head & Day-Ahead Power Procurement Team  
**Focus:** Commercial value, operational workflow, risk mitigation, and actionable insights.

---

### [0:00 – 1:00] Introduction & The Problem Setting
**Screen:** Open on the **WindWatch UK Dashboard** (`https://wetgesg.vercel.app` or `http://localhost:5174`)

> *"Hello everyone. Today, I'm excited to present **WindWatch UK** — a purpose-built wind power intelligence platform designed specifically for your day-ahead power procurement team.*
>
> *As a UK energy supplier, your goal is simple yet critical: meet your consumers' electricity demand cost-effectively while minimizing imbalance penalties in the Balancing Mechanism.*
>
> *Because wind is intermittent and contributes over 25–30% of the UK grid mix, day-ahead forecasting accuracy directly dictates how much wholesale power you purchase before gate closure. If you overestimate wind, you are left short and forced to buy power in the expensive intraday market or face Cashout prices. If you underestimate wind, you over-procure and spill energy at a loss.*
>
> *WindWatch UK gives your traders real-time visibility, automated day-ahead selection, and rigorous historical accuracy analytics to make profitable, risk-managed procurement decisions."*

---

### [1:00 – 2:15] Live Dashboard & Executive Overview
**Action:** Hover over the top KPI cards (**MAE, RMSE, MAPE, Forecast Bias**) and the January 2026 generation trend.

> *"Let’s look at the live platform. The dashboard provides an instant operational pulse for January 2026:*
>
> 1. *Here we see **Mean Absolute Error (MAE)** of **1,936 MW** and **RMSE** of **2,406 MW**, giving traders a clear baseline uncertainty band.*
> 2. *Our **MAPE** is **18.1%**, and the Pearson correlation between day-ahead forecast and actual metered delivery is a solid **0.88**.*
> 3. *Most importantly, notice this KPI: **Forecast Bias: +1,714 MW**.*
>
> *This is our platform's first critical commercial insight for your team: National Grid ESO's WINDFOR dataset systematically over-forecasted wind generation across January by an average of 1.7 GW. Without our tool, an unadjusted procurement strategy would have under-procured backup generation, creating massive unhedged exposure in the intraday market. With WindWatch UK, your traders know exactly how to de-bias forecasts before bidding."*

---

### [2:15 – 3:30] Forecasts Explorer & Version Evolution
**Action:** Click on the **Forecasts** tab in the top navigation. Scroll through the profile and use the **Forecast Evolution (Delivery Date)** picker.

> *"Now, let's navigate to the **Forecasts Explorer**.*
>
> *In the GB electricity market, gate closure occurs day-ahead. Elexon updates WINDFOR forecasts multiple times a day. A common trader pain point is: 'Which forecast version was actually locked in at gate closure?'*
>
> *WindWatch UK automates this completely. We implement the strict day-ahead gate closure rule: for every delivery hour, we isolate the exact forecast snapshot published right before 23:00 UTC on day D-1.*
>
> *Furthermore, using this date selector, your team can inspect how forecasts evolved over successive model runs for any given day. You can see whether weather models were converging or exhibiting high volatility leading up to delivery."*

---

### [3:30 – 4:30] Accuracy Analytics & Financial Impact
**Action:** Click on the **Accuracy** tab. Show the **Actual vs Forecast Overlay**, the **Error Residuals**, and the **Daily Performance Table**.

> *"Turning to the **Accuracy Analytics** page — this is your risk management headquarters.*
>
> *Here we overlay actual metered generation (Elexon FUELHH) against day-ahead forecasts. Look at the lower chart: the residual errors oscillate around zero, but highlight key ramp-rate events where forecast errors exceeded 4,000 MW.*
>
> *Below, we provide a day-by-day performance breakdown. Traders can sort days by MAE or bias to immediately identify calm-wind vs storm anomalies.*
>
> *Our persistent baseline Skill Score benchmarking proves that physics-based weather models strongly outperform simple persistence, especially during fast-moving frontal weather patterns."*

---

### [4:30 – 5:00] Client Pitch Conclusion & ROI
**Screen:** Return to the main Dashboard.

> *"In summary, WindWatch UK delivers three immediate benefits to your trading desk:*
> 1. *It eliminates manual data consolidation from Elexon BMRS.*
> 2. *It identifies systematic over-forecasting bias (~1.7 GW), protecting you from costly short positions.*
> 3. *It equips your team with empirical uncertainty intervals to size your day-ahead hedging positions with confidence.*
>
> *Thank you. I'd now like to switch gears and walk through the technical architecture and code implementation for our engineering team."*

---

# 💻 PART 2: Technical Review (5 Minutes)
**Audience:** Internal Technical Lead & Engineering Peers  
**Focus:** Architecture, data pipelines, caching, edge cases, algorithms, and code cleanliness.

---

### [5:00 – 6:00] Architecture & System Design
**Action:** Show the project folder structure in VS Code / IDE and open `README.md` architecture diagram.

> *"Welcome to the technical deep-dive. Let’s start with the system architecture.*
>
> *WindWatch UK is architected as a decoupled, high-performance web application:*
> - *The **Frontend** is built in React 18 with Vite, Vanilla CSS design tokens, and Recharts for responsive, GPU-accelerated visualization.*
> - *The **Backend** is an asynchronous FastAPI service in Python 3.12, utilizing Pandas and NumPy for vectorised energy analytics.*
> - *For deployment, the application is fully containerized using multi-stage Docker builds and Docker Compose, with reverse-proxy routing via Nginx and automated CI/CD to Vercel."*

---

### [6:00 – 7:15] Data Pipeline & Elexon BMRS Integration
**Action:** Open `backend/app/elexon_client.py` in the editor.

> *"Let's look at `backend/app/elexon_client.py`.*
>
> *We interface directly with Elexon's BMRS REST API v1 across two primary datasets:*
> 1. *`FUELHH/stream?fuelType=WIND`: Provides half-hourly settled metered generation.*
> 2. *`WINDFOR/stream`: Provides hourly national wind power forecasts across multiple forecast runs.*
>
> *To ensure sub-second response times and prevent rate-limiting against the public Elexon API, we implemented an in-memory **TTLCache** using `cachetools`:*
> - *5-minute TTL for actuals*
> - *15-minute TTL for forecast queries*
>
> *Async HTTP requests are dispatched using `httpx.AsyncClient` with custom timeouts and error handling, ensuring graceful degradation if upstream endpoints throttle."*

---

### [7:15 – 8:30] Core Algorithms: Gate Closure & Analytics Engine
**Action:** Open `backend/app/analytics.py` and highlight `compute_accuracy_metrics` and gate closure matching.

> *"Here in `backend/app/analytics.py` is the core domain logic:*
>
> **1. Temporal Resolution Alignment:**
> *FUELHH actuals are sampled every 30 minutes, whereas WINDFOR forecasts are hourly. Before computing any statistical metrics, we downsample and average the 30-minute actuals into hourly timestamps to maintain strict mathematical consistency.*
>
> **2. Day-Ahead Gate Closure Filtering:**
> *For each target delivery hour $H$ on day $D$, we filter WINDFOR records to find all runs published prior to `(D-1) 23:00 UTC`, then select the latest snapshot. This mirrors the exact operational information state available to a day-ahead market participant.*
>
> **3. Analytics Pipeline:**
> *Using Pandas and NumPy vector operations, we compute MAE, RMSE, MAPE, Mean Bias Error (MBE), Pearson correlation coefficient ($r$), and a persistence-baseline Skill Score:*
> $$\text{Skill Score} = 1 - \frac{\text{RMSE}_{\text{forecast}}}{\text{RMSE}_{\text{persistence}}}$$
> *All metrics are computed in less than 50 milliseconds across 744 hours of data."*

---

### [8:30 – 9:30] Frontend Engineering & UX
**Action:** Open `frontend/src/App.jsx` and `frontend/src/index.css`.

> *"On the frontend:*
> - *We created a custom dark-mode design system in Vanilla CSS using CSS custom properties for color scales, glassmorphism cards, and micro-interactions — avoiding heavy UI library overhead.*
> - *API state is decoupled using a reusable custom React hook `useApiData`, which handles abort controllers, loading spinners, and error boundaries cleanly.*
> - *Charts use custom tooltips and gradient SVG fills that make reading multi-gigawatt power curves intuitive on both desktop and mobile viewports."*

---

### [9:30 – 10:00] Production Readiness & Wrap-up
**Action:** Open `docker-compose.yml` or the deployed production URL `https://wetgesg.vercel.app`.

> *"Finally, the system is production-ready:*
> - *Can be launched with one command: `docker-compose up --build`.*
> - *Deployed live with automated CI/CD on Vercel.*
> - *Includes full OpenAPI Swagger documentation at `/docs`.*
>
> *This concludes our demonstration of WindWatch UK. Both the client-facing product and the underlying codebase are robust, fully documented, and ready for immediate deployment. Thank you!"*
