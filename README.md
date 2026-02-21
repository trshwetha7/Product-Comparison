# GlowKind - Clean Beauty Finder

GlowKind is a pastel-themed beauty sustainability app that helps you:

- Search products with typeahead suggestions
- Filter by category (`Fragrances`, `Lip Care`, `Skin Care`, `Eye Makeup`)
- Get estimated `Overall`, `Body Friendly`, and `Eco Friendly` scores
- See ingredient watch-outs (including endocrine-disruptor risk signals)
- Discover cleaner alternatives in the same category without adding extra risk flags
- Read rotating sustainability snippets

The app pulls live product data from [Open Beauty Facts](https://world.openbeautyfacts.org/) and Makeup API.

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript (UI)
- Python + FastAPI (scoring and ranking API)
- Open Beauty Facts API
- Makeup API

## Scoring Method

- `Body Friendly`: baseline minus endocrine/irritant/formulation penalties plus beneficial ingredient boosts.
- `Eco Friendly`: ingredient + packaging + eco-label signals (with ecoscore when available).
- `Clean Score`: weighted blend of body and eco scores with extra penalties for risk flags.
- `Risk Index`: severity aggregate from risk families and penalties.
- `Model Ranking`: percentile-normalized weighted model used for product ordering and alternative ranking.

## Alternative Rules

- Alternatives are scoped to the same product category.
- Alternatives are filtered so they do not introduce additional risk flags compared to the selected product.
- If no safer/equal match exists in current data, no cleaner alternative is shown.

## Run Locally

Use two terminals.

Terminal 1 (backend):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2 (frontend):

```bash
python3 -m http.server 5173
```

Open: [http://localhost:5173](http://localhost:5173)

## Deploy to Vercel

1. Push to GitHub.
2. Import repo in Vercel.
3. Framework: `Other`.
4. Build command: empty.
5. Output directory: empty (root).
6. Deploy.

Vercel serves static files and Python functions under `api/`.

## Notes

- Scores are data-driven heuristics from public data, not medical advice.
- Incomplete ingredient disclosures reduce confidence.
