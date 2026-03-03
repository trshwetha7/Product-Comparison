from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.core import analyze_query, model_status, next_fact, suggest_query, train_model_endpoint

app = FastAPI(title="Glow Kind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/api/suggest")
def suggest(
    query: str = Query("", min_length=0),
    category: str = Query("all"),
    limit: int = Query(8, ge=1, le=12),
) -> dict:
    return suggest_query(query=query, category=category, limit=limit)


@app.get("/api/analyze")
def analyze(
    query: str = Query("", min_length=0),
    category: str = Query("all"),
    preferred: str = Query(""),
) -> dict:
    return analyze_query(query=query, category=category, preferred=preferred)


@app.get("/api/fact")
def fact(
    fact_type: str = Query("quick", alias="type"),
    previous: str = Query(""),
) -> dict:
    return next_fact(fact_type=fact_type, previous=previous)


@app.get("/api/model-status")
def get_model_status() -> dict:
    return model_status()


@app.post("/api/train-model")
def train_model(force: bool = Query(False)) -> dict:
    return train_model_endpoint(force=force)
