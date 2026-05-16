# Backend Patch — CORS for the React frontend

The Next.js frontend runs at `http://localhost:3000` and needs explicit CORS
permission to talk to the FastAPI backend.

## Open `app/core/config.py`

Find:

```python
cors_origins: list[str] = ["*"]
```

Replace with:

```python
cors_origins: list[str] = [
    "http://localhost:3000",
    "http://localhost:8501",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8501",
]
```

If your `cors_origins` is already a different value, just make sure
`http://localhost:3000` and `http://127.0.0.1:3000` are included.

## Restart uvicorn

```powershell
# Ctrl+C the current uvicorn, then:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

That's it. Streamlit (port 8501) keeps working alongside Next.js.

## Verify CORS is applied

Open `http://localhost:3000` and look at the sidebar. If it shows
`● ONLINE` with your provider/model, CORS is working. If it shows
`● OFFLINE`, open the browser DevTools console — a CORS error message
there will tell you exactly which origin is being rejected.
