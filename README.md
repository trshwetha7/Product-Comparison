# GlowKind - Clean Beauty Finder

GlowKind is a beauty sustainability app for searching products, estimating body and eco impact, and comparing safer alternatives.

## Languages and Stack

- HTML
- CSS
- JavaScript
- Python
- FastAPI
- scikit-learn
- Open Beauty Facts API
- Makeup API

## What The Backend Does

The backend is not just serving static data.
It now does three separate things in Python:

1. Fetches product data from public beauty data sources.
2. Extracts structured product features such as ingredient risk counts, endocrine-risk markers, eco-risk markers, packaging signals, ingredient completeness, and beneficial ingredient density.
3. Uses a scikit-learn AutoML-style training step to select the best regressors for:
   - `Body Friendly`
   - `Eco Friendly`
   - `Clean Score`
   - `Risk Index`

## Model Approach

This is a practical AutoML-style backend, not deep learning.

- Candidate models are trained in Python with `scikit-learn`.
- The training script compares multiple regressors and keeps the best-performing model per target.
- The final API uses the trained model artifact if available.
- If no trained artifact exists yet, the backend falls back to the deterministic heuristic scorer.

## Alternative Selection Rules

- Alternatives stay within the same product category.
- Alternatives are filtered so they do not add extra risk flags versus the selected product.
- If no safer/equal product is found in current data, no cleaner alternative is forced.

## Local Run

Run these in `/Users/trshwetha7/Desktop/Clean beauty products`.

Terminal 1: create venv and install deps

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Terminal 1: train the model

```bash
python scripts/train_model.py
```

Terminal 1: start FastAPI backend

```bash
uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2: start frontend

```bash
python3 -m http.server 5173
```

Open:

- `http://localhost:5173`

## Useful Local API Checks

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/model-status
curl "http://127.0.0.1:8000/api/suggest?query=rare%20beauty"
curl "http://127.0.0.1:8000/api/analyze?query=burts%20bees%20lip%20balm&category=lip-care"
```

## Notes

- This is a data-driven scoring system, not medical advice.
- The model quality depends on publicly available ingredient and packaging data.
- If you want true trained labels from expert-reviewed safety data, that would be the next upgrade.
