from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.core import analyze_query

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def analyze(
    query: str = Query("", min_length=0),
    category: str = Query("all"),
    preferred: str = Query(""),
) -> dict:
    return analyze_query(query=query, category=category, preferred=preferred)
