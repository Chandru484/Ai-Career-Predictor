# 🧠 AI Career Predictor

> An AI-powered career recommendation system that analyses your skills, interests, and strengths to suggest the best-fit tech career paths — complete with skill gap analysis and a personalized learning roadmap.

![Tech Stack](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.10-3776AB?style=flat&logo=python)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **Top 3 Career Matches** | AI scores your profile against 6 tech career paths |
| 📊 **Confidence Scores** | Percentage match per career with animated progress bars |
| 🧩 **Skill Gap Analysis** | Missing skills highlighted with pill tags |
| 🗺️ **Learning Roadmap** | Personalized step-by-step action plan |
| 📄 **PDF Resume Parsing** | Extracts 40+ tech skills from `.pdf` and `.txt` files |
| 🧠 **spaCy NLP** | Noun-phrase extraction from resume text |

---

## 🖥️ Multi-Page Flow

```
Landing ──▶ Upload ──▶ Questions ──▶ Analyzing ──▶ Results
```

1. **Landing** — Hero page with feature overview
2. **Upload** — Drag-and-drop PDF/TXT resume upload
3. **Questions** — Skills, CGPA, Interests, Strengths form
4. **Analyzing** — Animated triple-ring loading screen
5. **Results** — Career dashboard with cards, gaps & roadmap

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ai-career-predictor
```

### 2. Configure backend environment

Copy `backend/.env.example` to `backend/.env` and fill in your own API keys, Supabase credentials, and Clerk URL before starting the backend.

### 3. Install Python dependencies

```bash
# On Windows
py -3.12 -m venv .venv
.\.venv\Scripts\pip install -r backend\requirements.txt
.\.venv\Scripts\python -m spacy download en_core_web_sm

# On Mac/Linux
python3 -m venv .venv
./.venv/bin/pip install -r backend/requirements.txt
./.venv/bin/python -m spacy download en_core_web_sm
```

> This project uses `.venv` in the current workspace.

### 4. Install frontend dependencies

```bash
npm install
```

### 5. Run locally

Open **two terminals**:

```bash
# Terminal 1 — FastAPI backend (port 8000)
.\.venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Vite frontend (port 5173)
npm run dev
```

Open → **http://localhost:5173**

---

## 🗂️ Project Structure

```
ai-career-predictor/
├── api/
│   ├── index.py          # FastAPI endpoints
│   └── train_model.py    # ML model training script (reference)
├── src/
│   ├── App.jsx           # State-based multi-page router
│   ├── App.css           # Design system (glassmorphism, animations)
│   ├── index.css         # Global reset
│   └── pages/
│       ├── LandingPage.jsx
│       ├── UploadPage.jsx
│       ├── QuestionsPage.jsx
│       ├── AnalyzingPage.jsx
│       └── ResultsPage.jsx
├── env/                  # Python virtual environment
├── vite.config.js        # Vite + proxy config (→ port 8000)
└── requirements.txt      # Python dependencies
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/predict` | Career prediction from profile JSON |
| `POST` | `/api/resume` | Upload PDF/TXT and extract skills |

**Interactive Docs:** http://localhost:8000/api/docs

### Example `/api/predict` Request

```json
{
  "skills": ["python", "react", "sql"],
  "interests": ["machine learning", "backend systems"],
  "cgpa": 8.5,
  "preferred_domain": "",
  "strengths": ["problem solving", "logic"]
}
```

---

## 🧰 Tech Stack

**Frontend:** React 19, Vite 8, Vanilla CSS  
**Backend:** FastAPI, Uvicorn  
**NLP:** spaCy (`en_core_web_sm`)  
**PDF Parsing:** PyMuPDF (fitz)  
**ML:** Custom Jaccard scoring engine  

---

## 🚢 Deployment

| Service | Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) / [Railway](https://railway.app) |

> Set `VITE_API_URL` env variable on Vercel to point to your Render backend URL and update the `fetch` calls accordingly.

---

## 📄 License

MIT
