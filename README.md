# 🌾 Smart Agri Intelligence System
### Kisan Sahayak Portal — किसान सहायक पोर्टल
**Team:** Anti-Gravity Software | **Lead:** Shivansh Tiwari | **Course:** CSE274

---

## 🏗️ System Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│              🌐 REACT.JS FRONTEND (Port 3000)                     │
│                                                                   │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│   │Dashboard │  │ Loss Pred│  │Price Pred│  │  Supply  │        │
│   │ (Home)   │  │(Form+    │  │(Form +   │  │  Chain   │        │
│   │ Stats    │  │ Gauge)   │  │ Chart)   │  │(Cluster) │        │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│   ┌──────────┐  ┌──────────┐                                     │
│   │ History  │  │ Profile  │   Auth: JWT via AuthContext          │
│   │Table+CSV │  │ Edit     │   HTTP: Axios + interceptors         │
│   └──────────┘  └──────────┘                                     │
└──────────────────────────┬────────────────────────────────────────┘
                           │ HTTP/REST (Axios + JWT Bearer Token)
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│              ⚙️  NODE.JS / EXPRESS BACKEND (Port 5000)            │
│                                                                   │
│  authMiddleware (JWT verify) → protect routes                     │
│                                                                   │
│  POST /api/auth/register   → authController.register             │
│  POST /api/auth/login      → authController.login                │
│  GET  /api/auth/me         → authController.getMe                │
│                                                                   │
│  POST /api/predict/loss    → predictionController → mlService    │
│  POST /api/predict/price   → predictionController → mlService    │
│  POST /api/predict/supply  → predictionController → mlService    │
│                                                                   │
│  GET  /api/history         → historyController.getHistory        │
│  DELETE /api/history/:id   → historyController.deleteRecord      │
└──────────┬───────────────────────────────┬────────────────────────┘
           │ Mongoose ODM                  │ Axios HTTP
           ▼                              ▼
┌──────────────────┐         ┌────────────────────────────────────┐
│  🍃 MONGODB       │         │  🐍 PYTHON FLASK ML SERVER (8000)  │
│  (Port 27017)     │         │                                    │
│                  │         │  GET  /health      → status check  │
│  ● users         │         │                                    │
│  ● predictions   │         │  POST /predict/loss                │
│  ● crop_prices   │         │    → preprocess_loss()             │
│  ● supply_chains │         │    → RandomForestClassifier.pkl    │
│                  │         │    → {prediction, probabilities}   │
│  Mongoose Models:│         │                                    │
│  User.js         │         │  POST /predict/price               │
│  Prediction.js   │         │    → preprocess_price()            │
│  CropPrice.js    │         │    → XGBRegressor.pkl              │
└──────────────────┘         │    → {predicted_price, unit}       │
                             │                                    │
                             │  POST /predict/supply              │
                             │    → preprocess_supply()           │
                             │    → KMeans.pkl + StandardScaler   │
                             │    → {cluster, efficiency}         │
                             └────────────────────────────────────┘
```

## 🚀 Quick Start

### Step 1: Configure Environment Variables

Edit the `.env` files:
- `backend/.env` → Set `MONGO_URI` (MongoDB Atlas) and `JWT_SECRET`
- `frontend/.env` → Set `VITE_API_URL` and `VITE_WEATHER_API_KEY`

### Step 2: Train ML Models (optional — stubs work without this)
```bash
cd ml-server
pip install -r requirements.txt
python models/train_loss_model.py
python models/train_price_model.py
python models/train_supply_model.py
```

### Step 3: Start all 3 servers

**Terminal 1 — Python ML Server:**
```bash
cd smart-agri-system/ml-server
python app.py
# → Running on http://localhost:8000
```

**Terminal 2 — Node.js Backend:**
```bash
cd smart-agri-system/backend
npm run dev
# → Running on http://localhost:5000
```

**Terminal 3 — React Frontend:**
```bash
cd smart-agri-system/frontend
npm run dev
# → Running on http://localhost:3000
```

### Or: Run with Docker
```bash
docker-compose up --build
```

---

## 📁 Project Structure

```
smart-agri-system/
├── frontend/             ← React + Vite (Port 3000)
│   └── src/
│       ├── components/   ← Navbar, Sidebar, Charts, Auth forms
│       ├── pages/        ← Home, PredictLoss, PredictPrice, SupplyChain, History, Profile
│       ├── context/      ← AuthContext (JWT + user state)
│       └── api/          ← Axios config + interceptors
│
├── backend/              ← Node.js Express (Port 5000)
│   ├── config/           ← MongoDB connection
│   ├── models/           ← User, Prediction, CropPrice (Mongoose)
│   ├── controllers/      ← Auth, Prediction, History logic
│   ├── routes/           ← REST API routes
│   ├── middleware/        ← JWT auth + error handler
│   └── services/         ← ML bridge (mlService.js)
│
├── ml-server/            ← Python Flask (Port 8000)
│   ├── app.py            ← Flask routes
│   ├── models/           ← Training scripts (RandomForest, XGBoost, KMeans)
│   ├── saved_models/     ← .pkl files (generated after training)
│   ├── utils/            ← preprocessor.py
│   └── requirements.txt
│
├── docker-compose.yml
└── README.md
```

---

## 🔑 API Keys Needed

| Service | Purpose | File | Sign up |
|---|---|---|---|
| MongoDB Atlas | Database | `backend/.env` → `MONGO_URI` | [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas) |
| OpenWeatherMap | Live weather | `frontend/.env` → `VITE_WEATHER_API_KEY` | [openweathermap.org](https://openweathermap.org/api) |
| Open-Meteo | Weather (FREE, no key!) | Built-in | [open-meteo.com](https://open-meteo.com) |
| data.gov.in | Mandi prices | Both `.env` files | [data.gov.in](https://data.gov.in/user/register) |

---

## 🤖 ML Models

| Model | Algorithm | Task | Features |
|---|---|---|---|
| Loss Prediction | RandomForest Classifier | Low/Medium/High risk | crop_type, temp, humidity, storage, transport_time, distance |
| Price Forecast | XGBoost Regressor | ₹/Quintal price | crop_type, season, state, demand_index, supply_index, temp |
| Supply Chain | K-Means Clustering | Efficiency label | delivery_time, transport_cost, storage_avail, distance, spoilage |

---

*Built by Anti-Gravity Software — Shivansh Tiwari · CSE274 Project*
*Smart Agri Intelligence System — Complete Production Build*
