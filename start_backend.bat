@echo off
echo Starting AI Career Predictor Backend...
if exist ".venv\Scripts\python.exe" (
  .venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
) else (
  py -3.12 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
)
pause
