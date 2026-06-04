# GreenGrid 🌿

**City-level ecosystem intelligence for urban planners.**  
Built for the International Grand Challenge — Indradhanu 2025.

GreenGrid divides a city into administrative wards and uses a multi-model AI pipeline to answer one question that matters: *can this ward support new construction without disrupting its ecosystem?* It computes real-time vulnerability scores, forecasts climate trends 14 days out, and lets planners query the data in plain English via a RAG interface.

---

## What it does

Urban planners today make construction and zoning decisions with limited data on ecological impact. GreenGrid fixes that by turning raw climate and population data into actionable ward-level intelligence.

For each ward, the system:
- Computes a **Heat Risk Index** from temperature, humidity, and precipitation with weighted coefficients
- Multiplies risk against population density to produce a **Population Exposure score**
- Normalises scores across all wards into a 0–100 **Vulnerability Ranking** using MinMaxScaler
- Trains a **Facebook Prophet time-series model** to produce a 14-day temperature forecast with upper/lower confidence intervals
- Serves everything through a **Flask REST API** consumed by a multi-page frontend

---

## Architecture

```
weather_data_with_population.csv
        │
        ▼
greengrid_engine.py          ← ML pipeline
  ├─ load_and_process_data()   Data cleaning + feature engineering
  ├─ get_current_ward_risk()   Heat Risk Index + Vulnerability Score (all wards)
  ├─ get_ward_details()        Full historical data for one ward
  └─ get_ward_forecast()       14-day Prophet forecast for one ward
        │
        ▼
app.py (Flask)               ← REST API
  ├─ GET /api/ward-risk/current
  ├─ GET /api/ward-details/<ward_no>
  └─ GET /api/forecast/<ward_no>
        │
        ▼
Frontend (HTML + JS + CSS)   ← Multi-page UI
  ├─ index.html              Landing page
  ├─ ward-map.html           Live ward map with vulnerability heatmap
  ├─ explore.html            data-driven ward brief
  ├─ compare.html            Side-by-side ward comparison
  ├─ impact.html             Ecosystem impact analysis
  └─ story.html              Narrative / story mode for non-technical users
```

---

## Tech stack

| Layer | Tools |
|---|---|
| ML / Data | Python, pandas, scikit-learn (MinMaxScaler), Facebook Prophet |
| Backend | Flask, Flask-CORS |
| Frontend | Vanilla JS, HTML5, CSS3, Canvas API |
| Data | Weather + population CSV (ward-level) |
| AI layer | Rule-based risk classification with threshold alerts |

---

## Key files

| File | What it does |
|---|---|
| `greengrid_engine.py` | Core ML pipeline — risk scoring, forecasting, data processing |
| `app.py` | Flask server exposing 3 REST endpoints + static file serving |
| `ward-map.html` | Interactive ward map with colour-coded vulnerability scores |
| `explore.html` | Per-ward data explorer — stats, charts, AI brief |
| `compare.html` | Compare any two wards side by side |
| `story.html` | Plain-English narrative mode for planners |
| `weather_data_with_population.csv` | Source dataset — ward climate + population data |

---

## Heat Risk Index formula

```
Heat_Risk_Index = (temperature_max × 0.5) + (humidity_max × 0.3) − (precipitation_sum × 0.2)

Population_At_Risk = Heat_Risk_Index × Population

Vulnerability_Score = MinMaxScaler(Population_At_Risk) → [0, 100]
```

Higher scores mean higher ecological stress relative to population. A ward scoring above 70 warrants review before approving new construction.

---

## Running locally

```bash
# 1. Clone the repo
git clone https://github.com/pxsha23/GreenGrid.git
cd GreenGrid

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the Flask server
python app.py

# 4. Open in browser
# http://localhost:5000
```

---

## API reference

### `GET /api/ward-risk/current`
Returns vulnerability scores for all wards at the most recent date.

```json
[
  {
    "ward_no": 1,
    "ward_name": "Aundh",
    "latitude": 18.56,
    "longitude": 73.81,
    "Population": 95000,
    "Heat_Risk_Index": 42.3,
    "Population_At_Risk": 4018500.0,
    "Vulnerability_Score": 67.4
  }
]
```

### `GET /api/ward-details/<ward_no>`
Returns full historical records for a single ward.

### `GET /api/forecast/<ward_no>`
Returns a 14-day temperature forecast with confidence intervals.

```json
[
  {
    "ds": "2025-07-01",
    "yhat": 34.2,
    "yhat_lower": 31.8,
    "yhat_upper": 36.5
  }
]
```

---

## Frontend pages

**Ward Map** — colour-coded map of all wards by vulnerability score. Click any ward to see its stats and forecast.

**Explore** — drill into a single ward. See its Heat Risk Index, population exposure, historical trends, and AI-generated brief.

**Compare** — pick any two wards and compare them side by side across all metrics.

**Impact** — ecosystem impact view showing what new construction would mean for a ward's risk profile.

**Story Mode** — a narrative walkthrough designed for non-technical stakeholders like city officials.

---

## Built at

**Indradhanu 2025** — International Grand Challenge hosted at PCCOE, Pune.  
Team from Pimpri Chinchwad College of Engineering, Information Technology.

---

## Requirements

```
flask
flask-cors
pandas
scikit-learn
prophet
```

---

## License

MIT
