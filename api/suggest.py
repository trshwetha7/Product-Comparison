from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.core import suggest_query

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def suggest(
    query: str = Query("", min_length=0),
    category: str = Query("all"),
    limit: int = Query(8, ge=1, le=12),
) -> dict:
    return suggest_query(query=query, category=category, limit=limit)
